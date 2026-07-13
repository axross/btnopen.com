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

const emptyBody: z.input<typeof McpSanitizedBlogPost>["body"] = {
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
				mimeType: undefined,
				width: undefined,
				height: undefined,
				sizes: undefined,
			},
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
				avatarImage: undefined,
			},
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
			coverImage: {
				id: "cover-1",
				filename: "cover.png",
				url: "/cover.png",
				mimeType: undefined,
				width: undefined,
				height: undefined,
				sizes: undefined,
			},
			author: {
				id: 1,
				name: "Author",
				avatarImage: undefined,
			},
		});
		expect(z.encode(McpSanitizedBlogPost, decoded)._status).toBe("published");
		expect(z.encode(McpSanitizedBlogPost, decoded).outline).toBe(
			"- first point\n- second point",
		);
		expect(z.encode(McpSanitizedBlogPost, decoded).authoringNotes).toBe(
			"draft notes",
		);
	});

	it("leaves outline and authoringNotes undefined when input omits them", () => {
		const decoded = z.decode(McpSanitizedBlogPost, {
			id: 11,
			slug: "no-outline",
		});

		expect(decoded.outline).toBeUndefined();
		expect(decoded.authoringNotes).toBeUndefined();
	});

	it("round-trips a null authoringNotes when input sets it to null", () => {
		const decoded = z.decode(McpSanitizedBlogPost, {
			id: 12,
			slug: "null-notes",
			authoringNotes: null,
		});

		expect(decoded.authoringNotes).toBeNull();
		expect(z.encode(McpSanitizedBlogPost, decoded).authoringNotes).toBeNull();
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
			docs: [
				{
					id: 1,
					slug: "hello",
					title: undefined,
					brief: undefined,
					outline: undefined,
					body: undefined,
					status: "draft",
					publishedAt: undefined,
					createdAt: undefined,
					updatedAt: undefined,
					tags: undefined,
					coverImage: undefined,
					author: undefined,
				},
			],
		});
	});

	it("decodes a single document when input is not paginated", () => {
		expect(
			z.decode(McpBlogPostResponse, { id: 2, slug: "single" }),
		).toMatchObject({
			slug: "single",
		});
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
			limit: undefined,
			page: undefined,
			totalPages: undefined,
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
			limit: undefined,
			page: undefined,
			totalPages: undefined,
			docs: [
				{
					id: "media-1",
					filename: "image.png",
					url: "/image.png",
					mimeType: undefined,
					width: undefined,
					height: undefined,
					sizes: undefined,
				},
			],
		});
	});
});
