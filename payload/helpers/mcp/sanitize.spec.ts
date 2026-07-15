import { describe, expect, it } from "@jest/globals";
import z from "zod";
import {
	McpBlogPostResponse,
	McpSanitizedBlogPost,
	McpSanitizedTag,
	McpSanitizedUpload,
	McpSanitizedUser,
	McpSanitizedWebsite,
	McpTagResponse,
	McpUploadResponse,
} from "./sanitize";

const emptyBody = {
	root: {
		type: "root",
		children: [],
		direction: null,
		format: "",
		indent: 0,
		version: 1,
	},
};

describe("McpSanitizedUpload", () => {
	it("keeps public upload fields when input is an upload document", () => {
		expect(
			z.decode(McpSanitizedUpload, {
				id: "media-1",
				filename: "image.png",
				url: "/image.png",
				mimeType: "image/png",
				width: 640,
				height: 480,
				sizes: {
					thumbnail: {
						url: "/thumb.png",
						filename: "thumb.png",
						mimeType: "image/png",
						width: 320,
						height: 240,
					},
				},
				privateField: "hidden",
			}),
		).toEqual({
			id: "media-1",
			filename: "image.png",
			url: "/image.png",
			mimeType: "image/png",
			width: 640,
			height: 480,
			sizes: {
				thumbnail: {
					url: "/thumb.png",
					filename: "thumb.png",
					mimeType: "image/png",
					width: 320,
					height: 240,
				},
			},
		});
	});

	it("accepts relation fallbacks when input is a relation value", () => {
		expect(z.decode(McpSanitizedUpload, "media-1")).toBe("media-1");
		expect(z.decode(McpSanitizedUpload, null)).toBeNull();
		expect(z.decode(McpSanitizedUpload, undefined)).toBeUndefined();
	});
});

describe("McpSanitizedUser", () => {
	it("sanitizes nested avatar uploads when avatarImage is populated", () => {
		expect(
			z.decode(McpSanitizedUser, {
				id: 1,
				name: "Author",
				email: "hidden@example.com",
				avatarImage: {
					id: "avatar-1",
					filename: "avatar.png",
					url: "/avatar.png",
					privateField: "hidden",
				},
			}),
		).toEqual({
			id: 1,
			name: "Author",
			avatarImage: {
				id: "avatar-1",
				filename: "avatar.png",
				url: "/avatar.png",
			},
		});
	});

	it("keeps the public bio rich text when input includes one", () => {
		expect(
			z.decode(McpSanitizedUser, {
				id: 1,
				name: "Author",
				bio: emptyBody,
				email: "hidden@example.com",
			}),
		).toEqual({
			id: 1,
			name: "Author",
			bio: emptyBody,
		});
	});
});

describe("McpSanitizedTag", () => {
	it("keeps public tag fields when input contains private fields", () => {
		expect(
			z.decode(McpSanitizedTag, {
				id: 1,
				slug: "typescript",
				name: "TypeScript",
				internal: "hidden",
			}),
		).toEqual({
			id: 1,
			slug: "typescript",
			name: "TypeScript",
		});
	});
});

describe("McpSanitizedWebsite", () => {
	it("sanitizes creator data when input contains a creator relation", () => {
		expect(
			z.decode(McpSanitizedWebsite, {
				name: "btnopen",
				description: "Personal blog",
				keywords: [{ keyword: "blog" }],
				creator: {
					id: 1,
					name: "Author",
					email: "hidden@example.com",
				},
			}),
		).toEqual({
			name: "btnopen",
			description: "Personal blog",
			keywords: [{ keyword: "blog" }],
			creator: {
				id: 1,
				name: "Author",
			},
		});
	});

	it("exposes the creator bio when input includes one", () => {
		expect(
			z.decode(McpSanitizedWebsite, {
				name: "btnopen",
				creator: { id: 1, name: "Author", bio: emptyBody, salt: "hidden" },
			}),
		).toEqual({
			name: "btnopen",
			creator: { id: 1, name: "Author", bio: emptyBody },
		});
	});
});

describe("McpSanitizedBlogPost", () => {
	it("maps status and sanitizes relations when input is a blog post document", () => {
		const decoded = z.decode(McpSanitizedBlogPost, {
			id: 10,
			slug: "hello-world",
			title: "Hello",
			brief: "Brief",
			outline: "- first point\n- second point",
			authoringNotes: "draft notes",
			body: emptyBody,
			_status: "published",
			publishedAt: "2026-01-01T00:00:00.000Z",
			createdAt: "2026-01-01T00:00:00.000Z",
			updatedAt: "2026-01-02T00:00:00.000Z",
			tags: [{ id: 1, slug: "typescript", name: "TypeScript", hidden: true }],
			coverImage: { id: "cover-1", filename: "cover.png", url: "/cover.png" },
			author: { id: 1, name: "Author", email: "hidden@example.com" },
			secret: "hidden",
		});

		expect(decoded).toEqual({
			id: 10,
			slug: "hello-world",
			title: "Hello",
			brief: "Brief",
			outline: "- first point\n- second point",
			authoringNotes: "draft notes",
			body: emptyBody,
			status: "published",
			publishedAt: "2026-01-01T00:00:00.000Z",
			createdAt: "2026-01-01T00:00:00.000Z",
			updatedAt: "2026-01-02T00:00:00.000Z",
			tags: [{ id: 1, slug: "typescript", name: "TypeScript" }],
			coverImage: { id: "cover-1", filename: "cover.png", url: "/cover.png" },
			author: { id: 1, name: "Author" },
		});
		expect(z.encode(McpSanitizedBlogPost, decoded)).toMatchObject({
			_status: "published",
			outline: "- first point\n- second point",
			authoringNotes: "draft notes",
		});
	});

	it("leaves outline and authoringNotes absent when input omits them", () => {
		expect(
			z.decode(McpSanitizedBlogPost, { id: 11, slug: "no-outline" }),
		).toEqual({
			id: 11,
			slug: "no-outline",
		});
	});

	it("round-trips a null authoringNotes when input sets it to null", () => {
		const decoded = z.decode(McpSanitizedBlogPost, {
			id: 12,
			slug: "null-notes",
			authoringNotes: null,
		});

		expect(decoded).toEqual({
			id: 12,
			slug: "null-notes",
			authoringNotes: null,
		});
		expect(z.encode(McpSanitizedBlogPost, decoded)).toMatchObject({
			authoringNotes: null,
		});
	});

	it("passes per-locale value objects through when input comes from a locale-all read", () => {
		expect(
			z.decode(McpSanitizedBlogPost, {
				id: 13,
				slug: "localized",
				title: { "ja-JP": "こんにちは", "en-US": "Hello" },
				brief: { "ja-JP": "概要" },
				body: { "ja-JP": emptyBody },
				salt: "hidden",
			}),
		).toEqual({
			id: 13,
			slug: "localized",
			title: { "ja-JP": "こんにちは", "en-US": "Hello" },
			brief: { "ja-JP": "概要" },
			body: { "ja-JP": emptyBody },
		});
	});

	it("passes tag relation ids through when input was read with depth 0", () => {
		expect(
			z.decode(McpSanitizedBlogPost, {
				id: 14,
				slug: "shallow",
				tags: [1, 2],
				coverImage: 7,
				author: 1,
			}),
		).toEqual({
			id: 14,
			slug: "shallow",
			tags: [1, 2],
			coverImage: 7,
			author: 1,
		});
	});
});

describe("McpBlogPostResponse", () => {
	it("decodes collection results when input is a paginated response", () => {
		expect(
			z.decode(McpBlogPostResponse, {
				totalDocs: 1,
				limit: 10,
				page: 1,
				totalPages: 1,
				docs: [{ id: 1, slug: "hello", _status: "draft" }],
				internal: "hidden",
			}),
		).toEqual({
			totalDocs: 1,
			limit: 10,
			page: 1,
			totalPages: 1,
			docs: [{ id: 1, slug: "hello", status: "draft" }],
		});
	});

	it("decodes a single document when input is not paginated", () => {
		expect(
			z.decode(McpBlogPostResponse, { id: 2, slug: "single" }),
		).toMatchObject({
			slug: "single",
		});
	});

	it("keeps every doc when a draft in the list carries empty or partial values", () => {
		expect(
			z.decode(McpBlogPostResponse, {
				totalDocs: 2,
				docs: [
					// a live autosaved draft: empty brief, missing publish date, id-only
					// cover image — shapes the previous validating sanitizer rejected.
					{ id: 1, slug: "draft-post", brief: "", publishedAt: null },
					{ id: 2, slug: "published-post", brief: "Brief", coverImage: 7 },
				],
			}),
		).toEqual({
			totalDocs: 2,
			docs: [
				{ id: 1, slug: "draft-post", brief: "", publishedAt: null },
				{ id: 2, slug: "published-post", brief: "Brief", coverImage: 7 },
			],
		});
	});

	it("never throws when input is not a record at all", () => {
		expect(z.decode(McpBlogPostResponse, null)).toBeNull();
		expect(z.decode(McpBlogPostResponse, "unexpected")).toBe("unexpected");
	});
});

describe("McpTagResponse", () => {
	it("decodes collection results when input is a paginated response", () => {
		expect(
			z.decode(McpTagResponse, {
				totalDocs: 1,
				docs: [{ id: 1, slug: "typescript", name: "TypeScript", hidden: true }],
			}),
		).toEqual({
			totalDocs: 1,
			docs: [{ id: 1, slug: "typescript", name: "TypeScript" }],
		});
	});
});

describe("McpUploadResponse", () => {
	it("decodes collection results when input is a paginated response", () => {
		expect(
			z.decode(McpUploadResponse, {
				totalDocs: 1,
				docs: [{ id: "media-1", filename: "image.png", url: "/image.png" }],
			}),
		).toEqual({
			totalDocs: 1,
			docs: [{ id: "media-1", filename: "image.png", url: "/image.png" }],
		});
	});
});
