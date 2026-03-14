import { lexicalEditor } from "@payloadcms/richtext-lexical";
import type { CollectionConfig } from "payload";
import {
	createMarkdownAfterReadHook,
	createMarkdownBeforeChangeHook,
} from "@/payload/helpers/markdown";

export const blogPostCollection: CollectionConfig = {
	slug: "blog-posts",
	trash: true,
	versions: {
		drafts: true,
	},
	fields: [
		{
			name: "title",
			type: "text",
			localized: true,
		},
		{
			name: "slug",
			type: "text",
		},
		{
			name: "author",
			type: "relationship",
			relationTo: "users",
		},
		{
			name: "coverImage",
			type: "upload",
			relationTo: "cover-images",
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
			localized: true,
		},
		{
			name: "body",
			type: "richText",
			editor: lexicalEditor(),
			localized: true,
		},
		{
			name: "bodyMarkdown",
			type: "textarea",
			virtual: true,
			admin: {
				hidden: true,
			},
			hooks: {
				beforeChange: [createMarkdownBeforeChangeHook("bodyMarkdown")],
				afterRead: [createMarkdownAfterReadHook("body")],
			},
			localized: true,
		},
	],
};
