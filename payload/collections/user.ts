import type { CollectionConfig } from "payload";

export const userCollection: CollectionConfig = {
	slug: "users",
	// admin-only throughout, read included: a user record carries an email address
	// and locked-out state, so it must never answer an unauthenticated caller. The
	// author's public-facing name, bio, and avatar reach the site through the
	// local API, which bypasses these rules.
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
