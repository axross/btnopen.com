import { describe, expect, it } from "@jest/globals";
import { MAX_BLOG_POST_SLUG_LENGTH } from "@/shared/blog-post-slug";
import { resolveLivePreviewPath } from "./live-preview-path";

const livePreviewQuery = "preview=true&draft=true";

describe("resolveLivePreviewPath()", () => {
	it("accepts the bare index path", () => {
		expect(resolveLivePreviewPath("/")).toBe("/");
	});

	it("accepts the index path carrying the live preview query", () => {
		expect(resolveLivePreviewPath(`/?${livePreviewQuery}`)).toBe("/");
	});

	it("accepts a bare post path", () => {
		expect(resolveLivePreviewPath("/posts/hello-world")).toBe(
			"/posts/hello-world",
		);
	});

	it("accepts the post path the preview iframe sends", () => {
		expect(
			resolveLivePreviewPath(`/posts/hello-world?${livePreviewQuery}`),
		).toBe("/posts/hello-world");
	});

	it("accepts a slug of digits and hyphens", () => {
		expect(resolveLivePreviewPath("/posts/2026-08-02")).toBe(
			"/posts/2026-08-02",
		);
	});

	it("accepts a slug at the maximum length", () => {
		const slug = "a".repeat(MAX_BLOG_POST_SLUG_LENGTH);

		expect(resolveLivePreviewPath(`/posts/${slug}`)).toBe(`/posts/${slug}`);
	});

	it("rejects a slug one character over the maximum length", () => {
		const slug = "a".repeat(MAX_BLOG_POST_SLUG_LENGTH + 1);

		expect(resolveLivePreviewPath(`/posts/${slug}`)).toBeNull();
	});

	it("rejects another route on the site", () => {
		expect(resolveLivePreviewPath("/admin")).toBeNull();
	});

	it("rejects the post list route", () => {
		expect(resolveLivePreviewPath("/posts")).toBeNull();
	});

	it("rejects an absolute URL", () => {
		expect(
			resolveLivePreviewPath("https://www.btnopen.com/posts/hello-world"),
		).toBeNull();
	});

	it("rejects a protocol-relative URL", () => {
		expect(resolveLivePreviewPath("//example.com/")).toBeNull();
	});

	it("rejects a traversal segment", () => {
		expect(resolveLivePreviewPath("/posts/../admin")).toBeNull();
	});

	it("rejects a bare traversal slug", () => {
		expect(resolveLivePreviewPath("/posts/..")).toBeNull();
	});

	it("rejects a nested post path", () => {
		expect(resolveLivePreviewPath("/posts/hello-world/comments")).toBeNull();
	});

	it("rejects a trailing slash on a post path", () => {
		expect(resolveLivePreviewPath("/posts/hello-world/")).toBeNull();
	});

	it("rejects an empty slug", () => {
		expect(resolveLivePreviewPath("/posts/")).toBeNull();
	});

	it("rejects an empty path", () => {
		expect(resolveLivePreviewPath("")).toBeNull();
	});

	it("rejects a partial live preview query", () => {
		expect(
			resolveLivePreviewPath("/posts/hello-world?preview=true"),
		).toBeNull();
	});

	it("rejects a reordered live preview query", () => {
		expect(
			resolveLivePreviewPath("/posts/hello-world?draft=true&preview=true"),
		).toBeNull();
	});

	it("rejects a parameter appended to the live preview query", () => {
		expect(
			resolveLivePreviewPath(`/posts/hello-world?${livePreviewQuery}&x=1`),
		).toBeNull();
	});

	it("rejects a second query separator", () => {
		expect(
			resolveLivePreviewPath(`/posts/hello-world?${livePreviewQuery}?x=1`),
		).toBeNull();
	});

	it("rejects a fragment on a post path", () => {
		expect(resolveLivePreviewPath("/posts/hello-world#top")).toBeNull();
	});

	it("rejects a fragment on the index path", () => {
		expect(resolveLivePreviewPath("/#top")).toBeNull();
	});

	it("rejects an uppercase slug", () => {
		expect(resolveLivePreviewPath("/posts/Hello-World")).toBeNull();
	});

	it("rejects an underscore in a slug", () => {
		expect(resolveLivePreviewPath("/posts/hello_world")).toBeNull();
	});

	it("rejects a doubled hyphen in a slug", () => {
		expect(resolveLivePreviewPath("/posts/hello--world")).toBeNull();
	});

	it("rejects a leading hyphen in a slug", () => {
		expect(resolveLivePreviewPath("/posts/-hello-world")).toBeNull();
	});

	it("rejects a trailing hyphen in a slug", () => {
		expect(resolveLivePreviewPath("/posts/hello-world-")).toBeNull();
	});
});
