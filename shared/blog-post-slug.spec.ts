import { describe, expect, it } from "vitest";
import { BlogPostSlug, MAX_BLOG_POST_SLUG_LENGTH } from "./blog-post-slug";

describe("BlogPostSlug", () => {
	it("accepts a single lowercase word", () => {
		expect(BlogPostSlug.safeParse("example").success).toBe(true);
	});

	it("accepts hyphen-separated lowercase words and digits", () => {
		expect(BlogPostSlug.safeParse("markdown-example").success).toBe(true);
		expect(BlogPostSlug.safeParse("declarative-ui").success).toBe(true);
		// the e2e helper builds slugs as `<prefix>-<repeat>-<worker>-<timestamp>`.
		expect(BlogPostSlug.safeParse("comments-disabled-0-1-1754").success).toBe(
			true,
		);
	});

	it("rejects an empty slug", () => {
		expect(BlogPostSlug.safeParse("").success).toBe(false);
	});

	it("rejects a leading, trailing, or doubled hyphen", () => {
		expect(BlogPostSlug.safeParse("-example").success).toBe(false);
		expect(BlogPostSlug.safeParse("example-").success).toBe(false);
		expect(BlogPostSlug.safeParse("ex--ample").success).toBe(false);
	});

	it("rejects uppercase letters", () => {
		expect(BlogPostSlug.safeParse("Example").success).toBe(false);
	});

	it("rejects a slug longer than the limit", () => {
		const atLimit = "a".repeat(MAX_BLOG_POST_SLUG_LENGTH);
		const tooLong = "a".repeat(MAX_BLOG_POST_SLUG_LENGTH + 1);

		expect(BlogPostSlug.safeParse(atLimit).success).toBe(true);
		expect(BlogPostSlug.safeParse(tooLong).success).toBe(false);
	});

	it("rejects the traversal and encoding shapes that would poison a cache path", () => {
		expect(BlogPostSlug.safeParse("..").success).toBe(false);
		expect(BlogPostSlug.safeParse("a/../b").success).toBe(false);
		expect(BlogPostSlug.safeParse("a%2fb").success).toBe(false);
		expect(BlogPostSlug.safeParse("a b").success).toBe(false);
		expect(BlogPostSlug.safeParse("a\nb").success).toBe(false);
		expect(BlogPostSlug.safeParse("a.b").success).toBe(false);
		expect(BlogPostSlug.safeParse("a_b").success).toBe(false);
	});

	it("rejects a non-ASCII slug", () => {
		expect(BlogPostSlug.safeParse("記事").success).toBe(false);
	});

	// Payload hands a field's `validate` whatever the request carried, so the
	// schema stands in for the built-in text validation it replaces.
	it("rejects a non-string value", () => {
		expect(BlogPostSlug.safeParse(undefined).success).toBe(false);
		expect(BlogPostSlug.safeParse(null).success).toBe(false);
		expect(BlogPostSlug.safeParse(["example"]).success).toBe(false);
	});
});
