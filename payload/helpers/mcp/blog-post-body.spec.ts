import { describe, expect, it } from "@jest/globals";
import type { PayloadRequest } from "payload";
import type { BlogPost } from "../../types";
import {
	cloneBlogPostBody,
	findBlogPostBySlug,
	formatLocation,
	getChildrenAtLocation,
	prepareBlogPostBodyForWrite,
	updateBlogPostBody,
	validateRichTextReferences,
} from "./blog-post-body";

interface PayloadFindOptions {
	collection: string;
	draft?: boolean;
	fallbackLocale?: false;
	locale?: "en-US" | "ja-JP";
	where?: {
		_status?: {
			equals?: "published";
		};
		slug?: {
			equals?: string;
		};
	};
}

interface PayloadUpdateOptions {
	collection: string;
	data: {
		_status?: string;
		body?: BlogPost["body"];
	};
	draft?: boolean;
	fallbackLocale?: false;
	id: number;
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

describe("formatLocation()", () => {
	it("formats nested indexes when the location has multiple levels", () => {
		expect(formatLocation([0, 1, 2])).toBe("[0, 1, 2]");
	});
});

describe("cloneBlogPostBody()", () => {
	it("returns a deep clone when the body is present", () => {
		const body = createBody([{ type: "paragraph", children: [] }]);
		const clone = cloneBlogPostBody(body);

		expect(clone).toEqual(body);
		expect(clone).not.toBe(body);
		expect(clone.root.children).not.toBe(body.root.children);
	});

	it("throws when the body is empty", () => {
		expect(() => cloneBlogPostBody(null)).toThrow("Blog post body is empty");
	});
});

describe("getChildrenAtLocation()", () => {
	it("returns root children when the location is empty", () => {
		const body = createBody([{ type: "paragraph", children: [] }]);

		expect(getChildrenAtLocation(body, [])).toBe(body.root.children);
	});

	it("returns nested child arrays when the location points at a child node", () => {
		const nestedChildren = [{ type: "text", text: "hello" }];
		const body = createBody([
			{
				type: "paragraph",
				children: [{ type: "line", children: nestedChildren }],
			},
		]);

		expect(getChildrenAtLocation(body, [0, 0])).toBe(nestedChildren);
	});

	describe("when the location path is invalid", () => {
		it("throws when a non-final location index is negative", () => {
			const body = createBody([{ type: "paragraph", children: [] }]);

			expect(() => getChildrenAtLocation(body, [-1])).toThrow(
				"Only the final append location index may be -1.",
			);
		});

		it("throws when no node exists at the requested index", () => {
			const body = createBody([{ type: "paragraph", children: [] }]);

			expect(() => getChildrenAtLocation(body, [1])).toThrow(
				"No Lexical node exists",
			);
		});

		it("throws when the target node has no children array", () => {
			expect(() =>
				getChildrenAtLocation(createBody([{ type: "paragraph" }]), [0]),
			).toThrow("does not have a children array");
		});
	});
});

describe("findBlogPostBySlug()", () => {
	it("returns the first matching document with safe query options when a slug matches", async () => {
		const blogPost = { id: 42, slug: "hello-world" } as BlogPost;
		let receivedOptions: PayloadFindOptions | undefined;
		const req = {
			payload: {
				find: async (options: PayloadFindOptions) => {
					receivedOptions = options;

					return { docs: [blogPost] };
				},
			},
			user: { id: 1 },
		} as unknown as PayloadRequest;

		const result = await findBlogPostBySlug(req, "hello-world", {
			draft: true,
			locale: "ja-JP",
			select: { id: true, slug: true },
		});

		expect(result).toBe(blogPost);
		expect(receivedOptions?.collection).toBe("blog-posts");
		expect(receivedOptions?.draft).toBe(true);
		expect(receivedOptions?.fallbackLocale).toBe(false);
		expect(receivedOptions?.locale).toBe("ja-JP");
		expect(receivedOptions?.where?._status).toBeUndefined();
		expect(receivedOptions?.where?.slug?.equals).toBe("hello-world");
	});

	it("filters to published posts when draft mode is disabled", async () => {
		let receivedOptions: PayloadFindOptions | undefined;
		const req = {
			payload: {
				find: async (options: PayloadFindOptions) => {
					receivedOptions = options;

					return { docs: [] };
				},
			},
			user: { id: 1 },
		} as unknown as PayloadRequest;

		await findBlogPostBySlug(req, "hello-world", {
			draft: false,
			locale: "en-US",
			select: { id: true },
		});

		expect(receivedOptions?.where?.slug?.equals).toBe("hello-world");
		expect(receivedOptions?.where?._status?.equals).toBe("published");
	});

	it("returns null when no document matches the slug", async () => {
		const req = {
			payload: {
				find: async () => ({ docs: [] }),
			},
			user: { id: 1 },
		} as unknown as PayloadRequest;

		const result = await findBlogPostBySlug(req, "missing", {
			draft: false,
			locale: "en-US",
			select: { id: true },
		});

		expect(result).toBeNull();
	});
});

describe("updateBlogPostBody()", () => {
	it("preserves published status when updating a published post outside draft mode", async () => {
		const body = createBody();
		let receivedOptions: PayloadUpdateOptions | undefined;
		const req = {
			payload: {
				update: async (options: PayloadUpdateOptions) => {
					receivedOptions = options;

					return {
						id: options.id,
						slug: "hello-world",
						body: options.data.body,
						_status: options.data._status,
					};
				},
			},
			user: { id: 1 },
		} as unknown as PayloadRequest;

		const result = await updateBlogPostBody(
			req,
			{ id: 42, slug: "hello-world", _status: "published" } as BlogPost,
			body,
			{ draft: false, locale: "ja-JP" },
		);

		expect(result._status).toBe("published");
		expect(receivedOptions?.collection).toBe("blog-posts");
		expect(receivedOptions?.draft).toBe(false);
		expect(receivedOptions?.fallbackLocale).toBe(false);
		expect(receivedOptions?.data.body).toEqual(body);
		expect(receivedOptions?.data._status).toBe("published");
	});

	it("writes draft status when updating a published post in draft mode", async () => {
		const body = createBody();
		const statuses: string[] = [];
		const req = {
			payload: {
				update: async (options: PayloadUpdateOptions) => {
					statuses.push(options.data._status ?? "missing");

					return {
						id: options.id,
						slug: "hello-world",
						body: options.data.body,
						_status: options.data._status,
					};
				},
			},
			user: { id: 1 },
		} as unknown as PayloadRequest;

		await updateBlogPostBody(
			req,
			{ id: 42, slug: "hello-world", _status: "published" } as BlogPost,
			body,
			{ draft: true, locale: "ja-JP" },
		);

		expect(statuses).toEqual(["draft"]);
	});

	it("writes draft status when updating an unpublished post outside draft mode", async () => {
		const body = createBody();
		const statuses: string[] = [];
		const req = {
			payload: {
				update: async (options: PayloadUpdateOptions) => {
					statuses.push(options.data._status ?? "missing");

					return {
						id: options.id,
						slug: "hello-world",
						body: options.data.body,
						_status: options.data._status,
					};
				},
			},
			user: { id: 1 },
		} as unknown as PayloadRequest;

		await updateBlogPostBody(
			req,
			{ id: 42, slug: "hello-world", _status: "draft" } as BlogPost,
			body,
			{ draft: false, locale: "ja-JP" },
		);

		expect(statuses).toEqual(["draft"]);
	});

	it("normalizes populated upload node values before updating the post", async () => {
		const mediaIds: string[] = [];
		let receivedOptions: PayloadUpdateOptions | undefined;
		const body = createBody([
			{
				type: "upload",
				relationTo: "media",
				value: { id: "media-1" },
			},
		]);
		const req = {
			payload: {
				findByID: async (options: PayloadFindByIdOptions) => {
					mediaIds.push(options.id);

					return { id: options.id };
				},
				update: async (options: PayloadUpdateOptions) => {
					receivedOptions = options;

					return {
						id: options.id,
						slug: "hello-world",
						body: options.data.body,
						_status: options.data._status,
					};
				},
			},
			user: { id: 1 },
		} as unknown as PayloadRequest;

		await updateBlogPostBody(
			req,
			{ id: 42, slug: "hello-world", _status: "published" } as BlogPost,
			body,
			{ draft: false, locale: "ja-JP" },
		);

		expect(mediaIds).toEqual(["media-1"]);
		expect(receivedOptions?.data.body?.root.children).toEqual([
			{ type: "upload", relationTo: "media", value: "media-1" },
		]);
	});
});

describe("validateRichTextReferences()", () => {
	it("checks every nested media upload ID when upload nodes are valid", async () => {
		const ids: string[] = [];
		const req = {
			payload: {
				findByID: async (options: PayloadFindByIdOptions) => {
					ids.push(options.id);

					return { id: options.id };
				},
			},
			user: { id: 1 },
		} as unknown as PayloadRequest;
		const body = createBody([
			{ type: "upload", relationTo: "media", value: "media-1" },
			{
				type: "paragraph",
				children: [{ type: "upload", relationTo: "media", value: "media-2" }],
			},
		]);

		await validateRichTextReferences(req, body);

		expect(ids.sort()).toEqual(["media-1", "media-2"]);
	});

	it("rejects malformed upload nodes when relationTo is not media", async () => {
		const req = {
			payload: {
				findByID: async () => ({ id: "unused" }),
			},
			user: { id: 1 },
		} as unknown as PayloadRequest;

		await expect(
			validateRichTextReferences(
				req,
				createBody([
					{ type: "upload", relationTo: "cover-images", value: "1" },
				]),
			),
		).rejects.toThrow("relationTo='media'");
	});
});

describe("prepareBlogPostBodyForWrite()", () => {
	it("rejects upload nodes with populated values that do not include an ID", async () => {
		const req = {
			payload: {
				findByID: async () => ({ id: "unused" }),
			},
			user: { id: 1 },
		} as unknown as PayloadRequest;

		await expect(
			prepareBlogPostBodyForWrite(
				req,
				createBody([{ type: "upload", relationTo: "media", value: {} }]),
			),
		).rejects.toThrow();
	});
});
