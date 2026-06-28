// biome-ignore lint/correctness/noNodejsModules: e2e key state needs the crypto module
import { randomUUID } from "node:crypto";
// biome-ignore lint/correctness/noNodejsModules: e2e key state needs the fs module
import { readFileSync, rmSync, writeFileSync } from "node:fs";
// biome-ignore lint/correctness/noNodejsModules: e2e key state needs the path module
import { dirname, resolve } from "node:path";
import type { Page, TestInfo } from "@playwright/test";

export const appendNodeInBlogPostBodyTool = "appendNodeInBlogPostBody";
export const deleteNodeInBlogPostBodyTool = "deleteNodeInBlogPostBody";

const mcpE2eApiKeyLabel = "MCP e2e coverage";
const selfDirname = dirname(new URL(import.meta.url).pathname);
const mcpE2eApiKeyStatePath = resolve(
	selfDirname,
	"../../.data/mcp-e2e-api-key.json",
);

interface McpE2eApiKeyState {
	apiKey: string;
	id: number;
}

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
	const envApiKey = readEnvMcpE2eApiKey();

	if (envApiKey) {
		return envApiKey;
	}

	const state = readMcpE2eApiKeyState();

	if (state) {
		return state.apiKey;
	}

	throw new Error(
		"No MCP e2e API key is available. Set PAYLOAD_MCP_E2E_API_KEY or let the setup project provision one.",
	);
}

// Provisions an MCP API key scoped to exactly the surface the MCP e2e test
// asserts (read-only find access plus the two custom body-mutation tools). When
// PAYLOAD_MCP_E2E_API_KEY is set it is treated as a pre-issued override and no
// key is created. Pair every call with cleanupMcpE2eApiKey in teardown.
export async function provisionMcpE2eApiKey({
	page,
	testInfo,
}: {
	page: Page;
	testInfo: TestInfo;
}): Promise<void> {
	if (readEnvMcpE2eApiKey()) {
		return;
	}

	const userId = await getCurrentUserId({ page, testInfo });
	const apiKey = randomUUID();
	const url = new URL(
		"/api/payload-mcp-api-keys",
		testInfo.project.use.baseURL,
	);

	const response = await page.request.post(`${url}`, {
		headers: {
			"content-type": "application/json",
		},
		data: {
			apiKey,
			blogPosts: { find: true },
			coverImages: { find: true },
			description: "Provisioned by the MCP e2e setup project.",
			enableAPIKey: true,
			label: mcpE2eApiKeyLabel,
			media: { find: true },
			"payload-mcp-tool": {
				appendNodeInBlogPostBody: true,
				deleteNodeInBlogPostBody: true,
			},
			tags: { find: true },
			user: userId,
			website: { find: true },
		},
	});

	if (!response.ok()) {
		throw new Error(
			`Failed to provision MCP e2e API key: ${response.status()} ${await response.text()}`,
		);
	}

	const id = getCreatedDocId(await response.json());

	if (id === null) {
		throw new Error(
			"Failed to provision MCP e2e API key because no ID was returned.",
		);
	}

	writeFileSync(
		mcpE2eApiKeyStatePath,
		JSON.stringify({ apiKey, id } satisfies McpE2eApiKeyState),
	);
}

// Deletes the key provisioned by provisionMcpE2eApiKey. Does nothing when the
// key came from PAYLOAD_MCP_E2E_API_KEY or when no key was provisioned.
export async function cleanupMcpE2eApiKey({
	page,
	testInfo,
}: {
	page: Page;
	testInfo: TestInfo;
}): Promise<void> {
	if (readEnvMcpE2eApiKey()) {
		return;
	}

	const state = readMcpE2eApiKeyState();

	if (state === null) {
		return;
	}

	const url = new URL(
		`/api/payload-mcp-api-keys/${state.id}`,
		testInfo.project.use.baseURL,
	);
	const response = await page.request.delete(`${url}`);

	if (!response.ok()) {
		throw new Error(
			`Failed to clean up MCP e2e API key: ${response.status()} ${await response.text()}`,
		);
	}

	rmSync(mcpE2eApiKeyStatePath, { force: true });
}

function readEnvMcpE2eApiKey(): string | undefined {
	// biome-ignore lint/style/noProcessEnv: optional pre-issued MCP e2e API key override
	return process.env.PAYLOAD_MCP_E2E_API_KEY || undefined;
}

function readMcpE2eApiKeyState(): McpE2eApiKeyState | null {
	try {
		return JSON.parse(
			readFileSync(mcpE2eApiKeyStatePath, "utf-8"),
		) as McpE2eApiKeyState;
	} catch {
		return null;
	}
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

function getCreatedDocId(json: unknown): number | null {
	if (!isRecord(json)) {
		return null;
	}

	if (typeof json.id === "number") {
		return json.id;
	}

	if (isRecord(json.doc) && typeof json.doc.id === "number") {
		return json.doc.id;
	}

	return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
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
