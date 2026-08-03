import "server-only";

import { cacheLife } from "next/cache";
import { getPayload } from "payload";
import z from "zod";
import { config } from "@/payload/config";
import { rootLogger } from "@/shared/logger";
import type { PayloadLocale } from "@/shared/payload-types";

const logger = rootLogger.child({ module: "📥" });

// focused schema for the `<Media>` view: only the fields that component reads,
// so it validates independently of the full `PayloadUpload` shape (which would
// require selecting `url`/`filename`/`sizes` too). every field is nullable
// because an upload document carries file metadata only once a file is
// attached, and `alt` is optional on the collection.
const MediaFile = z
	.object({
		mimeType: z
			.string()
			.nullish()
			.describe("MIME type of the stored file, or null when unknown."),
		width: z
			.number()
			.nonnegative()
			.nullish()
			.describe("Intrinsic image width in pixels, or null for a non-image."),
		height: z
			.number()
			.nonnegative()
			.nullish()
			.describe("Intrinsic image height in pixels, or null for a non-image."),
		alt: z
			.string()
			.nullish()
			.describe("Localized alt text, or null when unset."),
	})
	.transform((media) => ({
		mimeType: media.mimeType ?? null,
		width: media.width ?? null,
		height: media.height ?? null,
		alt: media.alt ?? null,
	}));

export type MediaFile = z.infer<typeof MediaFile>;

/**
 * Loads one media upload for rendering inside a post body. Returns `null` when
 * the id resolves to nothing, so a body image whose media document was deleted
 * degrades to a missing image instead of failing the page render.
 *
 * The `media` collection is public-readable and holds no draft state, so this
 * takes no `draft` parameter — unlike its `blog-posts` siblings.
 */
export async function getMedia({
	id,
	locale,
}: {
	id: string;
	locale: PayloadLocale;
}): Promise<MediaFile | null> {
	"use cache";

	cacheLife("hours");

	logger.info({ id }, "Started fetching media.");

	const payload = await getPayload({ config });
	// `find` rather than `findByID`: it takes the full bound set (`where` and
	// `limit` included), and it answers a missing id with an empty page where
	// `findByID` throws `NotFound`.
	const result = await payload.find({
		collection: "media",
		select: {
			mimeType: true,
			width: true,
			height: true,
			alt: true,
		},
		depth: 0,
		where: {
			id: {
				equals: id,
			},
		},
		locale,
		limit: 1,
	});

	const doc = result.docs[0];

	if (!doc) {
		logger.warn({ id }, "Failed to fetch media because it was not found.");

		return null;
	}

	const parseResult = MediaFile.safeParse(doc);

	if (!parseResult.success) {
		logger.warn(
			{ id, error: z.flattenError(parseResult.error) },
			"Failed to fetch media due to parse error.",
		);

		return null;
	}

	logger.info({ id }, "Completed fetching media.");

	return parseResult.data;
}
