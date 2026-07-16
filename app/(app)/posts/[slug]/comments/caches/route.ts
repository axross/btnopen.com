import { revalidateTag } from "next/cache";
import type { NextRequest } from "next/server";
import { rootLogger } from "@/logger";

const logger = rootLogger.child({ module: "🌏" });

/**
 * Busts the cached comment threads for a post. Called by the comments
 * collection hook when a comment's approval state changes, so approving a
 * comment or posting an author reply in the admin appears without a redeploy.
 */
export async function DELETE(
	_: NextRequest,
	{
		params,
	}: {
		params: Promise<{ slug: string }>;
	},
): Promise<Response> {
	const { slug } = await params;

	revalidateTag(`blog-post-comments:${slug}`, "max");

	logger.info({ slug }, "Revalidated the blog post comment cache.");

	return new Response(null, { status: 204 });
}
