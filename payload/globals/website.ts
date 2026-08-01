import type { GlobalConfig } from "payload";

export const websiteGlobal: GlobalConfig = {
	slug: "website",
	// admin-only. A global has no create or delete — only these two operations
	// exist. The site profile reaches every page through the local API, so
	// `/api/globals/website` need not answer an unauthenticated caller.
	access: {
		read: ({ req }) => Boolean(req.user),
		update: ({ req }) => Boolean(req.user),
	},
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
