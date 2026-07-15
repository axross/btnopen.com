/** Inputs needed to decide whether a blog-post write should bust public caches. */
export interface PostCacheInvalidationInput {
	/** The Payload operation that ran (`create`, `update`, `delete`, …). */
	operation: string;
	/** Whether the write targeted a draft version (autosave implies this). */
	draft?: boolean | null;
}

/**
 * Decides whether a blog-post operation changed publicly cached output and thus
 * needs cache invalidation.
 *
 * Draft and autosave writes never affect the published pages the public cache
 * serves, so they are skipped — this keeps every autosave off the two serial
 * cache-busting round-trips. Only writes that change published output
 * invalidate: deletes always, and non-draft creates/updates — publish and
 * unpublish both write the canonical, non-draft document.
 */
export function shouldInvalidatePostCaches({
	operation,
	draft,
}: PostCacheInvalidationInput): boolean {
	if (operation === "delete") {
		return true;
	}

	if (
		operation === "create" ||
		operation === "update" ||
		operation === "updateByID"
	) {
		return !draft;
	}

	return false;
}
