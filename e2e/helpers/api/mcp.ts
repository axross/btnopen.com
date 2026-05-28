import type { Page, TestInfo } from "@playwright/test";

export const getBlogPostDraftEditorStateTool = "getBlogPostDraftEditorState";
export const createBlogPostDraftTool = "createBlogPostDraft";
export const updateBlogPostDraftTool = "updateBlogPostDraft";

export interface McpJsonRpcResponse {
	error?: {
		code: number;
		message: string;
	};
	id: number | string | null;
	jsonrpc: "2.0";
	result?: {
		content?: Array<{
			text: string;
			type: string;
		}>;
		tools?: Array<{
			description?: string;
			name: string;
		}>;
	};
}

export interface McpApiKey {
	apiKey: string;
	id: number;
}

export async function createMcpApiKey({
	page,
	testInfo,
}: {
	page: Page;
	testInfo: TestInfo;
}): Promise<McpApiKey> {
	const user = await getCurrentUser({ page, testInfo });
	const url = new URL(
		"/api/payload-mcp-api-keys",
		testInfo.project.use.baseURL,
	);

	const response = await page.request.post(`${url}`, {
		headers: {
			"content-type": "application/json",
		},
		data: {
			user: user.id,
			label: `Playwright MCP ${testInfo.testId} ${Date.now()}`,
			description: "Temporary key for MCP endpoint e2e coverage.",
			blogPosts: {
				find: true,
			},
			tags: {
				find: true,
			},
			coverImages: {
				find: true,
			},
			media: {
				find: true,
			},
			website: {
				find: true,
			},
			"payload-mcp-tool": {
				[getBlogPostDraftEditorStateTool]: true,
				[createBlogPostDraftTool]: true,
				[updateBlogPostDraftTool]: true,
			},
		},
	});

	if (!response.ok()) {
		throw new Error(
			`Failed to create MCP API key: ${response.status()} ${await response.text()}`,
		);
	}

	const json: unknown = await response.json();
	const apiKey = getStringProperty(json, "apiKey");
	const id = getNumberProperty(json, "id");

	if (apiKey && id) {
		return { apiKey, id };
	}

	if (isRecord(json)) {
		const docApiKey = getStringProperty(json.doc, "apiKey");
		const docId = getNumberProperty(json.doc, "id");

		if (docApiKey && docId) {
			return { apiKey: docApiKey, id: docId };
		}
	}

	throw new Error(
		"Failed to create MCP API key because no API key was returned.",
	);
}

export async function deleteMcpApiKey({
	id,
	page,
	testInfo,
}: {
	id: number;
	page: Page;
	testInfo: TestInfo;
}): Promise<void> {
	const url = new URL(
		`/api/payload-mcp-api-keys/${id}`,
		testInfo.project.use.baseURL,
	);
	const response = await page.request.delete(`${url}`);

	if (!response.ok()) {
		throw new Error(
			`Failed to delete MCP API key: ${response.status()} ${await response.text()}`,
		);
	}
}

export async function callMcp({
	apiKey,
	method,
	page,
	params = {},
	testInfo,
}: {
	apiKey: string;
	method: string;
	page: Page;
	params?: Record<string, unknown>;
	testInfo: TestInfo;
}): Promise<McpJsonRpcResponse> {
	const url = new URL("/api/mcp", testInfo.project.use.baseURL);
	const response = await page.request.post(`${url}`, {
		headers: {
			accept: "application/json, text/event-stream",
			authorization: `Bearer ${apiKey}`,
			"content-type": "application/json",
		},
		data: {
			jsonrpc: "2.0",
			id: `${Date.now()}`,
			method,
			params,
		},
	});

	const text = await response.text();

	if (!response.ok()) {
		throw new Error(`MCP request failed: ${response.status()} ${text}`);
	}

	return parseMcpJsonRpcResponse(text);
}

export async function deleteBlogPost({
	id,
	page,
	testInfo,
}: {
	id: number;
	page: Page;
	testInfo: TestInfo;
}): Promise<void> {
	const url = new URL(`/api/blog-posts/${id}`, testInfo.project.use.baseURL);
	const response = await page.request.delete(`${url}`);

	if (!response.ok()) {
		throw new Error(
			`Failed to delete blog post: ${response.status()} ${await response.text()}`,
		);
	}
}

function parseMcpJsonRpcResponse(text: string): McpJsonRpcResponse {
	try {
		return JSON.parse(text) as McpJsonRpcResponse;
	} catch {
		const dataLine = text.split("\n").find((line) => line.startsWith("data: "));

		if (dataLine) {
			return JSON.parse(dataLine.slice("data: ".length)) as McpJsonRpcResponse;
		}
	}

	throw new Error(`Failed to parse MCP response: ${text}`);
}

async function getCurrentUser({
	page,
	testInfo,
}: {
	page: Page;
	testInfo: TestInfo;
}): Promise<{ id: number }> {
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
		return {
			id: json.user.id,
		};
	}

	throw new Error(
		"Failed to get current user because the response was invalid.",
	);
}

function getStringProperty(value: unknown, key: string): string | null {
	if (isRecord(value) && typeof value[key] === "string") {
		return value[key];
	}

	return null;
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
