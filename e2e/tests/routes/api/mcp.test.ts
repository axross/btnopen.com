import { expect, type Page, type TestInfo, test } from "@playwright/test";
import { NIL as uuidNIL, v5 as uuidV5 } from "uuid";
import { authenticatedStorageState } from "@/e2e/helpers/api/auth";
import {
	appendNodeInBlogPostBodyTool,
	callMcp,
	deleteBlogPost,
	deleteNodeInBlogPostBodyTool,
	getMcpApiKey,
	type McpJsonRpcResponse,
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

test("MCP exposes scoped tools and mutates blog post body nodes", async ({
	page,
}, testInfo) => {
	let createdBlogPostId: number | null = null;

	try {
		const apiKey =
			await test.step("Load the pre-issued MCP API key", async () =>
				getMcpApiKey());
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

		const blogPostSlug = `mcp-body-${testInfo.repeatEachIndex}-${Date.now()}`;
		const blogPostTitle = "MCP Body Mutation";
		const appendedText = "This paragraph was appended through MCP.";
		const coverImageId =
			await test.step("Retrieve an existing cover image ID", async () =>
				getExampleCoverImageId({ page, testInfo }));
		const mediaId = await test.step("Retrieve an existing media ID", async () =>
			getExampleMediaId({ page, testInfo }));

		createdBlogPostId =
			await test.step("Create a published blog post through the API", async () =>
				createPublishedBlogPost({
					coverImageId,
					mediaId,
					page,
					slug: blogPostSlug,
					testInfo,
					title: blogPostTitle,
				}));

		await test.step("Append a paragraph through MCP", async () => {
			await appendNodeThroughMcp({
				apiKey,
				location: [1],
				node: createParagraphNode(appendedText),
				page,
				slug: blogPostSlug,
				testInfo,
			});
		});

		await test.step("Verify MCP find returns the appended body", async () => {
			await verifyBlogPostBodyThroughMcpFind({
				apiKey,
				expectedText: appendedText,
				mediaId,
				page,
				slug: blogPostSlug,
				testInfo,
			});
		});

		await test.step("Delete the paragraph through MCP", async () => {
			await deleteNodeThroughMcp({
				apiKey,
				expectedText: appendedText,
				location: [1],
				page,
				slug: blogPostSlug,
				testInfo,
			});
		});

		await test.step("Verify the deleted paragraph is absent", async () => {
			await verifyBlogPostBodyThroughMcpFind({
				apiKey,
				expectedText: appendedText,
				mediaId,
				page,
				shouldContainText: false,
				slug: blogPostSlug,
				testInfo,
			});
		});

		await test.step("Verify the published page remains visible", async () => {
			await verifyPublishedRouteVisibility({
				page,
				slug: blogPostSlug,
				title: blogPostTitle,
			});
		});
	} finally {
		if (createdBlogPostId !== null) {
			const blogPostId = createdBlogPostId;

			await test.step("Clean up the blog post", async () => {
				await deleteBlogPost({ id: blogPostId, page, testInfo });
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
			appendNodeInBlogPostBodyTool,
			deleteNodeInBlogPostBodyTool,
		]),
	);
	expect(toolNames).not.toContain("createBlogPosts");
	expect(toolNames).not.toContain("updateBlogPosts");
	expect(toolNames).not.toContain("deleteBlogPosts");
	expect(toolNames).not.toContain("findUsers");
	expect(toolNames).not.toContain("getBlogPostDraftEditorState");
	expect(toolNames).not.toContain("createBlogPostDraft");
	expect(toolNames).not.toContain("updateBlogPostDraft");
	expect(toolNames).not.toContain("createBlogPostDraftFromMarkdown");
	expect(toolNames).not.toContain("updateBlogPostDraftFromMarkdown");
}

async function createPublishedBlogPost({
	coverImageId,
	mediaId,
	page,
	slug,
	testInfo,
	title,
}: {
	coverImageId: string;
	mediaId: string;
	page: Page;
	slug: string;
	testInfo: TestInfo;
	title: string;
}): Promise<number> {
	const userId = await getCurrentUserId({ page, testInfo });
	const url = new URL("/api/blog-posts", testInfo.project.use.baseURL);
	url.searchParams.set("locale", "ja-JP");

	const response = await page.request.post(`${url}`, {
		headers: {
			"content-type": "application/json",
		},
		data: {
			title,
			slug,
			coverImage: coverImageId,
			brief: "Published post created by the MCP e2e test.",
			body: createBlogPostBody({ mediaId }),
			author: userId,
			publishedAt: new Date().toISOString(),
			_status: "published",
		},
	});

	if (!response.ok()) {
		throw new Error(
			`Failed to create blog post: ${response.status()} ${await response.text()}`,
		);
	}

	const json: unknown = await response.json();
	const id = getNumberProperty(json, "id");

	if (id) {
		return id;
	}

	if (isRecord(json)) {
		const docId = getNumberProperty(json.doc, "id");

		if (docId) {
			return docId;
		}
	}

	throw new Error("Failed to create blog post because no ID was returned.");
}

async function appendNodeThroughMcp({
	apiKey,
	location,
	node,
	page,
	slug,
	testInfo,
}: {
	apiKey: string;
	location: number[];
	node: unknown;
	page: Page;
	slug: string;
	testInfo: TestInfo;
}): Promise<void> {
	const appendResponse = await callMcp({
		apiKey,
		method: "tools/call",
		page,
		params: {
			name: appendNodeInBlogPostBodyTool,
			arguments: {
				slug,
				location,
				node,
			},
		},
		testInfo,
	});

	const appendResult = parseToolJsonContent<{
		blogPost: {
			slug: string;
			status: "published";
		};
		insertedAt: number[];
	}>(appendResponse);

	expect(appendResult.blogPost.slug).toBe(slug);
	expect(appendResult.blogPost.status).toBe("published");
	expect(appendResult.insertedAt).toEqual(location);
}

async function deleteNodeThroughMcp({
	apiKey,
	expectedText,
	location,
	page,
	slug,
	testInfo,
}: {
	apiKey: string;
	expectedText: string;
	location: number[];
	page: Page;
	slug: string;
	testInfo: TestInfo;
}): Promise<void> {
	const deleteResponse = await callMcp({
		apiKey,
		method: "tools/call",
		page,
		params: {
			name: deleteNodeInBlogPostBodyTool,
			arguments: {
				slug,
				location,
			},
		},
		testInfo,
	});

	const deleteResult = parseToolJsonContent<{
		blogPost: {
			slug: string;
			status: "published";
		};
		deletedNode: unknown;
	}>(deleteResponse);

	expect(deleteResult.blogPost.slug).toBe(slug);
	expect(deleteResult.blogPost.status).toBe("published");
	expect(bodyContainsText([deleteResult.deletedNode], expectedText)).toBe(true);
}

async function verifyBlogPostBodyThroughMcpFind({
	apiKey,
	expectedText,
	mediaId,
	page,
	shouldContainText = true,
	slug,
	testInfo,
}: {
	apiKey: string;
	expectedText: string;
	mediaId: string;
	page: Page;
	shouldContainText?: boolean;
	slug: string;
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
				limit: 1,
				select: JSON.stringify({
					slug: true,
					body: true,
					author: true,
					_status: true,
				}),
				where: JSON.stringify({
					slug: {
						equals: slug,
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
			status?: string;
		}>;
	}>(findResponse);

	expect(findResult.docs[0]).toEqual(
		expect.objectContaining({
			slug,
			status: "published",
		}),
	);
	const children = getRootChildren(findResult.docs[0].body);

	expect(bodyContainsText(children, expectedText)).toBe(shouldContainText);
	expect(findUploadNodeValue(children)).toBe(mediaId);
	expect(findResult.docs[0].author?.email).toBeUndefined();
	expect(findResult.docs[0].author?.hash).toBeUndefined();
}

async function verifyPublishedRouteVisibility({
	page,
	slug,
	title,
}: {
	page: Page;
	slug: string;
	title: string;
}): Promise<void> {
	await page.goto(`/posts/${slug}`);

	await expect(
		page.getByTestId("page").getByTestId("header").getByTestId("title"),
	).toHaveText(title);
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

async function getCurrentUserId({
	page,
	testInfo,
}: {
	page: Page;
	testInfo: TestInfo;
}): Promise<number> {
	const url = new URL("/api/users/me", testInfo.project.use.baseURL);
	const response = await page.request.get(`${url}`);

	if (!response.ok()) {
		throw new Error(
			`Failed to get current user: ${response.status()} ${await response.text()}`,
		);
	}

	const json: unknown = await response.json();

	if (
		isRecord(json) &&
		isRecord(json.user) &&
		typeof json.user.id === "number"
	) {
		return json.user.id;
	}

	throw new Error(
		"Failed to get current user because the response was invalid.",
	);
}

function createBlogPostBody({ mediaId }: { mediaId: string }): unknown {
	return {
		root: {
			type: "root",
			children: [
				createHeadingNode("MCP Body Mutation"),
				createParagraphNode("This post body starts with one paragraph."),
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

		if (node.type === "upload") {
			if (typeof node.value === "string") {
				return node.value;
			}

			if (isRecord(node.value) && typeof node.value.id === "string") {
				return node.value.id;
			}
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

function getRootChildren(body: unknown): unknown[] {
	if (
		isRecord(body) &&
		isRecord(body.root) &&
		Array.isArray(body.root.children)
	) {
		return body.root.children;
	}

	throw new Error("Blog post body did not include root children.");
}

function bodyContainsText(nodes: unknown[], text: string): boolean {
	for (const node of nodes) {
		if (!isRecord(node)) {
			continue;
		}

		if (node.type === "text" && node.text === text) {
			return true;
		}

		if (Array.isArray(node.children) && bodyContainsText(node.children, text)) {
			return true;
		}
	}

	return false;
}

function parseToolJsonContent<T>(response: McpJsonRpcResponse): T {
	expect(response.error).toBeUndefined();

	const text = response.result?.content?.[0]?.text;

	expect(text).toBeTruthy();

	return JSON.parse(text ?? "{}") as T;
}

function getNumberProperty(value: unknown, key: string): number | null {
	if (isRecord(value) && typeof value[key] === "number") {
		return value[key];
	}

	return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}
