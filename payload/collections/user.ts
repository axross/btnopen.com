import type { CollectionConfig } from "payload";

export const userCollection: CollectionConfig = {
	slug: "users",
	fields: [
		{
			name: "name",
			type: "text",
			localized: true,
		},
		{
			name: "avatarImage",
			type: "upload",
			relationTo: "avatar-images",
		},
		{
			name: "bio",
			type: "richText",
			localized: true,
		},
	],
	auth: {
		// biome-ignore lint/style/noMagicNumbers: five minutes
		lockTime: 1000 * 60 * 5,
		maxLoginAttempts: 5,
	},
	admin: {
		useAsTitle: "name",
		defaultColumns: ["name", "bio"],
	},
};
