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

	if (result.docs.length > 0) {
		const blogPost = BlogPostOutline.parse(result.docs[0]);

		logger.info({ slug }, "Successfully fetched blog post outline.");

		return blogPost;
	}

	logger.info(
		{ slug },
		"Failed to fetch blog post outline because it was not found.",
	);

	return null;
}
