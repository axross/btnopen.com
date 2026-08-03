import "server-only";

import { headers } from "next/headers";
import { getPayload } from "payload";
import { cache } from "react";
import { config } from "@/payload/config";
import { rootLogger } from "@/shared/logger";

const logger = rootLogger.child({ module: "🔐" });

/**
 * Resolves whether the current request is allowed to read unpublished content.
 *
 * Repository functions call this before letting a requested `draft: true` reach
 * `payload.find(…)`, so an unauthenticated visitor is silently served the
 * published view instead of the draft. React's `cache()` deduplicates the
 * session lookup across every repository a single request touches.
 *
 * The site's own reads deliberately keep Payload's default `overrideAccess:
 * true` — the public surface renders relationships (`tags`, `author`) and the
 * `website` global whose collection `read` rules require a user, so enforcing
 * them here would break anonymous rendering rather than harden it. This gate is
 * therefore the control that keeps drafts private; call it from every new code
 * path that forwards a `draft` flag.
 *
 * Note this reads `headers()`, which opts the caller out of static rendering.
 * Call it only when a draft was actually requested, never on the published
 * path.
 */
export const canReadDrafts = cache(async (): Promise<boolean> => {
	try {
		const payload = await getPayload({ config });
		const { user } = await payload.auth({ headers: await headers() });

		if (!user) {
			logger.info("Denied a draft read to an unauthenticated request.");

			return false;
		}

		return true;
	} catch (error) {
		// fail closed: an unreadable session is not an authenticated one.
		logger.warn(
			{ error },
			"Denied a draft read because the session check failed.",
		);

		return false;
	}
});
