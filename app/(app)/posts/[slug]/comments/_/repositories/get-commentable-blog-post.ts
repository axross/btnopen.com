import "server-only";

import { getPayload } from "payload";
import z from "zod";
import { config } from "@/payload/config";
import { rootLogger } from "@/shared/logger";
import type { PayloadLocale } from "@/shared/payload-types";

const logger = rootLogger.child({ module: "📥" });

// focused schema for the comment write gate: the post's id, which the created
// comment references, and the flag that decides whether it accepts one.
const CommentableBlogPost = z
	.object({
		id: z.number().describe("Blog post document ID."),
		isCommentsEnabled: z
			.boolean()
			.nullish()
			.describe("Whether the post accepts reader comments."),
	})
	.transform((blogPost) => ({
		id: blogPost.id,
		// the field is unset on posts created before it existed, and the collection
		// treats an unset flag as enabled.
		isCommentsEnabled: blogPost.isCommentsEnabled !== false,
	}));

export type CommentableBlogPost = z.infer<typeof CommentableBlogPost>;

/**
 * Loads the published post a reader comment would attach to, or `null` when no
 * published post carries the slug.
 *
 * Deliberately uncached, unlike its shared `app/(app)/_/repositories/` siblings:
 * it gates a write, so a `"use cache"` entry would let a post whose
 * `isCommentsEnabled` was just turned off keep accepting comments for the rest
 * of the cache lifetime.
 */
export async function getCommentableBlogPost({
	slug,
	locale,
}: {
	slug: string;
	locale: PayloadLocale;
}): Promise<CommentableBlogPost | null> {
	logger.info({ slug }, "Started fetching commentable blog post.");

	const payload = await getPayload({ config });
	const result = await payload.find({
		collection: "blog-posts",
		select: {
			isCommentsEnabled: true,
		},
		depth: 0,
		where: {
			slug: {
				equals: slug,
			},
			_status: {
				equals: "published",
			},
		},
		locale,
		limit: 1,
	});

	const doc = result.docs[0];

	if (!doc) {
		logger.info(
			{ slug },
			"Failed to fetch commentable blog post because it was not found.",
		);

		return null;
	}

	const parseResult = CommentableBlogPost.safeParse(doc);

	if (!parseResult.success) {
		logger.warn(
			{ slug, error: z.flattenError(parseResult.error) },
			"Failed to fetch commentable blog post due to parse error.",
		);

		return null;
	}

	logger.info({ slug }, "Completed fetching commentable blog post.");

	return parseResult.data;
}
