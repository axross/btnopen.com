"use server";

import {
	convertLexicalToMarkdown,
	editorConfigFactory,
} from "@payloadcms/richtext-lexical";
import { cacheLife } from "next/cache";
import { getPayload } from "payload";
import { rootLogger } from "@/logger";
import { config } from "@/payload/config";
import { editor } from "@/payload/editor";

const logger = rootLogger.child({ module: "📥" });

export async function getBlogPostMarkdown({
	slug,
	draft = false,
}: {
	slug: string;
	draft?: boolean;
}) {
	"use cache";

	cacheLife("hours");

	logger.info({ slug, draft }, "Started fetching post markdown.");

	const processStartedAt = performance.now();

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
		const firstDoc = result.docs[0];
		const markdown = convertLexicalToMarkdown({
			data: firstDoc.body,
			editorConfig: await editorConfigFactory.fromEditor({
				config: await config,
				editor,
			}),
		});

		logger.info(
			{ slug, duration: performance.now() - processStartedAt },
			"Finished fetching blog post markdown.",
		);

		return markdown;
	}

	// throw an error when the blog post was not found. because this function is
	// expected to be called only when the blog post exists.
	throw new Error(
		`Failed to resolve blog post markdown (slug: ${slug}) because the blog post was not found.`,
	);
}
