import type { Page, TestInfo } from "@playwright/test";

export const appendNodeInBlogPostBodyTool = "appendNodeInBlogPostBody";
export const deleteNodeInBlogPostBodyTool = "deleteNodeInBlogPostBody";

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

export function getMcpE2eApiKey(): string {
	// biome-ignore lint/style/noProcessEnv: using the pre-issued MCP e2e API key
	const apiKey = process.env.PAYLOAD_MCP_E2E_API_KEY;

	if (!apiKey) {
		throw new Error(
			"PAYLOAD_MCP_E2E_API_KEY must be set for MCP e2e coverage.",
		);
	}

	return apiKey;
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
