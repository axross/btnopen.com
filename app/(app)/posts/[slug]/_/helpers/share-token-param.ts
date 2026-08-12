/**
 * Normalizes the `token` search parameter into the single opaque string every
 * consumer expects.
 *
 * Next.js delivers an **array** for a repeated search parameter, so
 * `?token=a&token=b` arrives as `["a", "b"]`. Nothing downstream is shaped for
 * that: the gate hands the value to a constant-time character comparison, which
 * an array of the right length would reach and fail inside. Normalizing here,
 * at the boundary where the request stops being a URL, is what keeps every
 * consumer able to declare a plain string.
 *
 * The first value wins, which is what `URLSearchParams.get()` returns and
 * therefore what `thumbnail.png/route.tsx` already reads — so one request never
 * resolves two ways across the page and the thumbnail it advertises.
 */
export function readShareToken(
	token: string | string[] | undefined,
): string | undefined {
	return Array.isArray(token) ? token[0] : token;
}
