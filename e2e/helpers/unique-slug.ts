// tests that create their own post need a slug no other run can collide with:
// `repeatEach` runs each test twice, workers run in parallel when a base URL is
// set, and a previous run may have died before its teardown deleted the post.
export function uniqueSlug(
	prefix: string,
	repeat: number,
	worker: number,
): string {
	return `${prefix}-${repeat}-${worker}-${Date.now()}`;
}
