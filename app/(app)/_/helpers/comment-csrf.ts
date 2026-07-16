/**
 * Double-submit CSRF token for the public comment-create endpoint.
 *
 * The token endpoint (`GET /posts/[slug]/comments/token`) mints a random token,
 * returns it in the response body, and pins the same value in a `SameSite=Strict`,
 * `HttpOnly` cookie. The composer echoes the returned token in a request header
 * when it submits; the POST handler accepts the write only when the header value
 * matches the cookie value. A cross-site page can neither read the token (the
 * same-origin policy hides the issuing response body) nor cause the `Strict`
 * cookie to be sent, so it cannot forge a matching pair. This is defense in depth
 * on top of the same-site origin check in `request-origin.ts`.
 */

/** Cookie the token endpoint pins the CSRF token in (HttpOnly, SameSite=Strict). */
export const COMMENT_CSRF_COOKIE = "comment-csrf-token";

/** Request header the composer echoes the issued token back in. */
export const COMMENT_CSRF_HEADER = "x-comment-csrf-token";

/** Mints a fresh, unguessable token. */
export function createCommentCsrfToken(): string {
	return crypto.randomUUID();
}

/**
 * Whether the request carries a matching double-submit token: the
 * `COMMENT_CSRF_HEADER` value must equal the `COMMENT_CSRF_COOKIE` value, with
 * both present. Compared in constant time so a mismatch cannot leak the cookie
 * value through response timing.
 */
export function hasMatchingCommentCsrfToken(request: Request): boolean {
	const header = request.headers.get(COMMENT_CSRF_HEADER);
	const cookie = readCookie(request.headers.get("cookie"), COMMENT_CSRF_COOKIE);

	if (!header || !cookie) {
		return false;
	}

	return timingSafeEqual(header, cookie);
}

function readCookie(cookieHeader: string | null, name: string): string | null {
	if (!cookieHeader) {
		return null;
	}

	for (const part of cookieHeader.split(";")) {
		const separator = part.indexOf("=");

		if (separator === -1) {
			continue;
		}

		if (part.slice(0, separator).trim() === name) {
			return decodeURIComponent(part.slice(separator + 1).trim());
		}
	}

	return null;
}

function timingSafeEqual(a: string, b: string): boolean {
	if (a.length !== b.length) {
		return false;
	}

	let mismatch = 0;

	// Bitwise accumulation compares every character regardless of an early
	// mismatch, so the loop's timing does not reveal the cookie value.
	// biome-ignore-start lint/suspicious/noBitwiseOperators: constant-time token comparison
	for (let i = 0; i < a.length; i += 1) {
		mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
	}
	// biome-ignore-end lint/suspicious/noBitwiseOperators: constant-time token comparison

	return mismatch === 0;
}
