import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { getPayload } from "payload";
import z from "zod";
import { canReadDrafts } from "@/helpers/draft-access";
import { config } from "@/payload/config";
import { rootLogger } from "@/shared/logger";
import {
	PayloadBlogPost,
	type PayloadLocale,
	resolveThumbnailImage,
} from "@/shared/payload-types";

const logger = rootLogger.child({ module: "📥" });

const BlogPostSummary = PayloadBlogPost.transform((blogPost) => ({
	slug: blogPost.slug,
	title: blogPost.title,
	brief: blogPost.brief,
	thumbnailImage: resolveThumbnailImage(blogPost.coverImage),
	publishedAt: blogPost.publishedAt ?? blogPost.createdAt,
	updatedAt: blogPost.updatedAt,
}));

export type BlogPostSummary = z.infer<typeof BlogPostSummary>;

/**
 * Loads the post list. `draft: true` is honoured only for a request carrying a
 * Payload session; an unauthenticated caller is served the published posts.
 */
export async function getBlogPosts({
	locale,
	draft = false,
}: {
	locale: PayloadLocale;
	draft?: boolean;
}): Promise<BlogPostSummary[]> {
	// short-circuits so the published path never reads `headers()` and stays
	// statically renderable.
	return await findBlogPosts({
		locale,
		draft: draft && (await canReadDrafts()),
	});
}

async function findBlogPosts({
	locale,
	draft,
}: {
	locale: PayloadLocale;
	draft: boolean;
}): Promise<BlogPostSummary[]> {
	"use cache";

	cacheLife("hours");
	// locale-independent tag so a single revalidateTag busts every locale's
	// cached list entry (both locales render at the same URL).
	cacheTag("blog-posts");

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
		where: {
			...(draft
				? {}
				: {
						_status: {
							equals: "published",
						},
					}),
		},
		locale,
		sort: ["-publishedAt"],
		// intentional cap: the index renders one unpaginated list, and this returns
		// `result.docs` directly, so a 51st post would be dropped from it silently.
		// the site is far from that count; raising the cap or paginating the index
		// is the fix if it ever approaches it.
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
