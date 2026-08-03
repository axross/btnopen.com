/** Inputs needed to decide how a blog-post read is served. */
export interface PostReadModeInput {
	/** Whether the caller asked for the draft view. */
	requested: boolean;
	/**
	 * Whether the request is allowed to read drafts — the result of
	 * `canReadDrafts()`.
	 */
	permitted: boolean;
}

/** How a blog-post read is served. */
export type PostReadMode = "draft" | "published";

/**
 * Decides whether a blog-post read is served as a draft or as the published
 * document.
 *
 * The draft view is served only to a request that both asked for it and carries
 * a Payload session permitted to read drafts; every other combination falls
 * back to the published document, which is what keeps unpublished content
 * private.
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
