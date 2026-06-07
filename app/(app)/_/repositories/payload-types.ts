import type { convertLexicalToMarkdown } from "@payloadcms/richtext-lexical";
import z from "zod";

export const PayloadNonEmptyString = z
	.string()
	.trim()
	.min(1)
	.describe("A non-empty string with leading and trailing whitespace removed.");

export type PayloadNonEmptyString = z.infer<typeof PayloadNonEmptyString>;

export const PayloadLocale = z
	.enum(["ja-JP", "en-US"])
	.describe("Supported Payload localization locale.");

export type PayloadLocale = z.infer<typeof PayloadLocale>;

export const PayloadSlug = PayloadNonEmptyString.regex(
	/^[a-z0-9]+(?:-[a-z0-9]+)*$/,
	"Use lowercase letters, numbers, and hyphens.",
).describe("URL-safe slug using lowercase letters, numbers, and hyphens.");

export type PayloadSlug = z.infer<typeof PayloadSlug>;

export type PayloadRichTextEditorState = Parameters<
	typeof convertLexicalToMarkdown
>[0]["data"];

export const PayloadRichTextEditorState = z
	.custom<PayloadRichTextEditorState>(
		(value) => isPayloadRichTextEditorState(value),
		"Expected a Payload Lexical editor state object with a root node.",
	)
	.describe(
		"Payload Lexical rich text editor state with a root node and child nodes.",
	);

export const PayloadUploadSize = z
	.object({
		url: PayloadNonEmptyString.describe(
			"Public URL path for a generated Payload upload size.",
		),
		filename: PayloadNonEmptyString.describe(
			"Stored generated upload size filename.",
		),
		mimeType: PayloadNonEmptyString.describe(
			"MIME type for a generated Payload upload size.",
		),
		width: z.number().nonnegative().describe("Rendered image width in pixels."),
		height: z
			.number()
			.nonnegative()
			.describe("Rendered image height in pixels."),
	})
	.describe("Generated Payload upload image size.");

export type PayloadUploadSize = z.infer<typeof PayloadUploadSize>;

export const PayloadUpload = z
	.object({
		id: PayloadNonEmptyString.optional().describe(
			"Payload upload document ID.",
		),
		url: PayloadNonEmptyString.describe(
			"Public URL path for a Payload upload file.",
		),
		filename: PayloadNonEmptyString.describe("Stored upload filename."),
		mimeType: PayloadNonEmptyString.describe(
			"MIME type for a Payload upload file.",
		),
		width: z.number().nonnegative().describe("Original image width in pixels."),
		height: z
			.number()
			.nonnegative()
			.describe("Original image height in pixels."),
		sizes: z
			.optional(z.record(z.string(), PayloadUploadSize))
			.describe("Generated image sizes keyed by size name."),
	})
	.describe("Payload upload document.");

export type PayloadUpload = z.infer<typeof PayloadUpload>;

export const PayloadUser = z
	.object({
		name: PayloadNonEmptyString.describe(
			"Localized display name for a Payload user.",
		),
		avatarImage: PayloadUpload.describe("Avatar image upload for the user."),
		bio: PayloadRichTextEditorState.optional().describe(
			"Localized user biography.",
		),
	})
	.describe("Payload user document.");

export type PayloadUser = z.infer<typeof PayloadUser>;

export const PayloadWebsite = z
	.object({
		name: PayloadNonEmptyString.describe("Localized website name."),
		description: PayloadNonEmptyString.describe(
			"Localized website description.",
		),
		keywords: z
			.nullable(
				z.array(
					z
						.object({
							keyword: PayloadNonEmptyString.describe(
								"Website metadata keyword.",
							),
						})
						.describe("Website keyword entry."),
				),
			)
			.describe("Localized website metadata keywords."),
		creator: PayloadUser.describe("Website creator profile."),
	})
	.describe("Payload website global.");

export type PayloadWebsite = z.infer<typeof PayloadWebsite>;

export const PayloadTag = z
	.object({
		slug: PayloadSlug.describe("Tag slug."),
		name: PayloadNonEmptyString.describe("Localized tag name."),
	})
	.describe("Payload tag document.");

export type PayloadTag = z.infer<typeof PayloadTag>;

export const PayloadBlogPost = z
	.object({
		slug: PayloadSlug.describe("Blog post URL slug."),
		title: PayloadNonEmptyString.describe("Localized blog post title."),
		brief: PayloadNonEmptyString.describe("Localized blog post summary."),
		body: PayloadRichTextEditorState.optional().describe(
			"Localized blog post rich text body.",
		),
		tags: z.array(PayloadTag).describe("Tags assigned to the blog post."),
		coverImage: PayloadUpload.extend({
			sizes: z.object({
				og: PayloadUploadSize.describe("Open Graph cover image size."),
			}),
		}).describe("Cover image upload for the blog post."),
		author: PayloadUser.describe("Blog post author."),
		publishedAt: z.iso
			.datetime()
			.nullable()
			.describe("Publication timestamp, or null when not published."),
		createdAt: z.iso.datetime().describe("Creation timestamp."),
		updatedAt: z.iso.datetime().describe("Last update timestamp."),
	})
	.describe("Payload blog post document.");

export type PayloadBlogPost = z.infer<typeof PayloadBlogPost>;

function isPayloadRichTextEditorState(
	value: unknown,
): value is PayloadRichTextEditorState {
	return (
		typeof value === "object" &&
		value !== null &&
		"root" in value &&
		typeof value.root === "object" &&
		value.root !== null &&
		"type" in value.root &&
		value.root.type === "root" &&
		"children" in value.root &&
		Array.isArray(value.root.children)
	);
}
