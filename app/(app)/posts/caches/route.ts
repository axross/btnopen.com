import { revalidatePath, revalidateTag } from "next/cache";
import type { NextRequest } from "next/server";
import { isSameSiteRequest } from "@/helpers/request-origin";
import { rootLogger } from "@/shared/logger";

const logger = rootLogger.child({ module: "🌏" });

/**
 * Busts the cached blog post list and website records. Called by the blog post
 * collection hook whenever a publish, unpublish, or delete changes what the
 * index renders, so the change appears without a redeploy.
 *
 * The Payload hook's same-process `fetch` carries no browser origin headers and
 * so passes the same-site check, while a browser-driven cross-site call is
 * rejected. (A shared-secret header would harden this further against direct
 * calls; deferred deliberately across all three cache endpoints, because the
 * effect is only an idempotent revalidation.)
 */
export async function DELETE(request: NextRequest): Promise<Response> {
	if (!isSameSiteRequest(request)) {
		return Response.json({ error: "Cross-site request." }, { status: 403 });
	}

	revalidatePath("/", "page");
	// the blog-post list and website records are cached per locale; these
	// locale-independent tags bust every locale's entry in one call.
	revalidateTag("blog-posts", "max");
	revalidateTag("website", "max");

	logger.info("Revalidated all blog post caches.");

	return new Response(null, { status: 204 });
}
