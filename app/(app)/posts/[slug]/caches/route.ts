import { revalidatePath, revalidateTag } from "next/cache";
import type { NextRequest } from "next/server";
import { rootLogger } from "@/logger";

const logger = rootLogger.child({ module: "🌏" });

export async function DELETE(
	_: NextRequest,
	{
		params,
	}: {
		params: Promise<{ slug: string }>;
	},
) {
	const { slug } = await params;

	revalidatePath(`/posts/${slug}`, "page");
	// the post's cached data is keyed per locale; the locale-independent tag
	// busts every locale's entry in one call.
	revalidateTag(`blog-post:${slug}`, "max");

	logger.info({ slug }, "Revalidated the blog post cache.");

	return new Response(null, { status: 204 });
}
