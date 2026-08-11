/**
 * Keeps a post's share token out of Sentry.
 *
 * The token is a bearer credential travelling in the URL, and the URL is
 * something Sentry attaches on its own: `@sentry/core` writes the full request
 * URL onto every event unconditionally — `dataCollection.urlQueryParams` gates
 * only the separate `query_string` field, and its allow/deny forms are applied
 * to query parameters nowhere in the installed SDK. Redacting the value on the
 * way out is therefore the only mechanism available, which is why this module
 * exists rather than a line of configuration.
 *
 * Everything here is IO-free and total: no `window`, no `document`, no clock,
 * and every input — a malformed URL, a relative one, one carrying no token, one
 * carrying several — has a defined result. That is what makes the whole of it
 * unit-testable, which matters more here than usual, because this code runs
 * inside a `beforeSend` hook where a throw would lose the event.
 *
 * It owns the parameter's name for the telemetry path, so the three Sentry
 * configurations never spell it out themselves.
 */

import type {
	Breadcrumb,
	Contexts,
	Event,
	RequestEventData,
} from "@sentry/nextjs";

/**
 * The query parameter a share link carries its token in — the one
 * `app/(app)/posts/[slug]/page.tsx` reads and `thumbnail.png/route.tsx` reads
 * after it.
 */
export const shareTokenSearchParamName = "token";

/**
 * What a redacted token reads as in a Sentry payload. This is the SDK's own
 * marker for a value it filtered (`FILTERED_VALUE` in `@sentry/core`), so a
 * redaction this module performs is indistinguishable from one the SDK
 * performed, and nobody reading an issue has to learn a second convention.
 */
const redactedShareToken = "[Filtered]";

/**
 * One `token=…` assignment inside a query string.
 *
 * The leading `(^|[?&])` is what keeps `?mytoken=…` and a path segment ending
 * in `token=` out of the match, and matching at the start of the string is what
 * lets this run against a bare query string (`token=…&draft=true`) as well as a
 * whole URL. The value runs to the next `&` or `#`, so a fragment survives and
 * a second parameter after this one is untouched. The name is a literal with no
 * regular-expression metacharacters, so it is interpolated without escaping.
 *
 * Whitespace ends the value too, which matters only away from URLs: a query
 * value cannot carry an unescaped space, so no URL redaction changes, while a
 * free-text breadcrumb message that mentions a share link keeps whatever it
 * said after the link instead of having it swallowed.
 */
const shareTokenAssignmentPattern = new RegExp(
	`(^|[?&])${shareTokenSearchParamName}=[^\\s&#]*`,
	"g",
);

/** The `query_string` shapes the SDK's own request type permits. */
type QueryString = NonNullable<RequestEventData["query_string"]>;

/** The `headers` shape the SDK's own request type permits. */
type RequestHeaders = NonNullable<RequestEventData["headers"]>;

/**
 * Replaces every share-token value in a URL or query string, leaving every
 * other byte of the input exactly as it was.
 *
 * A string carrying no token comes back identical, which is what keeps this
 * safe to run over every event: the common case is a no-op rather than a
 * reserialization that could normalize an unrelated parameter's encoding. A
 * relative URL, a bare query string, and a string that is not a URL at all are
 * handled by the same substitution, so none of them needs `URL` to parse and
 * none of them can throw.
 */
export function redactShareTokenInUrl(url: string): string {
	// `String.prototype.replace` resets a global pattern's `lastIndex` itself, so
	// this module-scope regex is safe to share across calls — which `test()` or
	// `exec()` on the same object would not be.
	return url.replace(
		shareTokenAssignmentPattern,
		(_assignment, separator: string) =>
			`${separator}${shareTokenSearchParamName}=${redactedShareToken}`,
	);
}

/**
 * Whether a URL or query string carries a share token with a value.
 *
 * The client configuration uses this to decide whether the page it is on is one
 * a session replay may be uploaded from.
 *
 * A parameter present but empty reads as **present**, so `?token=` suppresses
 * the replay even though `share-token-match.ts` would never accept that value
 * as a key. The two deliberately disagree, and each errs the safe way for what
 * it decides: the gate refuses to unlock a post on an empty secret, and this
 * refuses to upload a recording of a page whose URL says a secret was being
 * carried.
 *
 * What it literally answers is "would redacting change this string", so a URL
 * that already reads `token=[Filtered]` answers `false`. That is a gap only on
 * paper: the sole caller passes `window.location.search` or a navigation
 * `href`, and nothing redacts a URL before it reaches the address bar — a page
 * genuinely at `?token=[Filtered]` is carrying the literal string as its
 * secret, which no minted token is.
 */
export function hasShareToken(url: string): boolean {
	return redactShareTokenInUrl(url) !== url;
}

/**
 * Redacts every share token an event carries. Returns a new event rather than
 * editing the one it was handed, so nothing downstream observes a half-redacted
 * payload.
 *
 * The pass covers every field of an event that can hold a string, which is the
 * point rather than an excess:
 *
 * | Field | What puts a URL there |
 * | --- | --- |
 * | `request.url`, `request.query_string`, `request.headers` | the request integration; `Referer` on every same-origin subresource |
 * | `breadcrumbs[].message`, `breadcrumbs[].data` | the console and fetch integrations |
 * | `contexts` | `contexts.trace.data` from the span exporter, `contexts.nextjs.request_path` from `captureRequestError` |
 * | `spans[].data` | every child span's attributes |
 * | `exception.values[].value`, `message`, `logentry` | an error message or log line that interpolated the URL |
 * | `extra`, `tags` | `Sentry.setExtra` / `Sentry.setTag` |
 *
 * The last two rows are covered **prospectively**: nothing in this repository
 * writes a request URL into any of them today. They are here because the
 * alternative is an enumeration that has to be revisited every time someone
 * writes ``captureException(new Error(`failed for ${request.url}`))``, and
 * `contexts.nextjs.request_path` is what that costs when a short enumeration is
 * trusted — it shipped the raw token while `request.url` beside it read
 * `[Filtered]`. Covering the whole event is cheaper than being right about which
 * half matters.
 *
 * Generic over the event so one function serves both `beforeSend`, which is
 * handed an `ErrorEvent`, and `beforeSendTransaction`, which is handed a
 * `TransactionEvent`.
 *
 * A value that is not a record — `null` included — is handed straight back. For
 * `null` that is deliberate rather than incidental: `beforeSend` reads a `null`
 * return as "drop this event", so passing the caller's own `null` through
 * preserves a decision already made instead of inventing a drop this module has
 * no business making. Nothing in this repository passes one.
 */
export function redactShareTokenInEvent<E extends Event>(event: E): E {
	if (!isRecord(event)) {
		return event;
	}

	const {
		breadcrumbs,
		contexts,
		exception,
		extra,
		logentry,
		message,
		request,
		spans,
		tags,
	} = event;

	return {
		...event,
		...(isRecord(request)
			? { request: redactShareTokenInRequest(request) }
			: {}),
		...(Array.isArray(breadcrumbs)
			? { breadcrumbs: breadcrumbs.map(redactShareTokenInBreadcrumb) }
			: {}),
		...(isRecord(contexts)
			? { contexts: redactShareTokenInContexts(contexts) }
			: {}),
		...(Array.isArray(spans)
			? { spans: spans.map(redactShareTokenInSpanData) }
			: {}),
		...(isRecord(exception)
			? { exception: redactShareTokenInException(exception) }
			: {}),
		...(typeof message === "string"
			? { message: redactShareTokenInUrl(message) }
			: {}),
		...(isRecord(logentry)
			? { logentry: redactShareTokenInStringValues(logentry) }
			: {}),
		...(isRecord(extra)
			? { extra: redactShareTokenInStringValues(extra) }
			: {}),
		...(isRecord(tags) ? { tags: redactShareTokenInStringValues(tags) } : {}),
	};
}

/**
 * Redacts every share token an exception's values carry.
 *
 * Each value's own strings are rewritten — `value` is the one that can hold an
 * interpolated URL, and `type` and `module` cost nothing to walk beside it —
 * while `mechanism` and `stacktrace` are records and so pass through
 * untouched. A stack frame's `filename` is a bundle URL rather than the page's,
 * so nothing is lost by stopping above it.
 */
function redactShareTokenInException(
	exception: NonNullable<Event["exception"]>,
): NonNullable<Event["exception"]> {
	const { values } = exception;

	return Array.isArray(values)
		? { ...exception, values: values.map(redactShareTokenInStringValues) }
		: exception;
}

function redactShareTokenInRequest(
	request: RequestEventData,
): RequestEventData {
	const { headers, query_string: queryString, url } = request;

	return {
		...request,
		...(isRecord(headers)
			? { headers: redactShareTokenInHeaders(headers) }
			: {}),
		...(typeof url === "string" ? { url: redactShareTokenInUrl(url) } : {}),
		...(queryString === undefined || queryString === null
			? {}
			: // biome-ignore lint/style/useNamingConvention: mirrors the Sentry event payload
				{ query_string: redactShareTokenInQueryString(queryString) }),
	};
}

/**
 * Redacts every share token a request header carries, matching on the header's
 * **value** rather than its name.
 *
 * `Referer` is the header this exists for: `Referrer-Policy:
 * strict-origin-when-cross-origin`, which `next.config.ts` sets, sends the full
 * URL on a same-origin request, so every subresource a draft page asks for —
 * its own `thumbnail.png` included — reports the token-bearing page URL back.
 * Naming that header here would still be the wrong check, for three reasons:
 * its casing is not guaranteed, it is not the only header a URL reaches this
 * map through, and a name-keyed test is one rename away from silently missing.
 *
 * Nothing upstream covers this. `dataCollection.httpHeaders` is enabled, and
 * the SDK's own filter — `SENSITIVE_KEY_SNIPPETS` in `@sentry/core` 10.69 —
 * matches header *names* against snippets like `auth`, `token`, and `secret`,
 * none of which `referer` contains; it is also applied only to span attributes,
 * never to the `request.headers` an event carries.
 *
 * Only a string, or a string inside an array, is rewritten. The SDK declares
 * the values as `string`, but the map is JSON assembled by its request
 * integration, so a value that arrives as something else is handed back exactly
 * as it was rather than coerced — a throw here would lose the event and tear
 * down the response being rendered.
 */
function redactShareTokenInHeaders(headers: RequestHeaders): RequestHeaders {
	return redactShareTokenInStringValues(headers);
}

/**
 * Redacts every share token an event's contexts carry, across a context's own
 * string values **and** the nested `data` record a span-shaped one holds.
 *
 * Both halves are load-bearing, because the two contexts that carry a URL here
 * are shaped differently:
 *
 * - `contexts.trace` carries the root span's attributes under `data`, copied
 *   there verbatim by the OpenTelemetry-to-Sentry exporter — see
 *   {@link redactShareTokenInSpanData}.
 * - `contexts.nextjs` is **flat**. `instrumentation.ts` exports Next's
 *   `onRequestError` hook as `@sentry/nextjs`'s `captureRequestError`, which
 *   sets `{ request_path, router_kind, router_path, route_type }` with no
 *   `data` record at all; Next builds that hook's request object with
 *   `path: req.url || ''`, the request target with its query string. So every
 *   unhandled server-side error on a share link puts the raw token in
 *   `request_path`, which a `data`-only walk hands straight through.
 *
 * Walking every context's own strings is what keeps that from being a list of
 * two names to maintain: the redaction stays matched on the **value**, exactly
 * as the header, span, and breadcrumb passes are, so a context a later SDK
 * version adds is covered without an edit here. A context carrying neither is
 * copied unchanged.
 */
function redactShareTokenInContexts(contexts: Contexts): Contexts {
	return Object.fromEntries(
		Object.entries(contexts).map(([name, context]) => [
			name,
			redactShareTokenInSpanData(redactShareTokenInStringValues(context)),
		]),
	);
}

/**
 * Redacts every share token a span's attributes carry, for one entry of
 * `spans[]` or one context under `contexts`. Both are a record with an optional
 * `data` record of attributes, so one walker serves them.
 *
 * **This is the surface a transaction leaks the token through, and it is not
 * `request`.** Next's root server span sets `'http.target': req.url` — query
 * string included (`next/dist/server/base-server.js`) — and the
 * OpenTelemetry-to-Sentry exporter copies every span attribute verbatim into
 * `contexts.trace.data` and into each `spans[].data`; browser tracing sets
 * `url.full` on the pageload span the same way. With `tracesSampleRate: 1`,
 * every share-link request ships one of these, so `beforeSendTransaction` has
 * to reach here and not only into `request`.
 *
 * Nothing upstream covers it. The SDK's own `SENSITIVE_KEY_SNIPPETS` filter is
 * applied to span attributes, but it matches attribute *names* against snippets
 * like `auth`, `token`, and `secret` — and `http.target`, `url.full`, and
 * `http.url` contain none of them. So this matches on the value, exactly as the
 * header pass above does and for the same reason.
 */
function redactShareTokenInSpanData<S>(span: S): S {
	if (!isRecord(span)) {
		return span;
	}

	const { data } = span;

	if (!isRecord(data)) {
		return span;
	}

	return { ...span, data: redactShareTokenInStringValues(data) };
}

/**
 * Rewrites every string a flat record holds — its own string values, and the
 * string elements of a value that is an array — and leaves every other value
 * exactly as it arrived, which is what keeps this total against the numbers,
 * booleans, objects, and `null`s a JSON payload puts beside them. A value
 * carrying no token comes back identical, so a record with nothing to redact is
 * copied rather than rewritten.
 *
 * Anything that is not a record is handed straight back, so this can be applied
 * inside a `map()` over values the SDK types but does not guarantee — a
 * context, an exception value — without each caller repeating the guard.
 *
 * The assertion holds because each string is replaced by another string and no
 * other value is touched, so the record's declared shape survives — something
 * `Object.entries` erases on the way through.
 */
function redactShareTokenInStringValues<R>(record: R): R {
	if (!isRecord(record)) {
		return record;
	}

	const redacted: Record<string, unknown> = { ...record };

	for (const [key, value] of Object.entries(redacted)) {
		redacted[key] = redactShareTokenInValue(value);
	}

	return redacted as R;
}

/**
 * Rewrites one value of such a record: a string directly, and one level of
 * array inside it.
 *
 * The walk stops at that level deliberately rather than recursing. A console
 * breadcrumb's `data.arguments` is whatever was logged, so it can hold a value
 * that references itself, and an unbounded walk would exhaust the stack inside
 * `beforeSend` — losing the event and tearing down the response being rendered,
 * which is the one failure this module exists to avoid. One level covers every
 * array the SDKs actually build; a token buried deeper than that is accepted.
 */
function redactShareTokenInValue(value: unknown): unknown {
	if (typeof value === "string") {
		return redactShareTokenInUrl(value);
	}

	if (Array.isArray(value)) {
		return value.map((element) =>
			typeof element === "string" ? redactShareTokenInUrl(element) : element,
		);
	}

	return value;
}

/**
 * The SDK types `query_string` three ways — a raw string, an object, or a list
 * of pairs — and which one arrives depends on the integration that built the
 * event, so all three are handled rather than the one seen in testing.
 * Anything else is handed back untouched rather than coerced.
 */
function redactShareTokenInQueryString(queryString: QueryString): QueryString {
	if (typeof queryString === "string") {
		return redactShareTokenInUrl(queryString);
	}

	if (Array.isArray(queryString)) {
		return queryString.map(redactShareTokenInQueryPair);
	}

	if (isRecord(queryString)) {
		return Object.fromEntries(
			Object.entries(queryString).map(redactShareTokenInQueryPair),
		);
	}

	return queryString;
}

/**
 * Whether a value is a plain, non-null object, which is what separates a field
 * the SDK populated from one it left as `null`.
 *
 * The event types declare these fields optional, so TypeScript is satisfied by
 * an `undefined` check — but the payload is JSON built by several integrations,
 * and a `null` reaches here in practice. A hook that throws loses the event and
 * takes the response being rendered with it, so every branch below narrows on
 * the runtime value rather than trusting the declared type.
 *
 * An array is excluded even though `typeof [] === "object"`. No SDK builds one
 * where a record is declared, but every caller that passes this guard goes on
 * to spread the value into an object literal, which would turn an array into
 * `{ 0: …, 1: … }` — a silent reshaping rather than the pass-through every other
 * unexpected shape here gets. The pair-list form of `query_string` is checked
 * with `Array.isArray` before this runs, so nothing that wants an array loses
 * one.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Rewrites one `[name, value]` pair. Destructuring is done inside rather than in
 * the parameter list, because the pair-list form of `query_string` is JSON and a
 * malformed entry would throw on the way in.
 *
 * The parameter is `unknown` rather than the pair type the SDK declares, so that
 * the guard below is one TypeScript cannot prove unreachable. Declaring it as a
 * pair would make the compiler agree the check is dead while the runtime still
 * needs it — the event is JSON assembled by an integration, and a `null` entry
 * reaches here in practice. An entry that is not a pair is handed straight back,
 * exactly as every other unexpected shape in this module is.
 */
function redactShareTokenInQueryPair(pair: unknown): [string, string] {
	if (!Array.isArray(pair)) {
		return pair as [string, string];
	}

	const [name, value] = pair as [string, string];

	return name === shareTokenSearchParamName
		? [name, redactedShareToken]
		: [name, value];
}

/**
 * Redacts every share token a breadcrumb carries, across its `message` and
 * every string in its `data` — matching on the **value** rather than on a list
 * of key names, exactly as the header and span passes above do.
 *
 * The console integration is why both halves are needed. It is on by default in
 * both SDKs, and it builds `{ data: { arguments: args, logger: "console" },
 * message: formatConsoleArgs(args) }` — so a log line that interpolated the
 * request URL puts the token in `message`, which no key list reaches, and in
 * `data.arguments`, which is an array rather than a string. Nothing under
 * `app/`, `payload/`, or `shared/` calls `console.*`, but the framework and its
 * dependencies do, and that is not a guarantee this module should depend on.
 * Verified against `@sentry/core` and `@sentry/browser` 10.69.
 */
function redactShareTokenInBreadcrumb(breadcrumb: Breadcrumb): Breadcrumb {
	if (!isRecord(breadcrumb)) {
		return breadcrumb;
	}

	const { data, message } = breadcrumb;

	return {
		...breadcrumb,
		...(typeof message === "string"
			? { message: redactShareTokenInUrl(message) }
			: {}),
		...(isRecord(data) ? { data: redactShareTokenInStringValues(data) } : {}),
	};
}
