import { mcpPlugin } from "@payloadcms/plugin-mcp";
import type { TypedUser } from "payload";
import z from "zod";
import { configureMcpApiKeyField } from "./mcp/api-key-fields";
import { appendNodeInBlogPostBodyTool } from "./mcp/append-node-in-blog-post-body";
import { deleteNodeInBlogPostBodyTool } from "./mcp/delete-node-in-blog-post-body";
import { getErrorMessage } from "./mcp/errors";
import { mcpLogger } from "./mcp/logger";
import type { McpEvent } from "./mcp/mcp-types";
import { isRecord } from "./mcp/records";
import {
	McpBlogPostResponse,
	McpSanitizedWebsite,
	McpTagResponse,
	McpUploadResponse,
} from "./mcp/sanitize";

type McpSanitizerCodec = typeof McpBlogPostResponse;

/**
 * Builds the sanitized MCP text response for a find result. The sanitizer
 * codecs are total and should never throw, but if one ever does, the failure
 * is logged and returned as an explicit error payload — never silently
 * swallowed into an empty response.
 */
function sanitizedResponse(
	codec: McpSanitizerCodec,
	doc: unknown,
): { content: Array<{ type: "text"; text: string }> } {
	let text: string;

	try {
		// JSON.stringify(undefined) yields undefined rather than a string, so an
		// absent document degrades to null instead of an invalid response.
		text = JSON.stringify(z.decode(codec, doc) ?? null, null, 2);
	} catch (error) {
		mcpLogger.warn(
			{ error: getErrorMessage(error) },
			"Failed to sanitize an MCP response payload.",
		);

		text = JSON.stringify(
			{ error: "Failed to sanitize the response payload." },
			null,
			2,
		);
	}

	return { content: [{ type: "text", text }] };
}

export const payloadMcpPlugin = mcpPlugin({
	collections: {
		"blog-posts": {
			enabled: { find: true, update: true, delete: true, create: true },
			description:
				"Blog posts for btnopen.com. Use find with select to inspect body before controlled Lexical editor state edits.",
			overrideResponse: (_, doc) => sanitizedResponse(McpBlogPostResponse, doc),
		},
		tags: {
			enabled: { find: true, update: true, delete: true, create: true },
			description: "Editorial tags used to categorize blog posts.",
			overrideResponse: (_, doc) => sanitizedResponse(McpTagResponse, doc),
		},
		"cover-images": {
			enabled: { find: true, update: true, delete: true, create: true },
			description:
				"Existing public cover image uploads for blog post coverImage metadata.",
			overrideResponse: (_, doc) => sanitizedResponse(McpUploadResponse, doc),
		},
		media: {
			enabled: { find: true, update: true, delete: true, create: true },
			description:
				"Existing public media uploads for Payload Lexical upload nodes in blog post bodies.",
			overrideResponse: (_, doc) => sanitizedResponse(McpUploadResponse, doc),
		},
	},
	globals: {
		website: {
			enabled: { find: true },
			description:
				"Public site profile for btnopen.com, including localized site name and description.",
			overrideResponse: (_, doc) => sanitizedResponse(McpSanitizedWebsite, doc),
		},
	},
	mcp: {
		handlerOptions: {
			onEvent: (event) => {
				if (!isRecord(event)) {
					mcpLogger.info({ type: "UNKNOWN" }, "MCP event received.");

					return;
				}

				let errorMessage: string | undefined;

				if (event.error instanceof Error) {
					errorMessage = event.error.message;
				} else if (typeof event.error === "string") {
					errorMessage = event.error;
				}

				const safeEvent: McpEvent = {
					type: typeof event.type === "string" ? event.type : "UNKNOWN",
					method: typeof event.method === "string" ? event.method : undefined,
					status:
						event.status === "success" || event.status === "error"
							? event.status
							: undefined,
					duration:
						typeof event.duration === "number" ? event.duration : undefined,
					requestId:
						typeof event.requestId === "string" ? event.requestId : undefined,
					sessionId:
						typeof event.sessionId === "string" ? event.sessionId : undefined,
					transport:
						event.transport === "HTTP" || event.transport === "SSE"
							? event.transport
							: undefined,
					source:
						event.source === "request" ||
						event.source === "session" ||
						event.source === "system"
							? event.source
							: undefined,
					severity:
						event.severity === "warning" ||
						event.severity === "error" ||
						event.severity === "fatal"
							? event.severity
							: undefined,
					context:
						typeof event.context === "string" ? event.context : undefined,
					error: errorMessage,
					timestamp:
						typeof event.timestamp === "number" ? event.timestamp : undefined,
				};

				if (safeEvent.type === "ERROR") {
					mcpLogger.warn(safeEvent, "MCP event reported an error.");

					return;
				}

				mcpLogger.info(safeEvent, "MCP event received.");
			},
		},
		serverOptions: {
			serverInfo: {
				name: "btnopen Payload CMS",
				version: "1.0.0",
			},
		},
		tools: [appendNodeInBlogPostBodyTool, deleteNodeInBlogPostBodyTool],
	},
	overrideApiKeyCollection: (collection) => ({
		...collection,
		fields: collection.fields.map(configureMcpApiKeyField),
	}),
	overrideAuth: async (req, getDefaultMcpAccessSettings) => {
		const accessSettings = await getDefaultMcpAccessSettings();
		req.user = accessSettings.user as TypedUser;

		return accessSettings;
	},
});
