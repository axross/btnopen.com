import { expect, type Page, type TestInfo, test } from "@playwright/test";
import { NIL as uuidNIL, v5 as uuidV5 } from "uuid";
import { authenticatedStorageState } from "@/e2e/helpers/api/auth";
import {
	callMcp,
	createBlogPostDraftTool,
	createMcpApiKey,
	deleteBlogPost,
	deleteMcpApiKey,
	getBlogPostDraftEditorStateTool,
	type McpApiKey,
	type McpJsonRpcResponse,
	updateBlogPostDraftTool,
} from "@/e2e/helpers/api/mcp";

test.use({ storageState: authenticatedStorageState });

test("MCP endpoint rejects requests without an API key", async ({
	page,
}, testInfo) => {
	const url = new URL("/api/mcp", testInfo.project.use.baseURL);

	const response = await page.request.post(`${url}`, {
		headers: {
			accept: "application/json, text/event-stream",
			"content-type": "application/json",
		},
		data: {
			jsonrpc: "2.0",
			id: "unauthorized",
			method: "tools/list",
			params: {},
		},
	});

	await test.step("Verify the request is rejected", async () => {
		expect(response.ok()).toBe(false);
	});
});

test("MCP exposes scoped tools and writes draft posts only", async ({
	page,
}, testInfo) => {
	let createdBlogPostId: number | null = null;
	let mcpApiKey: McpApiKey | null = null;

	try {
		mcpApiKey =
			await test.step("Create an MCP API key with scoped permissions", async () =>
				createMcpApiKey({ page, testInfo }));
		const { apiKey } = mcpApiKey;
		const toolsResponse = await test.step("List MCP tools", async () =>
			callMcp({
				apiKey,
				method: "tools/list",
				page,
				testInfo,
			}));

		await test.step("Verify only intended tools are exposed", async () => {
			verifyToolList(toolsResponse);
		});

		const draftSlug = `mcp-draft-${testInfo.repeatEachIndex}-${Date.now()}`;
		const draftTitle = "MCP Draft Title";
		const updatedTitle = "MCP Draft Updated";
		const coverImageId =
			await test.step("Retrieve an existing cover image ID", async () =>
				getExampleCoverImageId({ page, testInfo }));
		const mediaId = await test.step("Retrieve an existing media ID", async () =>
			getExampleMediaId({ page, testInfo }));

		createdBlogPostId =
			await test.step("Create a draft blog post through MCP", async () =>
				createDraftThroughMcp({
					apiKey,
					coverImageId,
					draftSlug,
					draftTitle,
					mediaId,
					page,
					testInfo,
				}));

		await test.step("Update the draft through MCP", async () => {
			await updateDraftThroughMcp({
				apiKey,
				draftSlug,
				page,
				testInfo,
				updatedTitle,
			});
		});

		await test.step("Verify sanitized MCP find response", async () => {
			await verifySanitizedFindResponse({
				apiKey,
				draftSlug,
				page,
				testInfo,
			});
		});

		await test.step("Verify editor-state body preserved media references", async () => {
			await verifyDraftEditorStatePreservesMedia({
				apiKey,
				draftSlug,
				mediaId,
				page,
				testInfo,
			});
		});

		await test.step("Verify the draft page renders only with draft mode", async () => {
			await verifyDraftRouteVisibility({ draftSlug, page, updatedTitle });
		});
	} finally {
		if (createdBlogPostId !== null) {
			const blogPostId = createdBlogPostId;

			await test.step("Clean up the draft blog post", async () => {
				await deleteBlogPost({ id: blogPostId, page, testInfo });
			});
		}

		if (mcpApiKey !== null) {
			const mcpApiKeyId = mcpApiKey.id;

			await test.step("Clean up the MCP API key", async () => {
				await deleteMcpApiKey({ id: mcpApiKeyId, page, testInfo });
			});
		}
	}
});

function verifyToolList(toolsResponse: McpJsonRpcResponse): void {
	const toolNames = toolsResponse.result?.tools?.map((tool) => tool.name) ?? [];

	expect(toolNames).toEqual(
		expect.arrayContaining([
			"findBlogPosts",
			"findTags",
			"findCoverImages",
			"findMedia",
			"findWebsite",
			getBlogPostDraftEditorStateTool,
			createBlogPostDraftTool,
			updateBlogPostDraftTool,
		]),
	);
	expect(toolNames).not.toContain("createBlogPosts");
	expect(toolNames).not.toContain("updateBlogPosts");
	expect(toolNames).not.toContain("deleteBlogPosts");
	expect(toolNames).not.toContain("findUsers");
	expect(toolNames).not.toContain("createBlogPostDraftFromMarkdown");
	expect(toolNames).not.toContain("updateBlogPostDraftFromMarkdown");
}

async function createDraftThroughMcp({
	apiKey,
	coverImageId,
	draftSlug,
	draftTitle,
	mediaId,
	page,
	testInfo,
}: {
	apiKey: string;
	coverImageId: string;
	draftSlug: string;
	draftTitle: string;
	mediaId: string;
	page: Page;
	testInfo: TestInfo;
}): Promise<number> {
	const createResponse = await callMcp({
		apiKey,
		method: "tools/call",
		page,
		params: {
			name: createBlogPostDraftTool,
			arguments: {
				title: draftTitle,
				slug: draftSlug,
				brief: "Draft created by the MCP e2e test.",
				body: createDraftBody({ mediaId }),
				coverImageId,
				tagSlugs: ["example"],
			},
		},
		testInfo,
	});

	const createResult = parseToolJsonContent<{
		blogPost: {
			id: number;
			slug: string;
			status: "draft";
			title: string;
		};
	}>(createResponse);

	expect(createResult.blogPost.slug).toBe(draftSlug);
	expect(createResult.blogPost.title).toBe(draftTitle);
	expect(createResult.blogPost.status).toBe("draft");

	return createResult.blogPost.id;
}

async function updateDraftThroughMcp({
	apiKey,
	draftSlug,
	page,
	testInfo,
	updatedTitle,
}: {
	apiKey: string;
	draftSlug: string;
	page: Page;
	testInfo: TestInfo;
	updatedTitle: string;
}): Promise<void> {
	const updateResponse = await callMcp({
		apiKey,
		method: "tools/call",
		page,
		params: {
			name: updateBlogPostDraftTool,
			arguments: {
				slug: draftSlug,
				title: updatedTitle,
				brief: "Draft updated by the MCP e2e test.",
				tagSlugs: ["example"],
			},
		},
		testInfo,
	});

	const updateResult = parseToolJsonContent<{
		blogPost: {
			slug: string;
			status: "draft";
			title: string;
		};
	}>(updateResponse);

	expect(updateResult.blogPost.slug).toBe(draftSlug);
	expect(updateResult.blogPost.title).toBe(updatedTitle);
	expect(updateResult.blogPost.status).toBe("draft");
}

async function verifySanitizedFindResponse({
	apiKey,
	draftSlug,
	page,
	testInfo,
}: {
	apiKey: string;
	draftSlug: string;
	page: Page;
	testInfo: TestInfo;
}): Promise<void> {
	const findResponse = await callMcp({
		apiKey,
		method: "tools/call",
		page,
		params: {
			name: "findBlogPosts",
			arguments: {
				depth: 2,
				draft: true,
				limit: 1,
				where: JSON.stringify({
					slug: {
						equals: draftSlug,
					},
				}),
			},
		},
		testInfo,
	});

	const findResult = parseToolJsonContent<{
		docs: Array<{
			author?: {
				email?: string;
				hash?: string;
				name?: string;
			};
			body?: unknown;
			slug: string;
		}>;
	}>(findResponse);

	expect(findResult.docs[0]).toEqual(
		expect.objectContaining({
			slug: draftSlug,
		}),
	);
	expect(findResult.docs[0].body).toBeUndefined();
	expect(findResult.docs[0].author?.email).toBeUndefined();
	expect(findResult.docs[0].author?.hash).toBeUndefined();
}

async function verifyDraftEditorStatePreservesMedia({
	apiKey,
	draftSlug,
	mediaId,
	page,
	testInfo,
}: {
	apiKey: string;
	draftSlug: string;
	mediaId: string;
	page: Page;
	testInfo: TestInfo;
}): Promise<void> {
	const editorStateResponse = await callMcp({
		apiKey,
		method: "tools/call",
		page,
		params: {
			name: getBlogPostDraftEditorStateTool,
			arguments: {
				slug: draftSlug,
			},
		},
		testInfo,
	});

	const editorStateResult = parseToolJsonContent<{
		blogPost: {
			body: {
				root: {
					children: unknown[];
				};
			};
			slug: string;
		};
	}>(editorStateResponse);

	expect(editorStateResult.blogPost.slug).toBe(draftSlug);
	expect(
		findUploadNodeValue(editorStateResult.blogPost.body.root.children),
	).toBe(mediaId);
}

async function verifyDraftRouteVisibility({
	draftSlug,
	page,
	updatedTitle,
}: {
	draftSlug: string;
	page: Page;
	updatedTitle: string;
}): Promise<void> {
	await page.goto(`/posts/${draftSlug}?draft=true`);

	await expect(
		page.getByTestId("page").getByTestId("header").getByTestId("title"),
	).toHaveText(updatedTitle);

	await page.goto(`/posts/${draftSlug}`);

	await expect(page.getByTestId("not-found")).toBeVisible();
}

async function getExampleMediaId({
	page,
	testInfo,
}: {
	page: Page;
	testInfo: TestInfo;
}): Promise<string> {
	const mediaId = "019d1223-94d4-754c-8f57-47337be15c9e";
	const url = new URL("/api/media", testInfo.project.use.baseURL);
	url.searchParams.set("where[id][equals]", mediaId);
	url.searchParams.set("limit", "1");

	const response = await page.request.get(`${url}`);

	if (!response.ok()) {
		throw new Error(
			`Failed to get example media: ${response.status()} ${await response.text()}`,
		);
	}

	const json: unknown = await response.json();

	if (
		isRecord(json) &&
		Array.isArray(json.docs) &&
		isRecord(json.docs[0]) &&
		typeof json.docs[0].id === "string"
	) {
		return json.docs[0].id;
	}

	throw new Error("Failed to get example media because it was not found.");
}

async function getExampleCoverImageId({
	page,
	testInfo,
}: {
	page: Page;
	testInfo: TestInfo;
}): Promise<string> {
	const coverImageId = uuidV5("markdown-example", uuidNIL);
	const url = new URL("/api/cover-images", testInfo.project.use.baseURL);
	url.searchParams.set("where[id][equals]", coverImageId);
	url.searchParams.set("limit", "1");

	const response = await page.request.get(`${url}`);

	if (!response.ok()) {
		throw new Error(
			`Failed to get example cover image: ${response.status()} ${await response.text()}`,
		);
	}

	const json: unknown = await response.json();

	if (
		isRecord(json) &&
		Array.isArray(json.docs) &&
		isRecord(json.docs[0]) &&
		typeof json.docs[0].id === "string"
	) {
		return json.docs[0].id;
	}

	throw new Error(
		"Failed to get example cover image because it was not found.",
	);
}

function createDraftBody({ mediaId }: { mediaId: string }): unknown {
	return {
		root: {
			type: "root",
			children: [
				createHeadingNode("MCP Draft"),
				createParagraphNode("This draft was created from editor-state JSON."),
				{
					id: "mcp-media-node",
					type: "upload",
					version: 3,
					format: "",
					relationTo: "media",
					value: mediaId,
					fields: {
						caption: "Media reference preserved by MCP e2e coverage.",
					},
				},
			],
			direction: "ltr",
			format: "",
			indent: 0,
			version: 1,
		},
	};
}

function createHeadingNode(text: string): unknown {
	return {
		type: "heading",
		children: [createTextNode(text)],
		direction: "ltr",
		format: "",
		indent: 0,
		tag: "h1",
		version: 1,
	};
}

function createParagraphNode(text: string): unknown {
	return {
		type: "paragraph",
		children: [createTextNode(text)],
		direction: "ltr",
		format: "",
		indent: 0,
		textFormat: 0,
		textStyle: "",
		version: 1,
	};
}

function createTextNode(text: string): unknown {
	return {
		type: "text",
		detail: 0,
		format: 0,
		mode: "normal",
		style: "",
		text,
		version: 1,
	};
}

function findUploadNodeValue(nodes: unknown[]): string | null {
	for (const node of nodes) {
		if (!isRecord(node)) {
			continue;
		}

		if (node.type === "upload" && typeof node.value === "string") {
			return node.value;
		}

		if (Array.isArray(node.children)) {
			const value = findUploadNodeValue(node.children);

			if (value) {
				return value;
			}
		}
	}

	return null;
}

function parseToolJsonContent<T>(response: McpJsonRpcResponse): T {
	expect(response.error).toBeUndefined();

	const text = response.result?.content?.[0]?.text;

	expect(text).toBeTruthy();

	return JSON.parse(text ?? "{}") as T;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}
