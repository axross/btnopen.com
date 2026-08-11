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

import type { Breadcrumb, Event, RequestEventData } from "@sentry/nextjs";

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
 */
const shareTokenAssignmentPattern = new RegExp(
	`(^|[?&])${shareTokenSearchParamName}=[^&#]*`,
	"g",
);

/** The `query_string` shapes the SDK's own request type permits. */
type QueryString = NonNullable<RequestEventData["query_string"]>;

/**
 * The breadcrumb `data` keys that hold a URL in the installed SDK: `url` on a
 * `fetch` or `xhr` crumb, and `from` / `to` on a `navigation` one. Verified
 * against `@sentry/browser` 10.69's breadcrumbs integration rather than assumed
 * — a key added by a later version is a key this misses, so re-check the list
 * when the SDK moves.
 */
const urlBearingBreadcrumbDataKeys = ["url", "from", "to"];

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
 * a session replay may be uploaded from. A parameter present but empty reads as
 * absent, matching the gate in `share-token-match.ts`, which never accepts one.
 */
export function hasShareToken(url: string): boolean {
	return redactShareTokenInUrl(url) !== url;
}

/**
 * Redacts every share token an event carries: the request URL, the separate
 * `query_string` field, and each breadcrumb URL. Returns a new event rather
 * than editing the one it was handed, so nothing downstream observes a
 * half-redacted payload.
 *
 * Generic over the event so one function serves both `beforeSend`, which is
 * handed an `ErrorEvent`, and `beforeSendTransaction`, which is handed a
 * `TransactionEvent`.
 */
export function redactShareTokenInEvent<E extends Event>(event: E): E {
	if (!isRecord(event)) {
		return event;
	}

	const { breadcrumbs, request } = event;

	return {
		...event,
		...(isRecord(request)
			? { request: redactShareTokenInRequest(request) }
			: {}),
		...(Array.isArray(breadcrumbs)
			? { breadcrumbs: breadcrumbs.map(redactShareTokenInBreadcrumb) }
			: {}),
	};
}

function redactShareTokenInRequest(
	request: RequestEventData,
): RequestEventData {
	const { query_string: queryString, url } = request;

	return {
		...request,
		...(typeof url === "string" ? { url: redactShareTokenInUrl(url) } : {}),
		...(queryString === undefined || queryString === null
			? {}
			: // biome-ignore lint/style/useNamingConvention: mirrors the Sentry event payload
				{ query_string: redactShareTokenInQueryString(queryString) }),
	};
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
 * Whether a value is a non-null object, which is what separates a field the SDK
 * populated from one it left as `null`.
 *
 * The event types declare these fields optional, so TypeScript is satisfied by
 * an `undefined` check — but the payload is JSON built by several integrations,
 * and a `null` reaches here in practice. A hook that throws loses the event and
 * takes the response being rendered with it, so every branch below narrows on
 * the runtime value rather than trusting the declared type.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

/**
 * Rewrites one `[name, value]` pair. Destructuring is done inside rather than in
 * the parameter list, because the pair-list form of `query_string` is JSON and a
 * malformed entry would throw on the way in.
 */
function redactShareTokenInQueryPair(pair: [string, string]): [string, string] {
	if (!Array.isArray(pair)) {
		return pair;
	}

	const [name, value] = pair;

	return name === shareTokenSearchParamName
		? [name, redactedShareToken]
		: [name, value];
}

function redactShareTokenInBreadcrumb(breadcrumb: Breadcrumb): Breadcrumb {
	if (!isRecord(breadcrumb)) {
		return breadcrumb;
	}

	const { data } = breadcrumb;

	if (!isRecord(data)) {
		return breadcrumb;
	}

	const redacted = { ...data };

	for (const key of urlBearingBreadcrumbDataKeys) {
		const value = redacted[key];

		// only a string is rewritten: the SDK types breadcrumb data as open, so a
		// key holding a number or an object is left exactly as it arrived.
		if (typeof value === "string") {
			redacted[key] = redactShareTokenInUrl(value);
		}
	}

	return { ...breadcrumb, data: redacted };
}
