import { describe, expect, it } from "@jest/globals";
import type { PayloadRequest } from "payload";
import z from "zod";
import type { BlogPost } from "../../types";
import { deleteNodeInBlogPostBodyTool } from "./delete-node-in-blog-post-body";
import { mcpLogger } from "./logger";

mcpLogger.level = "silent";

interface PayloadFindOptions {
	draft?: boolean;
	locale?: "en-US" | "ja-JP";
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
	deletedNode?: unknown;
	message?: string;
} {
	return JSON.parse(response.content[0]?.text ?? "{}");
}

function createDeleteRequestWithBody(body: BlogPost["body"]): {
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

describe("deleteNodeInBlogPostBodyTool()", () => {
	it("exposes MCP metadata and default parameters when inspected", () => {
		expect(deleteNodeInBlogPostBodyTool.name).toBe("deleteNodeInBlogPostBody");
		expect(typeof deleteNodeInBlogPostBodyTool.description).toBe("string");

		const parsed = z
			.object(deleteNodeInBlogPostBodyTool.parameters as z.ZodRawShape)
			.parse({
				slug: "hello-world",
				location: [0],
			});

		expect(parsed.locale).toBe("ja-JP");
		expect(parsed.draft).toBe(false);
	});

	describe("when request arguments are invalid", () => {
		it("reports schema validation errors for a missing slug", async () => {
			const response = await deleteNodeInBlogPostBodyTool.handler(
				{ location: [] },
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

			const response = await deleteNodeInBlogPostBodyTool.handler(
				{ slug: "missing", location: [0] },
				req,
			);

			expect(response.content[0]?.text).toBe(
				'Error: No blog post exists for slug "missing".',
			);
		});
	});

	it("deletes a root node and preserves status when targeting a published post", async () => {
		let updatedBody: BlogPost["body"] | undefined;
		let findOptions: PayloadFindOptions | undefined;
		let updateOptions: PayloadUpdateOptions | undefined;
		const deletedNode = {
			type: "paragraph",
			children: [{ type: "text", text: "Delete" }],
		};
		const keptNode = {
			type: "paragraph",
			children: [{ type: "text", text: "Keep" }],
		};
		const body = createBody([deletedNode, keptNode]);
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

		const response = await deleteNodeInBlogPostBodyTool.handler(
			{ slug: "hello-world", location: [0] },
			req,
		);
		const responseJson = readResponseJson(response);

		expect(responseJson.deletedNode).toEqual(deletedNode);
		expect(responseJson.message).toBe(
			"Deleted the node from the blog post body.",
		);
		expect(findOptions?.draft).toBe(false);
		expect(findOptions?.locale).toBe("ja-JP");
		expect(updateOptions?.data._status).toBe("published");
		expect(updatedBody?.root.children).toEqual([keptNode]);
		expect(body.root.children).toEqual([deletedNode, keptNode]);
	});

	it("deletes nested nodes when draft mode is enabled", async () => {
		let updatedBody: BlogPost["body"] | undefined;
		const body = createBody([
			{
				type: "paragraph",
				children: [
					{
						type: "line",
						children: [
							{ type: "text", text: "Keep" },
							{ type: "text", text: "Delete" },
						],
					},
				],
			},
		]);
		const req = {
			payload: {
				find: async () => ({
					docs: [{ id: 1, slug: "hello-world", body, _status: "draft" }],
				}),
				findByID: async () => ({ id: "unused" }),
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

		const response = await deleteNodeInBlogPostBodyTool.handler(
			{ slug: "hello-world", location: [0, 0, 1], draft: true },
			req,
		);
		const responseJson = readResponseJson(response);

		expect(responseJson.deletedNode).toEqual({ type: "text", text: "Delete" });
		expect(
			(
				updatedBody?.root.children[0] as unknown as {
					children: Array<{ children: unknown[] }>;
				}
			).children[0]?.children,
		).toEqual([{ type: "text", text: "Keep" }]);
	});

	it("normalizes populated upload values that remain after deleting a node", async () => {
		const mediaIds: string[] = [];
		let updatedBody: BlogPost["body"] | undefined;
		const deletedNode = {
			type: "paragraph",
			children: [{ type: "text", text: "Delete" }],
		};
		const body = createBody([
			deletedNode,
			{ type: "upload", relationTo: "media", value: { id: "media-1" } },
		]);
		const req = {
			payload: {
				find: async () => ({
					docs: [{ id: 1, slug: "hello-world", body, _status: "published" }],
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

		await deleteNodeInBlogPostBodyTool.handler(
			{ slug: "hello-world", location: [0] },
			req,
		);

		expect(mediaIds).toEqual(["media-1"]);
		expect(updatedBody?.root.children).toEqual([
			{ type: "upload", relationTo: "media", value: "media-1" },
		]);
	});

	describe("when delete location is invalid", () => {
		it("rejects negative indexes without updating the post", async () => {
			const { req, wasUpdateCalled } = createDeleteRequestWithBody(
				createBody([{ type: "paragraph", children: [] }]),
			);

			const response = await deleteNodeInBlogPostBodyTool.handler(
				{ slug: "hello-world", location: [-1] },
				req,
			);

			expect(response.content[0]?.text).toContain("non-negative indexes");
			expect(wasUpdateCalled()).toBe(false);
		});

		it("rejects out-of-range indexes without updating the post", async () => {
			const { req, wasUpdateCalled } = createDeleteRequestWithBody(
				createBody([{ type: "paragraph", children: [] }]),
			);

			const response = await deleteNodeInBlogPostBodyTool.handler(
				{ slug: "hello-world", location: [1] },
				req,
			);

			expect(response.content[0]?.text).toContain("out of range");
			expect(wasUpdateCalled()).toBe(false);
		});
	});

	it("rejects deleted values when the target value is not a Lexical node", async () => {
		let updateCalled = false;
		const req = {
			payload: {
				find: async () => ({
					docs: [
						{
							id: 1,
							slug: "hello-world",
							body: createBody(["not-a-node"]),
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

		const response = await deleteNodeInBlogPostBodyTool.handler(
			{ slug: "hello-world", location: [0] },
			req,
		);

		expect(response.content[0]?.text).toContain("No Lexical node exists");
		expect(updateCalled).toBe(false);
	});
});
