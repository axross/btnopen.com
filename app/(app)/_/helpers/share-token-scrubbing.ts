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
 * **The walk names no event field, and that is the whole design.** Four
 * successive review rounds each found the same defect in an earlier shape of
 * this module — a field carrying the request URL that the walk did not reach —
 * and each patched the instance it found: `request.headers`, then
 * `contexts.trace.data` and `spans[].data`, then `contexts.nextjs.request_path`,
 * then `spans[].description`, which a browser pageload ships on every share-link
 * visit. The defect was never any one of those fields; it was that the walk was
 * a list. So {@link redactShareTokenInEvent} walks the event as an anonymous
 * JSON tree — every string, at every depth, under every key, in every array —
 * and matches on the **value**. A field a later SDK version adds is covered on
 * the day it appears rather than on the day someone notices it, and there is no
 * list here that can fall behind the payload.
 *
 * Two things follow from matching on the value rather than the field, and both
 * are accepted rather than overlooked:
 *
 * - **It over-redacts.** Any string anywhere in an event that reads like a
 *   `token=…` assignment is rewritten, including a source-context line quoting
 *   one. Losing a byte of diagnostic context is the cheap direction of this
 *   trade; the expensive one is a secret in an issue nobody notices.
 * - **It cannot recognize a bare secret.** A token that reaches an event already
 *   split from its parameter name — the object and pair-list forms of
 *   `request.query_string` — carries nothing to match on, so the walk also
 *   replaces the value bound to the **name** {@link shareTokenSearchParamName},
 *   whether that binding is a record key or the head of a `[name, value]` pair.
 *   That rule is likewise positionless: it holds wherever such a binding appears,
 *   not only under `query_string`.
 *
 * `sdkProcessingMetadata` is the one field lifted out of the walk. It is the
 * only part of an event that is not JSON — it carries the live Node request
 * object and the captured scopes — and `@sentry/core`'s `createEventEnvelope`
 * deletes it before serializing, so nothing under it is ever sent. Note the
 * direction: an *exclusion* that turns out to be wrong costs a traversal, while
 * an inclusion list that turns out to be short costs a leaked secret, which is
 * why this module is willing to hold the former and not the latter.
 *
 * Everything here is IO-free and total: no `window`, no `document`, no clock,
 * and every input — a malformed URL, a relative one, one carrying no token, one
 * carrying several, an event nested arbitrarily deep, an event that references
 * itself — has a defined result. That is what makes the whole of it
 * unit-testable, which matters more here than usual, because this code runs
 * inside a `beforeSend` hook where a throw would lose the event.
 *
 * It owns the parameter's name for the telemetry path, so the three Sentry
 * configurations never spell it out themselves.
 */

import type { Event } from "@sentry/nextjs";

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
 * What can stand immediately before a `token=…` assignment.
 *
 * `?` and `&` are the literal separators, and matching at the start of the
 * string is what lets this run against a bare query string (`token=…&draft=true`)
 * as well as a whole URL. The two escaped forms are there because a URL does not
 * always reach a Sentry event in the shape the address bar holds it: `&amp;`
 * is what an HTML-escaped href reads as when an error message or a hydration
 * diff quotes one, and `%3F` / `%26` are what the link's own separators become
 * once it is nested as a query value of another URL. The alternation is ordered
 * so `&amp;` is tried before the bare `&` it starts with.
 *
 * What this deliberately keeps out of the match is `?mytoken=…`, a path segment
 * ending in `token=`, and anything else where the name is merely a suffix.
 */
const shareTokenSeparatorPattern = "^|&amp;|[?&]|%3[Ff]|%26";

/**
 * What can bind the name to its value: a literal `=`, or the percent-encoded
 * form the same nesting produces.
 */
const shareTokenAssignmentOperatorPattern = "=|%3[Dd]";

/**
 * How far a token's value runs.
 *
 * To the next `&` or `#`, so a fragment survives and a second parameter after
 * this one is untouched — and to the next `%26` or `%23`, so the same holds for
 * a re-encoded URL. Whitespace ends the value too, which matters only away from
 * URLs: a query value cannot carry an unescaped space, so no URL redaction
 * changes, while a free-text breadcrumb message that mentions a share link keeps
 * whatever it said after the link instead of having it swallowed.
 */
const shareTokenValuePattern = "(?:(?!%26|%23)[^\\s&#])*";

/**
 * One `token=…` assignment, in any of the forms a URL reaches an event in.
 *
 * The separator and the operator are captured so the replacement can put back
 * exactly what it found, leaving a re-encoded URL re-encoded rather than
 * normalizing it into a shape it never had. The name is a literal with no
 * regular-expression metacharacters, so it is interpolated without escaping.
 */
const shareTokenAssignmentPattern = new RegExp(
	`(${shareTokenSeparatorPattern})${shareTokenSearchParamName}(${shareTokenAssignmentOperatorPattern})${shareTokenValuePattern}`,
	"g",
);

/**
 * What a value the walk refuses to descend into reads as. Both are the strings
 * `@sentry/core`'s own `normalize` writes for the same two cases, for the same
 * reason `[Filtered]` is reused above: a reader of an issue meets one
 * convention rather than two.
 */
const circularValueMarker = "[Circular ~]";
const truncatedObjectMarker = "[Object]";
const truncatedArrayMarker = "[Array]";

/**
 * How deep the walk descends before it stops.
 *
 * A cycle is caught by the ancestor set rather than by this, so what this bounds
 * is the other way a walk can exhaust the stack: a structure that is deep
 * without ever referring to itself, which a logged value can be. The SDK
 * normalizes the deep-prone fields to `normalizeDepth` — 3 by default — before
 * `beforeSend` runs, so nothing reaches this in practice; it is the guard for
 * the day that option is turned off, and it sits far enough out that no real
 * event notices it.
 */
const maximumWalkDepth = 32;

/** Elements in a `[name, value]` pair. */
const shareTokenPairLength = 2;

/**
 * Replaces every share-token value in a URL or query string, leaving every
 * other byte of the input exactly as it was.
 *
 * A string carrying no token comes back identical, which is what keeps this
 * safe to run over every string in an event: the common case is a no-op rather
 * than a reserialization that could normalize an unrelated parameter's encoding.
 * A relative URL, a bare query string, and a string that is not a URL at all are
 * handled by the same substitution, so none of them needs `URL` to parse and
 * none of them can throw.
 */
export function redactShareTokenInUrl(url: string): string {
	// `String.prototype.replace` resets a global pattern's `lastIndex` itself, so
	// this module-scope regex is safe to share across calls — which `test()` or
	// `exec()` on the same object would not be.
	return url.replace(
		shareTokenAssignmentPattern,
		(_assignment, separator: string, operator: string) =>
			`${separator}${shareTokenSearchParamName}${operator}${redactedShareToken}`,
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
 * Redacts every share token an event carries, anywhere it carries one. Returns
 * a new event rather than editing the one it was handed, so nothing downstream
 * observes a half-redacted payload.
 *
 * The event is walked as an anonymous JSON tree rather than field by field —
 * see this module's own documentation for why that is the design and not an
 * excess. Nothing below names `request`, `breadcrumbs`, `contexts`, `spans`,
 * `exception`, `message`, `logentry`, `extra`, `tags`, or `transaction`, and
 * that is the point: each of those is reached because it is part of the event,
 * not because it is on a list.
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
	if (typeof event !== "object" || event === null || Array.isArray(event)) {
		return event;
	}

	const { sdkProcessingMetadata, ...walkable } = event;
	const redacted = redactShareTokenInValue(walkable, new WeakSet(), 0) as E;

	return sdkProcessingMetadata === undefined
		? redacted
		: { ...redacted, sdkProcessingMetadata };
}

/**
 * Rewrites one value of the tree, whatever it is.
 *
 * A string is redacted; a number, a boolean, a `null`, an `undefined`, and
 * anything else that is not an object is handed straight back. That
 * pass-through is what makes the walk total against a payload the SDK types but
 * does not guarantee — the event is JSON assembled by several integrations, and
 * a `null` where a record is declared reaches here in practice, where a throw
 * would lose the event and tear down the response being rendered.
 *
 * `ancestors` holds the objects on the path from the event down to this value,
 * so a value that refers to one of them is a cycle rather than an infinite
 * walk. It is emptied on the way back out, so a value that legitimately appears
 * twice in different branches is redacted in both rather than reported as
 * circular in the second.
 */
function redactShareTokenInValue(
	value: unknown,
	ancestors: WeakSet<object>,
	depth: number,
): unknown {
	if (typeof value === "string") {
		return redactShareTokenInUrl(value);
	}

	if (typeof value !== "object" || value === null) {
		return value;
	}

	// a marker rather than the value itself, in both branches below. handing back
	// the original subtree would be the one outcome this module cannot allow: it
	// would put an unredacted branch — token and all — into the event that is
	// about to be sent.
	if (ancestors.has(value)) {
		return circularValueMarker;
	}

	if (depth >= maximumWalkDepth) {
		return Array.isArray(value) ? truncatedArrayMarker : truncatedObjectMarker;
	}

	ancestors.add(value);

	try {
		return Array.isArray(value)
			? redactShareTokenInArray(value, ancestors, depth)
			: redactShareTokenInRecord(
					value as Record<string, unknown>,
					ancestors,
					depth,
				);
	} finally {
		ancestors.delete(value);
	}
}

/**
 * Rewrites every element of an array, and the pair-list form of
 * `request.query_string` along with them.
 *
 * A two-element array headed by the parameter's own name is that form's entry —
 * `["token", "…"]` — where the value carries no `token=` prefix to match on, so
 * the name standing beside it is the only thing that identifies it. The check is
 * positionless deliberately: it holds wherever such a pair appears rather than
 * only under `query_string`, which is what keeps it from becoming the kind of
 * field list this module exists without. What it costs is that
 * `console.log("token", …)` has its second argument redacted, which is the
 * harmless direction.
 */
function redactShareTokenInArray(
	values: unknown[],
	ancestors: WeakSet<object>,
	depth: number,
): unknown[] {
	if (
		values.length === shareTokenPairLength &&
		values[0] === shareTokenSearchParamName &&
		typeof values[1] === "string"
	) {
		return [shareTokenSearchParamName, redactedShareToken];
	}

	return values.map((element) =>
		redactShareTokenInValue(element, ancestors, depth + 1),
	);
}

/**
 * Rewrites every value a record holds, and replaces outright the one bound to
 * the parameter's own name — the object form of `request.query_string`, where
 * the value is the bare secret with nothing to match on.
 *
 * The record is copied by spread rather than rebuilt from `Object.entries`, so a
 * key the payload holds as a symbol survives the pass. The assertion at the call
 * site holds because each string is replaced by another string and the shape of
 * every other value is preserved, so the record's declared type survives —
 * something `Object.entries` erases on the way through.
 */
function redactShareTokenInRecord(
	record: Record<string, unknown>,
	ancestors: WeakSet<object>,
	depth: number,
): Record<string, unknown> {
	const redacted: Record<string, unknown> = { ...record };

	for (const [name, value] of Object.entries(redacted)) {
		redacted[name] =
			name === shareTokenSearchParamName && typeof value === "string"
				? redactedShareToken
				: redactShareTokenInValue(value, ancestors, depth + 1);
	}

	return redacted;
}
