import { describe, expect, it } from "@jest/globals";
import type { PayloadRequest } from "payload";
import z from "zod";
import type { BlogPost } from "../../types";
import { appendNodeInBlogPostBodyTool } from "./append-node-in-blog-post-body";
import { mcpLogger } from "./logger";

mcpLogger.level = "silent";

interface PayloadFindOptions {
	collection: string;
	draft?: boolean;
	fallbackLocale?: false;
	locale?: "en-US" | "ja-JP";
	where?: {
		slug?: {
			equals?: string;
		};
	};
}

interface PayloadUpdateOptions {
	data: {
		_status?: string;
		body?: BlogPost["body"];
	};
	draft?: boolean;
	locale?: "en-US" | "ja-JP";
}

interface PayloadFindByIdOptions {
	collection: string;
	id: string;
}

function createBody(children: unknown[] = []): BlogPost["body"] {
	return {
		root: {
			type: "root",
			format: "",
			indent: 0,
			version: 1,
			children,
			direction: null,
		},
	} as BlogPost["body"];
}

function readResponseJson(response: { content: Array<{ text: string }> }): {
	blogPost?: BlogPost;
	insertedAt?: number[];
	message?: string;
} {
	return JSON.parse(response.content[0]?.text ?? "{}");
}

function createAppendRequestWithBody(body: BlogPost["body"]): {
	req: PayloadRequest;
	wasUpdateCalled: () => boolean;
} {
	let updateCalled = false;
	const req = {
		payload: {
			find: async () => ({
				docs: [
					{
						id: 1,
						slug: "hello-world",
						body,
						_status: "published",
					},
				],
			}),
			findByID: async () => ({ id: "unused" }),
			update: async () => {
				updateCalled = true;

				return {};
			},
		},
		user: { id: 1 },
	} as unknown as PayloadRequest;

	return {
		req,
		wasUpdateCalled: () => updateCalled,
	};
}

describe("appendNodeInBlogPostBodyTool()", () => {
	it("exposes MCP metadata and default parameters when inspected", () => {
		expect(appendNodeInBlogPostBodyTool.name).toBe("appendNodeInBlogPostBody");
		expect(typeof appendNodeInBlogPostBodyTool.description).toBe("string");

		const parsed = z
			.object(appendNodeInBlogPostBodyTool.parameters as z.ZodRawShape)
			.parse({
				slug: "hello-world",
				location: [0],
				node: { type: "paragraph", children: [] },
			});

		expect(parsed.locale).toBe("ja-JP");
		expect(parsed.draft).toBe(false);
	});

	describe("when request arguments are invalid", () => {
		it("reports schema validation errors for a missing slug", async () => {
			const response = await appendNodeInBlogPostBodyTool.handler(
				{ location: [], node: { type: "paragraph" } },
				{} as PayloadRequest,
			);

			expect(response.content[0]?.text?.startsWith("Error:")).toBe(true);
			expect(response.content[0]?.text).toContain("slug");
		});
	});

	describe("when no blog post matches the slug", () => {
		it("reports a missing blog post error", async () => {
			const req = {
				payload: {
					find: async () => ({ docs: [] }),
				},
				user: { id: 1 },
			} as unknown as PayloadRequest;

			const response = await appendNodeInBlogPostBodyTool.handler(
				{
					slug: "missing",
					location: [0],
					node: { type: "paragraph", children: [] },
				},
				req,
			);

			expect(response.content[0]?.text).toBe(
				'Error: No blog post exists for slug "missing".',
			);
		});
	});

	it("inserts at the beginning when final location is -1 for a published post", async () => {
		let updatedBody: BlogPost["body"] | undefined;
		let findOptions: PayloadFindOptions | undefined;
		let updateOptions: PayloadUpdateOptions | undefined;
		const body = createBody([{ type: "paragraph", children: [] }]);
		const req = {
			payload: {
				find: async (options: PayloadFindOptions) => {
					findOptions = options;

					return {
						docs: [
							{
								id: 1,
								slug: "hello-world",
								body,
								_status: "published",
							},
						],
					};
				},
				findByID: async () => ({ id: "unused" }),
				update: async (options: PayloadUpdateOptions) => {
					updateOptions = options;
					updatedBody = options.data.body;

					return {
						id: 1,
						slug: "hello-world",
						body: options.data.body,
						_status: options.data._status,
					};
				},
			},
			user: { id: 1 },
		} as unknown as PayloadRequest;

		const response = await appendNodeInBlogPostBodyTool.handler(
			{
				slug: "hello-world",
				location: [-1],
				node: { type: "heading", children: [{ type: "text", text: "Intro" }] },
			},
			req,
		);
		const responseJson = readResponseJson(response);

		expect(responseJson.insertedAt).toEqual([0]);
		expect(responseJson.message).toBe(
			"Inserted the node in the blog post body.",
		);
		expect(findOptions?.draft).toBe(false);
		expect(findOptions?.locale).toBe("ja-JP");
		expect(updateOptions?.data._status).toBe("published");
		expect(updatedBody?.root.children[0]?.type).toBe("heading");
		expect(body.root.children[0]?.type).toBe("paragraph");
	});

	it("inserts nested upload nodes and validates media references when draft mode is enabled", async () => {
		const mediaIds: string[] = [];
		let updatedBody: BlogPost["body"] | undefined;
		const body = createBody([
			{
				type: "paragraph",
				children: [{ type: "line", children: [] }],
			},
		]);
		const req = {
			payload: {
				find: async () => ({
					docs: [{ id: 1, slug: "hello-world", body, _status: "draft" }],
				}),
				findByID: async (options: PayloadFindByIdOptions) => {
					mediaIds.push(options.id);

					return { id: options.id };
				},
				update: async (options: PayloadUpdateOptions) => {
					updatedBody = options.data.body;

					return {
						id: 1,
						slug: "hello-world",
						body: options.data.body,
						_status: options.data._status,
					};
				},
			},
			user: { id: 1 },
		} as unknown as PayloadRequest;

		await appendNodeInBlogPostBodyTool.handler(
			{
				slug: "hello-world",
				location: [0, 0, 0],
				draft: true,
				node: { type: "upload", relationTo: "media", value: "media-1" },
			},
			req,
		);

		expect(mediaIds).toEqual(["media-1"]);
		expect(
			(
				updatedBody?.root.children[0] as unknown as {
					children: Array<{ children: unknown[] }>;
				}
			).children[0]?.children,
		).toEqual([{ type: "upload", relationTo: "media", value: "media-1" }]);
	});

	describe("when append location is invalid", () => {
		it("rejects non-final -1 without updating the post", async () => {
			const { req, wasUpdateCalled } = createAppendRequestWithBody(
				createBody([{ type: "paragraph", children: [] }]),
			);

			const response = await appendNodeInBlogPostBodyTool.handler(
				{
					slug: "hello-world",
					location: [-1, 0],
					node: { type: "paragraph", children: [] },
				},
				req,
			);

			expect(response.content[0]?.text).toMatch("only valid as the final");
			expect(wasUpdateCalled()).toBe(false);
		});

		it("rejects out-of-range indexes without updating the post", async () => {
			const { req, wasUpdateCalled } = createAppendRequestWithBody(
				createBody([{ type: "paragraph", children: [] }]),
			);

			const response = await appendNodeInBlogPostBodyTool.handler(
				{
					slug: "hello-world",
					location: [2],
					node: { type: "paragraph", children: [] },
				},
				req,
			);

			expect(response.content[0]?.text).toContain("out of range");
			expect(wasUpdateCalled()).toBe(false);
		});
	});
});
