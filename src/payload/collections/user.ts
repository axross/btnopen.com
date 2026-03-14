import { lexicalEditor } from "@payloadcms/richtext-lexical";
import type { CollectionConfig } from "payload";
import {
	createMarkdownAfterReadHook,
	createMarkdownBeforeChangeHook,
} from "@/payload/helpers/markdown";

export const userCollection: CollectionConfig = {
	slug: "users",
	auth: {
		// biome-ignore lint/style/noMagicNumbers: five minutes
		lockTime: 1000 * 60 * 5,
		maxLoginAttempts: 5,
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
			editor: lexicalEditor(),
			localized: true,
		},
		{
			name: "bioMarkdown",
			type: "textarea",
			virtual: true,
			admin: {
				readOnly: true,
			},
			hooks: {
				beforeChange: [createMarkdownBeforeChangeHook("bioMarkdown")],
				afterRead: [createMarkdownAfterReadHook("bio")],
			},
			localized: true,
		},
	],
};
