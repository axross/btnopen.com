import { revalidatePath } from "next/cache";
import type { NextRequest } from "next/server";
import { rootLogger } from "@/logger";

const logger = rootLogger.child({ module: "🌏" });

export async function DELETE(_: NextRequest) {
	revalidatePath("/", "page");

	logger.info("Revalidated all blog post caches.");

	return new Response(null, { status: 204 });
}
