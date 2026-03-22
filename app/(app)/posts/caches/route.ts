import { revalidatePath } from "next/cache";
import type { NextRequest } from "next/server";
import { rootLogger } from "@/logger";

const logger = rootLogger.child({ module: "🌏" });

export async function DELETE(_: NextRequest) {
	revalidatePath("/");

	logger.info("Revalidated all post caches.");

	return new Response(null, { status: 204 });
}
