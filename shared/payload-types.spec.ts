import { describe, expect, it } from "@jest/globals";
import type z from "zod";
import { PayloadBlogPost, resolveThumbnailImage } from "./payload-types";

type PayloadBlogPostInput = z.input<typeof PayloadBlogPost>;

const coverImage: NonNullable<PayloadBlogPostInput["coverImage"]> = {
	url: "/cover.png",
	filename: "cover.png",
	mimeType: "image/png",
	width: 1200,
	height: 630,
	sizes: {
		og: {
			url: "/cover-og.png",
			filename: "cover-og.png",
			mimeType: "image/png",
			width: 1200,
			height: 630,
		},
	},
};

const author: PayloadBlogPostInput["author"] = {
	name: "Author",
	avatarImage: {
		url: "/avatar.webp",
		filename: "avatar.webp",
		mimeType: "image/webp",
		width: 256,
		height: 256,
	},
};

const baseBlogPost: PayloadBlogPostInput = {
	slug: "example-post",
	title: "Example post",
	brief: "A short summary.",
	tags: [],
	coverImage,
	author,
	publishedAt: "2026-07-12T00:00:00.000Z",
	createdAt: "2026-07-12T00:00:00.000Z",
	updatedAt: "2026-07-12T00:00:00.000Z",
};

describe("PayloadBlogPost", () => {
	it("parses a fully populated blog post document", () => {
		const result = PayloadBlogPost.parse(baseBlogPost);

		expect(result.coverImage?.sizes.og.url).toBe("/cover-og.png");
	});

	it("accepts a null cover image so autosaved drafts without one still parse", () => {
		// regression guard: draft autosave persists a post before the required
		// coverImage is set, and the draft preview render path must not throw.
		const result = PayloadBlogPost.parse({ ...baseBlogPost, coverImage: null });

		expect(result.coverImage).toBeNull();
	});

	it("still rejects a cover image that is missing its Open Graph size", () => {
		const { sizes: _omitted, ...coverImageWithoutSizes } = coverImage;

		expect(() =>
			PayloadBlogPost.parse({
				...baseBlogPost,
				coverImage: coverImageWithoutSizes,
			}),
		).toThrow();
	});
});

describe("resolveThumbnailImage()", () => {
	it("returns the Open Graph size when the post has a cover image", () => {
		const { coverImage: parsedCoverImage } =
			PayloadBlogPost.parse(baseBlogPost);

		expect(resolveThumbnailImage(parsedCoverImage)).toEqual(
			coverImage.sizes.og,
		);
	});

	it("returns null when the post has no cover image", () => {
		// the mapping the repositories rely on: an autosaved draft without a
		// cover image yields a null thumbnail rather than throwing.
		expect(resolveThumbnailImage(null)).toBeNull();
	});
});
