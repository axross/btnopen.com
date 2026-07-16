import type { CollectionConfig } from "payload";
import { shouldInvalidatePostCaches } from "@/helpers/post-cache-invalidation";
import { urlOrigin } from "@/runtime";
import { logger } from "../helpers/logger";

export const blogPostCollection: CollectionConfig = {
	slug: "blog-posts",
	fields: [
		{
			name: "title",
			type: "text",
			required: true,
			localized: true,
		},
		{
			name: "slug",
			type: "text",
			required: true,
			unique: true,
		},
		{
			type: "tabs",
			tabs: [
				{
					label: "Body",
					fields: [
						{
							name: "body",
							type: "richText",
							required: true,
							localized: true,
						},
					],
				},
				{
					label: "Metadata",
					fields: [
						{
							name: "brief",
							type: "textarea",
							required: true,
							localized: true,
						},
						{
							name: "coverImage",
							type: "upload",
							relationTo: "cover-images",
							required: true,
						},
						{
							name: "tags",
							type: "relationship",
							relationTo: "tags",
							hasMany: true,
						},
						{
							name: "author",
							type: "relationship",
							relationTo: "users",
							required: true,
						},
						{
							name: "publishedAt",
							type: "date",
							admin: {
								date: {
									pickerAppearance: "dayOnly",
									displayFormat: "yyyy/MM/dd",
								},
							},
						},
						{
							name: "commentsEnabled",
							type: "checkbox",
							defaultValue: true,
							admin: {
								description:
									"Show the reader comments section at the bottom of this post.",
							},
						},
					],
				},
				{
					label: "Agentic",
					fields: [
						{
							name: "outline",
							type: "textarea",
							admin: {
								description:
									"Authoring outline for the agent-driven authoring loop. A single Markdown bullet-point list — only list items and inline elements are permitted; no paragraphs or other block types.",
							},
						},
						{
							name: "authoringNotes",
							type: "textarea",
							admin: {
								description:
									"Free-form Markdown notes that human and AI agents leave while authoring. Never reflected in the published blog post body.",
							},
						},
					],
				},
			],
		},
	],
	versions: {
		drafts: {
			autosave: {
				showSaveDraftButton: true,
			},
		},
	},
	trash: true,
	hooks: {
		afterOperation: [
			async ({ operation, args, result }) => {
				// skip the invalidation for the example blog post creation
				if (operation === "create" && result.slug === "markdown-example") {
					return;
				}

				const draft = "draft" in args ? args.draft : undefined;

				// Draft and autosave writes never change publicly cached output, so
				// skip the cache-busting round-trips entirely; only publish, unpublish,
				// and delete affect the published pages.
				if (!shouldInvalidatePostCaches({ operation, draft })) {
					return;
				}

				let docs: { slug?: string | null }[] = [];

				if (Array.isArray(result.docs)) {
					docs = result.docs;
				} else {
					docs = [result];
				}

				// A cache-invalidation miss must never fail the content write, so the
				// fetches are guarded and reported to Sentry instead of thrown.
				try {
					logger.info(
						{ operation },
						"Started requesting to clear all blog post caches.",
					);

					await fetch(`${urlOrigin}/posts/caches`, {
						method: "DELETE",
					});

					logger.info(
						{ operation },
						"Finished requesting to clear all blog post caches.",
					);

					await Promise.all(
						docs.map(async (doc) => {
							if (doc.slug) {
								logger.info(
									{ operation, slug: doc.slug },
									"Started requesting to clear blog post cache.",
								);

								await fetch(`${urlOrigin}/posts/${doc.slug}/caches`, {
									method: "DELETE",
								});

								logger.info(
									{ operation, slug: doc.slug },
									"Finished requesting to clear blog post cache.",
								);
							}
						}),
					);
				} catch (error) {
					// dynamic import keeps `@sentry/nextjs` out of this module's static
					// graph, which the Payload CLI loads directly (outside Next's bundler,
					// where the package's named exports do not resolve).
					const { captureException } = await import("@sentry/nextjs");
					captureException(error);
				}
			},
		],
	},
	admin: {
		useAsTitle: "title",
		defaultColumns: ["title", "slug", "brief", "createdAt", "updatedAt"],
		livePreview: {
			url: ({ data }) =>
				`${urlOrigin}/posts/${data.slug}?preview=true&draft=true`,
		},
	},
};
