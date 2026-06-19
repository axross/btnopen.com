import z from "zod";
import { PayloadBlogPost, PayloadLocale } from "@/repositories/payload-types";

const BlogPostBodyNodeLocation = z
	.array(z.number().int())
	.min(1)
	.describe(
		"Path into nested Lexical children arrays. For append, the final value may be -1 to insert at the beginning of the target children array.",
	);

export const BlogPostBodyMutationParametersBase = {
	slug: PayloadBlogPost.shape.slug.describe("Current slug of the blog post."),
	location: BlogPostBodyNodeLocation,
	locale: PayloadLocale.optional()
		.default("ja-JP")
		.describe("Locale to mutate. Defaults to Japanese."),
	draft: z
		.boolean()
		.optional()
		.default(false)
		.describe(
			"Set true to mutate the latest draft version instead of the published/main document.",
		),
} satisfies z.ZodRawShape;
