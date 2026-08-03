import "server-only";

import {
	convertLexicalToMarkdown,
	editorConfigFactory,
} from "@payloadcms/richtext-lexical";
import { cacheLife, cacheTag } from "next/cache";
import { getPayload } from "payload";
import { canReadDrafts } from "@/helpers/draft-access";
import { resolvePostReadMode } from "@/helpers/post-read-mode";
import { config } from "@/payload/config";
import { editor } from "@/payload/editor";
import { rootLogger } from "@/shared/logger";
import type { PayloadLocale } from "@/shared/payload-types";

const logger = rootLogger.child({ module: "📥" });

/**
 * Loads a post's body as markdown. `draft: true` is honoured only for a request
 * carrying a Payload session; an unauthenticated caller is served the published
 * body (or nothing) instead. The published read is cached and tagged; the draft
 * read is not — see {@link resolvePostReadMode}.
 */
export async function getBlogPostMarkdown({
	slug,
	locale,
	draft = false,
}: {
	slug: string;
	locale: PayloadLocale;
	draft?: boolean;
}): Promise<string | null> {
	const mode = resolvePostReadMode({
		requested: draft,
		// short-circuits so the published path never reads `headers()` and stays
		// statically renderable.
		permitted: draft ? await canReadDrafts() : false,
	});

	return mode === "draft"
		? await findBlogPostMarkdown({ slug, locale, draft: true })
		: await findPublishedBlogPostMarkdown({ slug, locale });
}

async function findPublishedBlogPostMarkdown({
	slug,
	locale,
}: {
	slug: string;
	locale: PayloadLocale;
}): Promise<string | null> {
	"use cache";

	cacheLife("hours");
	// shares the post's tag so revalidating a post busts its markdown across
	// every locale too.
	cacheTag(`blog-post:${slug}`);

	return await findBlogPostMarkdown({ slug, locale, draft: false });
}

async function findBlogPostMarkdown({
	slug,
	locale,
	draft,
}: {
	slug: string;
	locale: PayloadLocale;
	draft: boolean;
}): Promise<string | null> {
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
		locale,
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

	return null;
}
