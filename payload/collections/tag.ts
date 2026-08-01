import type { CollectionConfig } from "payload";

export const tagCollection: CollectionConfig = {
	slug: "tags",
	// admin-only throughout. Tags reach readers through the post pages that embed
	// them, which render via the local API, so nothing needs `/api/tags` to answer
	// an unauthenticated caller.
	access: {
		read: ({ req }) => Boolean(req.user),
		create: ({ req }) => Boolean(req.user),
		update: ({ req }) => Boolean(req.user),
		delete: ({ req }) => Boolean(req.user),
	},
	fields: [
		{
			name: "name",
			type: "text",
			required: true,
			localized: true,
		},
		{
			name: "slug",
			type: "text",
			required: true,
		},
	],
	trash: true,
	admin: {
		useAsTitle: "name",
	},
};
