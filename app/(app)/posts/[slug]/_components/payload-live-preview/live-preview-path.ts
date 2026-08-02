import { BlogPostSlug } from "@/shared/blog-post-slug";

/**
 * The query the live preview iframe carries. `page.tsx` builds it, and Payload's
 * `livePreview.url` on the `blog-posts` collection mirrors it verbatim, so the
 * two accepted forms are a path with this exact query and the same path without
 * one.
 */
const LIVE_PREVIEW_QUERY = "preview=true&draft=true";

/** Matches a single-segment post path, rejecting a nested or trailing-slash one. */
const postPathPattern = /^\/posts\/([^/?#]+)$/;

/**
 * Resolves the route path a live preview refresh may revalidate, or `null` when
 * the argument is not one the live preview produces.
 *
 * `refresh.ts` is a `"use server"` export and therefore a public endpoint, so
 * its argument is attacker-controlled: an unconstrained string reaching
 * `revalidatePath()` lets any caller evict the cache for any route. This keeps
 * the accepted set to what the preview actually sends — the index route and one
 * post route whose slug satisfies the same schema the CMS field and
 * `posts/[slug]/caches` enforce.
 *
 * It lives apart from the action so it stays a pure function the unit suite can
 * exercise without pulling `next/cache` and the action boundary into Jest.
 */
export function resolveLivePreviewPath(path: string): string | null {
	const [pathname, query, ...rest] = path.split("?");

	// the query has to be absent or exactly the preview one — matching it loosely
	// (by parameter, or by prefix) would accept a caller-appended parameter. a
	// second `?` never appears in either accepted shape, so `rest` must be empty.
	if (
		rest.length > 0 ||
		(query !== undefined && query !== LIVE_PREVIEW_QUERY)
	) {
		return null;
	}

	if (pathname === "/") {
		return "/";
	}

	const postPath = postPathPattern.exec(pathname);

	if (postPath === null) {
		return null;
	}

	const slug = BlogPostSlug.safeParse(postPath[1]);

	return slug.success ? `/posts/${slug.data}` : null;
}
