import { revalidateTag } from "next/cache";
import type { NextRequest } from "next/server";
import { isSameSiteRequest } from "@/helpers/request-origin";
import { rootLogger } from "@/logger";

const logger = rootLogger.child({ module: "🌏" });

/**
 * Busts the cached comment threads for a post. Called by the comments
 * collection hook when a comment's approval state changes, so approving a
 * comment or posting an author reply in the admin appears without a redeploy.
 *
 * The Payload hook's same-process `fetch` carries no browser origin headers and
 * so passes the same-site check, while a browser-driven cross-site call is
 * rejected. (A shared-secret header would harden this further against direct
 * calls; deferred for consistency with the existing `posts/[slug]/caches`
 * endpoint, and because the effect is only an idempotent tag revalidation.)
 */
export async function DELETE(
	request: NextRequest,
	{
		params,
	}: {
		params: Promise<{ slug: string }>;
	},
): Promise<Response> {
	const { slug } = await params;

	if (!isSameSiteRequest(request)) {
		return Response.json({ error: "Cross-site request." }, { status: 403 });
	}

	revalidateTag(`blog-post-comments:${slug}`, "max");

	logger.info({ slug }, "Revalidated the blog post comment cache.");

	return new Response(null, { status: 204 });
}
