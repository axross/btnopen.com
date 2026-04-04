"use server";

import { cacheLife } from "next/cache";
import { getPayload } from "payload";
import z from "zod";
import { rootLogger } from "@/logger";
import { config } from "@/payload/config";
import { PayloadBlogPost } from "./payload-types";

const logger = rootLogger.child({ module: "📥" });

const BlogPostSummary = PayloadBlogPost.transform((blogPost) => ({
	slug: blogPost.slug,
	title: blogPost.title,
	brief: blogPost.brief,
	thumbnailImage: blogPost.coverImage.sizes.og,
	publishedAt: blogPost.publishedAt ?? blogPost.createdAt,
	updatedAt: blogPost.updatedAt,
}));

export type BlogPostSummary = z.infer<typeof BlogPostSummary>;

export async function getBlogPosts({
	draft = false,
}: {
	draft?: boolean;
} = {}): Promise<BlogPostSummary[]> {
	"use cache";

	cacheLife("hours");

	logger.info("Started fetching blog posts.");

	const payload = await getPayload({ config });
	const result = await payload.find({
		collection: "blog-posts",
		select: {
			slug: true,
			title: true,
			brief: true,
			tags: true,
			coverImage: true,
			author: true,
			publishedAt: true,
			createdAt: true,
			updatedAt: true,
		},
		depth: 2,
		where: draft
			? undefined
			: {
					_status: {
						equals: "published",
					},
				},
		locale: "ja-JP",
		sort: ["-publishedAt"],
		limit: 50,
		draft,
	});

	const blogPosts: BlogPostSummary[] = [];

	for (const doc of result.docs) {
		const parseResult = BlogPostSummary.safeParse(doc);

		if (parseResult.success) {
			blogPosts.push(parseResult.data);
		}

		if (!draft && parseResult.error) {
			logger.warn(
				{ slug: doc.slug, error: z.flattenError(parseResult.error) },
				"Skipped a blog post due to parse error.",
			);
		}
	}

	logger.info("Finished fetching blog posts.");

	return blogPosts;
}
