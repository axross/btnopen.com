import z from "zod";

/** Upper bound on a blog post slug, enforced in the schema and on the CMS field. */
export const MAX_BLOG_POST_SLUG_LENGTH = 128;

/**
 * Shape of a blog post slug: lowercase alphanumerics in hyphen-separated
 * groups, with no leading, trailing, or doubled hyphen.
 *
 * A slug reaches `revalidatePath()` and a cache tag in `posts/[slug]/caches`,
 * so it is parsed before use rather than interpolated straight from the URL —
 * an unvalidated segment there is a cache-poisoning vector. The `blog-posts`
 * collection validates its `slug` field against this same schema, so the CMS
 * cannot store a value that endpoint would go on to reject.
 */
export const BlogPostSlug = z
	.string()
	.min(1)
	.max(MAX_BLOG_POST_SLUG_LENGTH)
	.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
	.describe("Blog post slug, in kebab-case.");

export type BlogPostSlug = z.infer<typeof BlogPostSlug>;

/** Message shown on the CMS `slug` field when the value fails the schema. */
export const BLOG_POST_SLUG_VALIDATION_MESSAGE =
	"Use lowercase letters, numbers and single hyphens (e.g. my-post-title).";
