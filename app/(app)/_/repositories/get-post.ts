import { getPayload } from "payload";
import type z from "zod";
import { rootLogger } from "@/logger";
import config from "@/payload-config";
import { PayloadBlogPost } from "./payload-types";

const logger = rootLogger.child({ module: "📥" });

const BlogPostDetail = PayloadBlogPost.transform((post) => ({
	slug: post.slug,
	title: post.title,
	brief: post.brief,
	tags: post.tags,
	thumbnailImage: post.coverImage.sizes.og,
	author: post.author,
	publishedAt: post.publishedAt ?? post.createdAt,
	updatedAt: post.updatedAt,
}));

export type BlogPostDetail = z.infer<typeof BlogPostDetail>;

export async function getPost({
	slug,
	draft = false,
}: {
	slug: string;
	draft?: boolean;
}): Promise<BlogPostDetail | null> {
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

		logger.info({ slug }, "Successfully fetched post.");

		return blogPost;
	}

	logger.info({ slug }, "Failed to fetch post because it was not found.");

	return null;
}
