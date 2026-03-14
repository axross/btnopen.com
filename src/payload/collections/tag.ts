import type { CollectionConfig } from "payload";

export const tagCollection: CollectionConfig = {
	slug: "tags",
	trash: true,
	fields: [
		{
			name: "name",
			type: "text",
			localized: true,
		},
		{
			name: "slug",
			type: "text",
		},
	],
};
