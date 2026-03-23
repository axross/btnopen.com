import { getPayload } from "payload";
import z from "zod";
import { rootLogger } from "@/logger";
import config from "@/payload-config";
import { PayloadBlogPost } from "./payload-types";

const logger = rootLogger.child({ module: "📥" });

const BlogPostSummary = PayloadBlogPost.transform((post) => ({
	slug: post.slug,
	title: post.title,
	brief: post.brief,
	thumbnailImage: post.coverImage.sizes.og,
	publishedAt: post.createdAt,
	updatedAt: post.updatedAt,
}));

export type BlogPostSummary = z.infer<typeof BlogPostSummary>;

export async function getPosts({
	draft,
}: {
	draft?: boolean;
} = {}): Promise<BlogPostSummary[]> {
	logger.info("Started fetching posts.");

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
			createdAt: true,
			updatedAt: true,
		},
		depth: 2,
		locale: "ja-JP",
		sort: ["-createdAt"],
		limit: 50,
		draft,
	});

	const posts: BlogPostSummary[] = [];

	for (const doc of result.docs) {
		const parseResult = BlogPostSummary.safeParse(doc);

		if (parseResult.success) {
			posts.push(parseResult.data);
		}

		if (parseResult.error) {
			logger.warn(
				{ slug: doc.slug, error: z.flattenError(parseResult.error) },
				"Skipped a post due to parse error.",
			);
		}
	}

	logger.info("Finished fetching posts.");

	return posts;
}
