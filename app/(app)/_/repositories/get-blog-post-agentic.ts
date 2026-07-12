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
		summary: z
			.string()
			.nullish()
			.describe("Authoring summary text, or null when unset."),
		outline: z
			.string()
			.nullish()
			.describe("Authoring outline markdown, or null when unset."),
		agenticStatus: z
			.unknown()
			.describe("Arbitrary authoring-loop JSON state, or null when unset."),
	})
	.transform((blogPost) => ({
		title: blogPost.title,
		summary: blogPost.summary ?? null,
		outline: blogPost.outline ?? null,
		agenticStatus: blogPost.agenticStatus ?? null,
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
			summary: true,
			outline: true,
			agenticStatus: true,
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
	return (
		!blogPost.summary?.trim() ||
		!blogPost.outline?.trim() ||
		blogPost.agenticStatus == null
	);
}

function mergeEmptyAuthoringFields(
	draft: BlogPostAgentic,
	published: Omit<BlogPostAgentic, "title">,
): BlogPostAgentic {
	return {
		title: draft.title,
		summary: draft.summary?.trim() ? draft.summary : published.summary,
		outline: draft.outline?.trim() ? draft.outline : published.outline,
		agenticStatus: draft.agenticStatus ?? published.agenticStatus,
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
			summary: true,
			outline: true,
			agenticStatus: true,
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
		summary:
			typeof published.summary === "string" && published.summary.trim()
				? published.summary
				: null,
		outline:
			typeof published.outline === "string" && published.outline.trim()
				? published.outline
				: null,
		agenticStatus: published.agenticStatus ?? null,
	};
}
