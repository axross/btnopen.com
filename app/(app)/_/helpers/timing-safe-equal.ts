/**
 * Constant-time string comparison, for every path here that checks a secret a
 * caller supplied against one this server holds.
 *
 * `===` returns as soon as two strings diverge, so how long it takes reveals
 * how many leading characters were right — enough, across many attempts, to
 * recover a secret one character at a time. This compares every character
 * regardless, so the timing carries no such signal.
 *
 * Length is deliberately not hidden: two strings of different lengths return
 * immediately. Every secret compared through this helper is fixed-length, so
 * its length is public anyway and is not the part worth protecting.
 *
 * This is the repository's single definition — the comment CSRF check and the
 * blog-post share-token check both call it, so there is one implementation to
 * audit rather than two that can drift apart.
 */
export function timingSafeEqual(a: string, b: string): boolean {
	if (a.length !== b.length) {
		return false;
	}

	let mismatch = 0;

	// bitwise accumulation compares every character regardless of an early
	// mismatch, so the loop's timing does not reveal the expected value.
	// biome-ignore-start lint/suspicious/noBitwiseOperators: constant-time token comparison
	for (let i = 0; i < a.length; i += 1) {
		mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
	}
	// biome-ignore-end lint/suspicious/noBitwiseOperators: constant-time token comparison

	return mismatch === 0;
}
