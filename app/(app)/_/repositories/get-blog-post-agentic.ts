"use server";

import { cacheLife, cacheTag } from "next/cache";
import { getPayload } from "payload";
import z from "zod";
import { rootLogger } from "@/logger";
import { config } from "@/payload/config";
import { type PayloadLocale, PayloadNonEmptyString } from "./payload-types";

const logger = rootLogger.child({ module: "📥" });

// focused schema for the agentic authoring view: only the fields that view
// selects, so it validates independently of the full `PayloadBlogPost` shape
// (which would require selecting brief/tags/coverImage/author too).
const BlogPostAgentic = z
	.object({
		title: PayloadNonEmptyString.describe("Localized blog post title."),
		outline: z
			.string()
			.nullish()
			.describe("Authoring outline markdown, or null when unset."),
		authoringNotes: z
			.string()
			.nullish()
			.describe("Free-form authoring notes markdown, or null when unset."),
	})
	.transform((blogPost) => ({
		title: blogPost.title,
		outline: blogPost.outline ?? null,
		authoringNotes: blogPost.authoringNotes ?? null,
	}));

export type BlogPostAgentic = z.infer<typeof BlogPostAgentic>;

export async function getBlogPostAgentic({
	slug,
	locale,
	draft = false,
}: {
	slug: string;
	locale: PayloadLocale;
	draft?: boolean;
}): Promise<BlogPostAgentic | null> {
	"use cache";

	cacheLife("hours");
	// shares the post's tag so revalidating a post busts its agentic view across
	// every locale too.
	cacheTag(`blog-post:${slug}`);

	logger.info({ slug, draft }, "Started fetching post agentic fields.");

	const payload = await getPayload({ config });
	const result = await payload.find({
		collection: "blog-posts",
		select: {
			title: true,
			outline: true,
			authoringNotes: true,
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

	if (result.docs.length === 0) {
		logger.info(
			{ slug },
			"Failed to fetch blog post agentic fields because it was not found.",
		);

		return null;
	}

	const blogPost = BlogPostAgentic.parse(result.docs[0]);

	// The authoring fields are often edited on the published document, so a
	// post's draft version can lack them even when the published document has
	// them. When previewing a draft (`draft: true`), fall back to the published
	// values for whichever fields the draft leaves empty so the preview still
	// shows them instead of the empty state.
	if (draft && hasEmptyAuthoringField(blogPost)) {
		const published = await findPublishedAgentic({ payload, slug, locale });

		if (published) {
			logger.info(
				{ slug },
				"Completed fetching post agentic fields (published fallback for draft preview).",
			);

			return mergeEmptyAuthoringFields(blogPost, published);
		}
	}

	logger.info({ slug }, "Completed fetching post agentic fields.");

	return blogPost;
}

function hasEmptyAuthoringField(blogPost: BlogPostAgentic): boolean {
	return !blogPost.outline?.trim() || !blogPost.authoringNotes?.trim();
}

function mergeEmptyAuthoringFields(
	draft: BlogPostAgentic,
	published: Omit<BlogPostAgentic, "title">,
): BlogPostAgentic {
	return {
		title: draft.title,
		outline: draft.outline?.trim() ? draft.outline : published.outline,
		authoringNotes: draft.authoringNotes?.trim()
			? draft.authoringNotes
			: published.authoringNotes,
	};
}

async function findPublishedAgentic({
	payload,
	slug,
	locale,
}: {
	payload: Awaited<ReturnType<typeof getPayload>>;
	slug: string;
	locale: PayloadLocale;
}): Promise<Omit<BlogPostAgentic, "title"> | null> {
	logger.info({ slug }, "Started fetching published agentic fallback.");

	const result = await payload.find({
		collection: "blog-posts",
		select: {
			outline: true,
			authoringNotes: true,
		},
		depth: 1,
		where: {
			slug: {
				equals: slug,
			},
			_status: {
				equals: "published",
			},
		},
		locale,
		limit: 1,
	});

	logger.info({ slug }, "Completed fetching published agentic fallback.");

	const published = result.docs[0];

	if (!published) {
		return null;
	}

	return {
		outline:
			typeof published.outline === "string" && published.outline.trim()
				? published.outline
				: null,
		authoringNotes:
			typeof published.authoringNotes === "string" &&
			published.authoringNotes.trim()
				? published.authoringNotes
				: null,
	};
}
