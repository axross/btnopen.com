import { revalidatePath, revalidateTag } from "next/cache";
import type { NextRequest } from "next/server";
import { rootLogger } from "@/logger";

const logger = rootLogger.child({ module: "🌏" });

export async function DELETE(_: NextRequest) {
	revalidatePath("/", "page");
	// the blog-post list and website records are cached per locale; these
	// locale-independent tags bust every locale's entry in one call.
	revalidateTag("blog-posts", "max");
	revalidateTag("website", "max");

	logger.info("Revalidated all blog post caches.");

	return new Response(null, { status: 204 });
}
