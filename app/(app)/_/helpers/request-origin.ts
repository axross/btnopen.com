/**
 * Whether a mutation request originates from the site itself, used to reject
 * cross-site (CSRF) writes on `route.ts` mutation handlers.
 *
 * Prefers the browser-set `Sec-Fetch-Site` header; falls back to comparing the
 * `Origin` host against the request `Host` for clients that omit it. A request
 * carrying neither header — a same-process server call such as the Payload
 * cache-invalidation hook's `fetch` — is treated as same-site.
 */
export function isSameSiteRequest(request: Request): boolean {
	const secFetchSite = request.headers.get("sec-fetch-site");

	if (secFetchSite) {
		// `none` = a direct user navigation (typed URL / bookmark), not cross-site.
		return (
			secFetchSite === "same-origin" ||
			secFetchSite === "same-site" ||
			secFetchSite === "none"
		);
	}

	const origin = request.headers.get("origin");

	if (!origin) {
		return true;
	}

	try {
		return new URL(origin).host === request.headers.get("host");
	} catch {
		return false;
	}
}
