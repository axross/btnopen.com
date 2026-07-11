"use server";

import { cacheLife, cacheTag } from "next/cache";
import { getPayload } from "payload";
import z from "zod";
import { rootLogger } from "@/logger";
import { config } from "@/payload/config";
import { type PayloadLocale, PayloadNonEmptyString } from "./payload-types";

const logger = rootLogger.child({ module: "📥" });

// focused schema for the outline query: only the fields the outline preview
// selects, so it validates independently of the full `PayloadBlogPost` shape
// (which would require selecting brief/tags/coverImage/author too).
const BlogPostOutline = z
	.object({
		title: PayloadNonEmptyString.describe("Localized blog post title."),
		outline: z
			.string()
			.nullish()
			.describe("Authoring outline markdown, or null when unset."),
	})
	.transform((blogPost) => ({
		title: blogPost.title,
		outline: blogPost.outline ?? null,
	}));

export type BlogPostOutline = z.infer<typeof BlogPostOutline>;

export async function getBlogPostOutline({
	slug,
	locale,
	draft = false,
}: {
	slug: string;
	locale: PayloadLocale;
	draft?: boolean;
}): Promise<BlogPostOutline | null> {
	"use cache";

	cacheLife("hours");
	// shares the post's tag so revalidating a post busts its outline across
	// every locale too.
	cacheTag(`blog-post:${slug}`);

	logger.info({ slug, draft }, "Started fetching post outline.");

	const payload = await getPayload({ config });
	const result = await payload.find({
		collection: "blog-posts",
		select: {
			title: true,
			outline: true,
		},
		depth: 1,
		where: {
			slug: {
				equals: slug,
			},
			...(draft
				? {}
				: {
						_status: {
							equals: "published",
						},
					}),
		},
		locale,
		limit: 1,
		draft,
	});

	if (result.docs.length === 0) {
		logger.info(
			{ slug },
			"Failed to fetch blog post outline because it was not found.",
		);

		return null;
	}

	const blogPost = BlogPostOutline.parse(result.docs[0]);

	// The outline is often authored on the published document, so a post's draft
	// version can lack it even when the published document has one. When
	// previewing a draft (`draft: true`), fall back to the published outline so
	// the preview still shows it instead of the empty state.
	if (draft && !blogPost.outline?.trim()) {
		const publishedOutline = await findPublishedOutline({
			payload,
			slug,
			locale,
		});

		if (publishedOutline) {
			logger.info(
				{ slug },
				"Completed fetching post outline (published fallback for draft preview).",
			);

			return { ...blogPost, outline: publishedOutline };
		}
	}

	logger.info({ slug }, "Completed fetching post outline.");

	return blogPost;
}

async function findPublishedOutline({
	payload,
	slug,
	locale,
}: {
	payload: Awaited<ReturnType<typeof getPayload>>;
	slug: string;
	locale: PayloadLocale;
}): Promise<string | null> {
	logger.info({ slug }, "Started fetching published outline fallback.");

	const result = await payload.find({
		collection: "blog-posts",
		select: {
			outline: true,
		},
		depth: 1,
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

	logger.info({ slug }, "Completed fetching published outline fallback.");

	const outline = result.docs[0]?.outline;

	return typeof outline === "string" && outline.trim() ? outline : null;
}
