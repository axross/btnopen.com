/** Inputs needed to decide how a blog-post read is served. */
export interface PostReadModeInput {
	/** Whether the caller asked for the draft view. */
	requested: boolean;
	/**
	 * Whether the request is allowed to read this post's draft. Two gates answer
	 * it, and which one a caller uses is the caller's decision, not this
	 * function's: `canReadDrafts()` for a post-agnostic read — the index list and
	 * the agentic view — and `canReadPostDraft()` for the two single-post reader
	 * surfaces, which a share token can also unlock.
	 */
	permitted: boolean;
}

/** How a blog-post read is served. */
export type PostReadMode = "draft" | "published";

/**
 * Decides whether a blog-post read is served as a draft or as the published
 * document.
 *
 * The draft view is served only to a request that both asked for it and was
 * permitted it; every other combination falls back to the published document,
 * which is what keeps unpublished content private. This function decides
 * nothing about permission itself — it pairs a request with an answer someone
 * else resolved, which is what keeps it pure and total.
 *
 * The two modes also differ in caching, deliberately. A published read is
 * served from a `"use cache"` entry tagged for the post, which a publish busts.
 * A draft read is served uncached, because draft and autosave writes skip cache
 * invalidation entirely (see `payload/helpers/post-cache-invalidation.ts`) — a
 * cached draft entry would have nothing to evict it, and would serve an author
 * their own stale content until it aged out.
 */
export function resolvePostReadMode({
	requested,
	permitted,
}: PostReadModeInput): PostReadMode {
	return requested && permitted ? "draft" : "published";
}
