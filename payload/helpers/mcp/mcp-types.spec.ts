import { describe, expect, it } from "@jest/globals";
import type { PayloadRequest } from "payload";
import type { McpEvent, McpTextResponse, McpTool } from "./mcp-types";

describe("McpTextResponse", () => {
	it("models an MCP text response", () => {
		const response = {
			content: [{ type: "text", text: "ok" }],
		} satisfies McpTextResponse;

		expect(response).toEqual({
			content: [{ type: "text", text: "ok" }],
		});
	});
});

describe("McpEvent", () => {
	it("models sanitized MCP event fields", () => {
		const event = {
			type: "REQUEST",
			status: "success",
			transport: "HTTP",
			source: "request",
			duration: 12,
		} satisfies McpEvent;

		expect(event.type).toBe("REQUEST");
		expect(event.status).toBe("success");
	});
});

describe("McpTool", () => {
	it("accepts a tool shape compatible with plugin MCP config", async () => {
		const tool = {
			name: "example",
			description: "Example tool.",
			parameters: {} as never,
			handler: async (
				_args: Record<string, unknown>,
				_req: PayloadRequest,
			): Promise<McpTextResponse> => ({
				content: [{ type: "text", text: "ok" }],
			}),
		} satisfies McpTool;

		const response = await tool.handler({}, {} as PayloadRequest);

		expect(tool.name).toBe("example");
		expect(response.content).toEqual([{ type: "text", text: "ok" }]);
	});
});
