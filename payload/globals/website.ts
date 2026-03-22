import type { GlobalConfig } from "payload";

export const websiteGlobal: GlobalConfig = {
	slug: "website",
	fields: [
		{
			name: "name",
			type: "text",
			required: true,
			localized: true,
		},
		{
			name: "description",
			type: "text",
			required: true,
			localized: true,
		},
		{
			name: "keywords",
			type: "array",
			fields: [
				{
					name: "keyword",
					type: "text",
				},
			],
			localized: true,
		},
		{
			name: "creator",
			type: "relationship",
			relationTo: "users",
			required: true,
		},
	],
};
