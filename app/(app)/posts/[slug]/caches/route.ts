import { revalidatePath } from "next/cache";
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

	logger.info({ slug }, "Revalidated the post cache.");

	return new Response(null, { status: 204 });
}
