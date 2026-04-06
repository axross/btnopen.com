import type { CollectionConfig } from "payload";
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
			admin: {
				position: "sidebar",
			},
		},
		{
			name: "coverImage",
			type: "upload",
			relationTo: "cover-images",
			required: true,
			admin: {
				position: "sidebar",
			},
		},
		{
			name: "brief",
			type: "textarea",
			required: true,
			localized: true,
			admin: {
				position: "sidebar",
			},
		},
		{
			name: "tags",
			type: "relationship",
			relationTo: "tags",
			hasMany: true,
			admin: {
				position: "sidebar",
			},
		},
		{
			name: "author",
			type: "relationship",
			relationTo: "users",
			required: true,
			admin: {
				position: "sidebar",
			},
		},
		{
			name: "publishedAt",
			type: "date",
			admin: {
				position: "sidebar",
				date: {
					pickerAppearance: "dayOnly",
					displayFormat: "yyyy/MM/dd",
				},
			},
		},
		{
			name: "body",
			type: "richText",
			required: true,
			localized: true,
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
			async ({ operation, result }) => {
				// skip the invalidation for the example blog post creation
				if (operation === "create" && result.slug === "markdown-example") {
					return;
				}

				if (
					operation === "update" ||
					operation === "create" ||
					operation === "delete" ||
					operation === "updateByID"
				) {
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

					let docs: { slug?: string | null }[] = [];

					if (Array.isArray(result.docs)) {
						docs = result.docs;
					} else {
						docs = [result];
					}

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
