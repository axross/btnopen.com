"use server";

import { cacheLife } from "next/cache";
import { getPayload } from "payload";
import type z from "zod";
import { rootLogger } from "@/logger";
import { config } from "@/payload/config";
import { PayloadBlogPost } from "./payload-types";

const logger = rootLogger.child({ module: "📥" });

const BlogPostDetail = PayloadBlogPost.transform((blogPost) => ({
	slug: blogPost.slug,
	title: blogPost.title,
	brief: blogPost.brief,
	tags: blogPost.tags,
	thumbnailImage: blogPost.coverImage.sizes.og,
	author: blogPost.author,
	publishedAt: blogPost.publishedAt ?? blogPost.createdAt,
	updatedAt: blogPost.updatedAt,
}));

export type BlogPostDetail = z.infer<typeof BlogPostDetail>;

export async function getBlogPost({
	slug,
	draft = false,
}: {
	slug: string;
	draft?: boolean;
}): Promise<BlogPostDetail | null> {
	"use cache";

	cacheLife("hours");

	logger.info({ slug, draft }, "Started fetching post.");

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
		locale: "ja-JP",
		limit: 1,
		draft,
	});

	if (result.docs.length > 0) {
		const blogPost = BlogPostDetail.parse(result.docs[0]);

		logger.info({ slug }, "Successfully fetched blog post.");

		return blogPost;
	}

	logger.info({ slug }, "Failed to fetch blog post because it was not found.");

	return null;
}
