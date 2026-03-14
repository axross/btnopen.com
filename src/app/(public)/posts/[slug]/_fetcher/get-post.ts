import config from "@payload-config";
import { getPayload } from "payload";
import { rootLogger } from "@/logger";

const logger = rootLogger.child({}, { msgPrefix: "📥 " });

interface BlogPostDetail {
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

export async function getPost(slug: string): Promise<BlogPostDetail | null> {
	"use cache";

	logger.debug(`Started fetching post (slug: ${slug}).`);

	const payload = await getPayload({ config });
	const result = await payload.find({
		collection: "blog-posts",
		where: {
			slug: {
				equals: slug,
			},
		},
		select: {
			slug: true,
			title: true,
			brief: true,
			tags: true,
			coverImage: true,
			publishedAt: true,
			updatedAt: true,
		},
		depth: 2,
		limit: 1,
	});
	const firstDoc = result.docs[0];

	if (
		firstDoc.slug &&
		firstDoc.title &&
		firstDoc.brief &&
		Array.isArray(firstDoc.tags) &&
		firstDoc.coverImage &&
		typeof firstDoc.coverImage !== "number" &&
		firstDoc.coverImage.sizes?.og?.url &&
		firstDoc.coverImage.sizes?.og?.width &&
		firstDoc.coverImage.sizes?.og?.height
	) {
		const tags: BlogPostDetail["tags"] = [];

		for (const tag of firstDoc.tags) {
			if (typeof tag !== "number" && tag.slug && tag.name) {
				tags.push({
					slug: tag.slug,
					name: tag.name,
				});
			}
		}

		logger.debug(`Finished fetching post (slug: ${slug}).`);

		return {
			slug: firstDoc.slug,
			title: firstDoc.title,
			brief: firstDoc.brief,
			tags,
			thumbnailImage: {
				url: firstDoc.coverImage.sizes.og.url,
				width: firstDoc.coverImage.sizes.og.width,
				height: firstDoc.coverImage.sizes.og.height,
			},
			publishedAt: firstDoc.createdAt,
			updatedAt: firstDoc.updatedAt,
		};
	}

	return null;
}
