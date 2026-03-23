import {
	convertLexicalToMarkdown,
	editorConfigFactory,
} from "@payloadcms/richtext-lexical";
import { getPayload } from "payload";
import { rootLogger } from "@/logger";
import { editor } from "@/payload/editor";
import config from "@/payload-config";

const logger = rootLogger.child({ module: "📥" });

export async function getPostMarkdown({
	slug,
	draft,
}: {
	slug: string;
	draft?: boolean;
}) {
	logger.info({ slug, draft }, "Started fetching post markdown.");

	const payload = await getPayload({ config });
	const result = await payload.find({
		collection: "blog-posts",
		select: {
			body: true,
		},
		depth: 1,
		where: {
			slug: {
				equals: slug,
			},
		},
		locale: "ja-JP",
		limit: 1,
		draft,
	});

	if (result.docs.length > 0) {
		const firstDoc = result.docs[0];
		const markdown = convertLexicalToMarkdown({
			data: firstDoc.body,
			editorConfig: await editorConfigFactory.fromEditor({
				config: await config,
				editor,
			}),
		});

		logger.info({ slug }, "Finished fetching post markdown.");

		return markdown;
	}

	// throw an error when the post was not found. because this function is
	// expected to be called only when the post exists.
	throw new Error(
		`Failed to resolve post markdown (slug: ${slug}) because the post was not found.`,
	);
}
