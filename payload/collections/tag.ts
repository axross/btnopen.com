import type { CollectionConfig } from "payload";

export const tagCollection: CollectionConfig = {
	slug: "tags",
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
