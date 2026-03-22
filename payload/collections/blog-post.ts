import type { CollectionConfig } from "payload";
import { urlOrigin } from "@/runtime";

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
			name: "author",
			type: "relationship",
			relationTo: "users",
			required: true,
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
			name: "brief",
			type: "textarea",
			required: true,
			localized: true,
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
				if (
					operation === "update" ||
					operation === "create" ||
					operation === "delete" ||
					operation === "updateByID"
				) {
					await fetch(`${urlOrigin}/posts/caches`, {
						method: "DELETE",
					});

					let docs: { slug?: string | null }[] = [];

					if (Array.isArray(result.docs)) {
						docs = result.docs;
					} else {
						docs = [result];
					}

					await Promise.all(
						docs.map((doc) => {
							if (doc.slug) {
								return fetch(`${urlOrigin}/posts/${result.slug}/caches`, {
									method: "DELETE",
								});
							}

							return Promise.resolve();
						}),
					);
				}
			},
		],
		afterChange: [
			async ({ doc }) => {
				await fetch(`${urlOrigin}/posts/${doc.slug}/caches`, {
					method: "DELETE",
				});
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
