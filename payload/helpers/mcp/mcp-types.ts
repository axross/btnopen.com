import type { mcpPlugin } from "@payloadcms/plugin-mcp";

type McpServerConfig = NonNullable<Parameters<typeof mcpPlugin>[0]["mcp"]>;

export type McpTool = NonNullable<McpServerConfig["tools"]>[number];

export interface McpTextResponse {
	content: Array<{
		text: string;
		type: "text";
	}>;
}

export interface McpEvent {
	context?: string;
	duration?: number;
	error?: Error | string;
	method?: string;
	requestId?: string;
	sessionId?: string;
	severity?: "error" | "fatal" | "warning";
	source?: "request" | "session" | "system";
	status?: "error" | "success";
	timestamp?: number;
	transport?: "HTTP" | "SSE";
	type?: string;
}
