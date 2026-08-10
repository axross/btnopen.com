import { timingSafeEqual } from "./timing-safe-equal";

/** The two tokens a share-link check compares. */
export interface ShareTokenMatchInput {
	/** The token the request carried, if it carried one. */
	supplied: null | string | undefined;
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
 * Neither value is logged, and neither is returned.
 */
export function matchesShareToken({
	supplied,
	stored,
}: ShareTokenMatchInput): boolean {
	if (!supplied || !stored) {
		return false;
	}

	// a length mismatch is rejected inside the comparison, before it looks at any
	// character, so a wrong-length token needs no separate branch here.
	return timingSafeEqual(supplied, stored);
}
