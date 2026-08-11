import { timingSafeEqual } from "./timing-safe-equal";

/** The two tokens a share-link check compares. */
export interface ShareTokenMatchInput {
	/** The token the request carried, if it carried one. */
	supplied: unknown;
	/** The token stored on the post, if the post has one. */
	stored: null | string | undefined;
}

/**
 * Whether a supplied share token unlocks the post it was sent for.
 *
 * This is where the share link's security sits, so it is deliberately pure and
 * IO-free: everything it decides is decided from its two arguments, and the
 * whole of it is unit-testable. An absent or empty token on either side never
 * matches — which is what stops an empty `token` parameter from unlocking a
 * post that has no stored token yet.
 *
 * The supplied side is typed `unknown` and narrowed here rather than declared a
 * string, because it originates in a URL: Next.js hands back an array for a
 * repeated search parameter, and an array of the stored token's length would
 * otherwise pass the length guard inside {@link timingSafeEqual} and reach
 * `charCodeAt` on a value that has none. Callers normalize at the route
 * boundary; this refuses anything that is not a string regardless, because the
 * cost of being wrong here is a 500 on a page an anonymous visitor can request.
 *
 * Neither value is logged, and neither is returned.
 */
export function matchesShareToken({
	supplied,
	stored,
}: ShareTokenMatchInput): boolean {
	if (typeof supplied !== "string" || typeof stored !== "string") {
		return false;
	}

	if (supplied === "" || stored === "") {
		return false;
	}

	// a length mismatch is rejected inside the comparison, before it looks at any
	// character, so a wrong-length token needs no separate branch here.
	return timingSafeEqual(supplied, stored);
}
