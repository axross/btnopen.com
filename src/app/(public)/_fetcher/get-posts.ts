import config from "@payload-config";
import { getPayload } from "payload";
import { rootLogger } from "@/logger";

const logger = rootLogger.child({}, { msgPrefix: "📥 " });

interface BlogPostSummary {
	slug: string;
	title: string;
	brief: string;
	tags: { slug: string; name: string }[];
	thumbnailImage: {
		url: string;
		width: number;
		height: number;
	};
	publishedAt: string;
	updatedAt: string;
}

export async function getPosts(): Promise<BlogPostSummary[]> {
	"use cache";

	logger.debug("Started fetching posts.");

	const payload = await getPayload({ config });
	const result = await payload.find({
		collection: "blog-posts",
		limit: 50,
		depth: 2,
		select: {
			slug: true,
			title: true,
			brief: true,
			tags: true,
			coverImage: true,
			publishedAt: true,
			updatedAt: true,
		},
	});

	const posts: BlogPostSummary[] = [];

	for (const doc of result.docs) {
		if (
			doc.slug &&
			doc.title &&
			doc.brief &&
			Array.isArray(doc.tags) &&
			doc.coverImage &&
			typeof doc.coverImage !== "number" &&
			doc.coverImage.sizes?.og?.url &&
			doc.coverImage.sizes?.og?.width &&
			doc.coverImage.sizes?.og?.height
		) {
			const tags: BlogPostSummary["tags"] = [];

			for (const tag of doc.tags) {
				if (typeof tag !== "number" && tag.slug && tag.name) {
					tags.push({
						slug: tag.slug,
						name: tag.name,
					});
				}
			}

			posts.push({
				slug: doc.slug,
				title: doc.title,
				brief: doc.brief,
				tags,
				thumbnailImage: {
					url: doc.coverImage.sizes.og.url,
					width: doc.coverImage.sizes.og.width,
					height: doc.coverImage.sizes.og.height,
				},
				publishedAt: doc.createdAt,
				updatedAt: doc.updatedAt,
			});
		}
	}

	logger.debug("Finished fetching posts.");

	return posts;
}
