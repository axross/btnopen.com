import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { getPayload } from "payload";
import type z from "zod";
import { canReadDrafts } from "@/helpers/draft-access";
import { resolvePostReadMode } from "@/helpers/post-read-mode";
import { config } from "@/payload/config";
import { rootLogger } from "@/shared/logger";
import {
	PayloadBlogPost,
	type PayloadLocale,
	resolveThumbnailImage,
} from "@/shared/payload-types";

const logger = rootLogger.child({ module: "📥" });

const BlogPostDetail = PayloadBlogPost.transform((blogPost) => ({
	slug: blogPost.slug,
	title: blogPost.title,
	brief: blogPost.brief,
	tags: blogPost.tags,
	thumbnailImage: resolveThumbnailImage(blogPost.coverImage),
	author: blogPost.author,
	isCommentsEnabled: blogPost.isCommentsEnabled,
	publishedAt: blogPost.publishedAt ?? blogPost.createdAt,
	updatedAt: blogPost.updatedAt,
}));

export type BlogPostDetail = z.infer<typeof BlogPostDetail>;

/**
 * Loads a post for the detail view. `draft: true` is honoured only for a
 * request carrying a Payload session; an unauthenticated caller is served the
 * published version (or nothing) instead. The published read is cached and
 * tagged; the draft read is not — see {@link resolvePostReadMode}.
 */
export async function getBlogPost({
	slug,
	locale,
	draft = false,
}: {
	slug: string;
	locale: PayloadLocale;
	draft?: boolean;
}): Promise<BlogPostDetail | null> {
	const mode = resolvePostReadMode({
		requested: draft,
		// short-circuits so the published path never reads `headers()` and stays
		// statically renderable.
		permitted: draft ? await canReadDrafts() : false,
	});

	return mode === "draft"
		? await findBlogPost({ slug, locale, draft: true })
		: await findPublishedBlogPost({ slug, locale });
}

async function findPublishedBlogPost({
	slug,
	locale,
}: {
	slug: string;
	locale: PayloadLocale;
}): Promise<BlogPostDetail | null> {
	"use cache";

	cacheLife("hours");
	// locale-independent tag so a single revalidateTag busts every locale's
	// cached entry for this post (both locales render at the same URL).
	cacheTag(`blog-post:${slug}`);

	return await findBlogPost({ slug, locale, draft: false });
}

async function findBlogPost({
	slug,
	locale,
	draft,
}: {
	slug: string;
	locale: PayloadLocale;
	draft: boolean;
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
			isCommentsEnabled: true,
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
		locale,
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
