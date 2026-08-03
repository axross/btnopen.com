"use server";

import { revalidatePath } from "next/cache";
import { canReadDrafts } from "@/helpers/draft-access";
import { rootLogger } from "@/shared/logger";
import { resolveLivePreviewPath } from "./live-preview-path";

const logger = rootLogger.child({ module: "👁️" });

/**
 * Busts the cached output for one route on behalf of the Payload live preview,
 * so an author's edit appears in the preview frame.
 *
 * The `"use server"` here is correct — the live preview client component
 * genuinely invokes this — but it also makes the export a public endpoint that
 * has to authorize its own caller. Two checks stand between the argument and
 * `revalidatePath()`: the path must be one the preview produces, and the caller
 * must hold a Payload session, since live preview only ever runs inside the
 * same-origin admin iframe. Either failing is ignored rather than thrown, so a
 * stale preview frame cannot surface an error to the author.
 *
 * The path check runs first deliberately: it is a string comparison, so a
 * malformed argument costs no session lookup, and neither outcome is
 * observable to the caller.
 */
export async function refresh(path: string): Promise<void> {
	const resolvedPath = resolveLivePreviewPath(path);

	if (resolvedPath === null) {
		logger.warn(
			{ path },
			"Ignored a live preview refresh for a path outside the live preview set.",
		);

		return;
	}

	if (!(await canReadDrafts())) {
		logger.warn(
			{ path: resolvedPath },
			"Ignored a live preview refresh from an unauthenticated request.",
		);

		return;
	}

	revalidatePath(resolvedPath, "page");
}
