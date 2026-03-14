import config from "@payload-config";
import { getPayload } from "payload";
import { rootLogger } from "@/logger";

const logger = rootLogger.child({}, { msgPrefix: "📥 " });

export async function getPostMarkdown(slug: string) {
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
			bodyMarkdown: true,
		},
		depth: 2,
		limit: 1,
	});
	const firstDoc = result.docs[0];

	if (firstDoc.bodyMarkdown) {
		logger.debug(`Finished fetching post (slug: ${slug}).`);

		return firstDoc.bodyMarkdown;
	}

	// throw an error when the post was not found. because this function is
	// expected to be called only when the post exists.
	throw new Error(
		`Failed to resolve post markdown (slug: ${slug}) because the post was not found.`,
	);
}
