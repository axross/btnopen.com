import { revalidatePath, revalidateTag } from "next/cache";
import type { NextRequest } from "next/server";
import { isSameSiteRequest } from "@/helpers/request-origin";
import { BlogPostSlug } from "@/shared/blog-post-slug";
import { rootLogger } from "@/shared/logger";

const logger = rootLogger.child({ module: "🧹" });

/**
 * Busts the cached output for one blog post. Called by the blog post collection
 * hook for each affected document, so a publish, unpublish, or delete appears
 * without a redeploy.
 *
 * The Payload hook's same-process `fetch` carries no browser origin headers and
 * so passes the same-site check, while a browser-driven cross-site call is
 * rejected. (A shared-secret header would harden this further against direct
 * calls; deferred deliberately across all three cache endpoints, because the
 * effect is only an idempotent revalidation.)
 *
 * The slug is parsed before it reaches `revalidatePath()` or a cache tag: it
 * arrives as a raw URL segment, and interpolating one into a revalidation path
 * is a cache-poisoning vector.
 */
export async function DELETE(
	request: NextRequest,
	{
		params,
	}: {
		params: Promise<{ slug: string }>;
	},
): Promise<Response> {
	// the origin check runs before any parsing, so a cross-site caller learns
	// nothing about which slugs are valid.
	if (!isSameSiteRequest(request)) {
		return Response.json({ error: "Cross-site request." }, { status: 403 });
	}

	const { slug: rawSlug } = await params;
	const parsedSlug = BlogPostSlug.safeParse(rawSlug);

	if (!parsedSlug.success) {
		logger.warn(
			{ slug: rawSlug },
			"Rejected a blog post cache revalidation for an invalid slug.",
		);

		return Response.json({ error: "Invalid slug." }, { status: 400 });
	}

	const slug = parsedSlug.data;

	revalidatePath(`/posts/${slug}`, "page");
	// the post's cached data is keyed per locale; the locale-independent tag
	// busts every locale's entry in one call.
	revalidateTag(`blog-post:${slug}`, "max");

	logger.info({ slug }, "Revalidated the blog post cache.");

	return new Response(null, { status: 204 });
}
