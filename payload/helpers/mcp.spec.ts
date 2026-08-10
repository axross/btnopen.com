import type { MCPAccessSettings, mcpPlugin } from "@payloadcms/plugin-mcp";
import type { PayloadRequest, TypedUser } from "payload";
import { describe, expect, it, vi } from "vitest";
import "./mcp";
import { mcpLogger } from "./mcp/logger";

type PluginConfig = Parameters<typeof mcpPlugin>[0];
type OverrideResponse = NonNullable<
	NonNullable<PluginConfig["collections"]>[keyof NonNullable<
		PluginConfig["collections"]
	>]
>["overrideResponse"];

/**
 * Holds the configuration object across the hoisting boundary. `vi.hoisted()`
 * runs before the mock factory below, which in turn runs before this module's
 * own body, so an ordinary module-level binding would still be in its temporal
 * dead zone when the factory assigned to it.
 */
const captured = vi.hoisted(() => ({ config: undefined as unknown }));

/**
 * `mcp.ts` exports only the built plugin, and deliberately exports none of the
 * closures it hands to `mcpPlugin()` — adding an export that exists only for a
 * test would be the wrong trade. Fake the plugin package instead so importing
 * the module captures the configuration object, then exercise the closures on
 * it directly; that covers the same functions plus the wiring around them.
 */
vi.mock("@payloadcms/plugin-mcp", () => ({
	mcpPlugin: (config: unknown) => {
		captured.config = config;

		return () => undefined;
	},
}));

// the side-effect import of `./mcp` above resolves before this module's body
// runs, so the faked plugin factory has already captured the configuration.
const capturedConfig = captured.config as PluginConfig;

const emptyResponse = { content: [] };
const fakeRequest = {} as PayloadRequest;

/**
 * Builds what `getDefaultMcpAccessSettings()` resolves to. The plugin's type
 * declares `user` as required, but an API key's user is optional at runtime
 * (see `makeMcpApiKeyUserOptional`) — the absent case is exactly what
 * `overrideAuth` exists to normalize, so it is cast in here.
 */
function fakeAccessSettings(settings: { user?: TypedUser }): MCPAccessSettings {
	return settings as MCPAccessSettings;
}

function collectionOverrideResponse(
	slug: "blog-posts" | "tags" | "cover-images" | "media",
): NonNullable<OverrideResponse> {
	const overrideResponse = capturedConfig.collections?.[slug]?.overrideResponse;

	if (overrideResponse === undefined) {
		throw new Error(`The ${slug} collection must override its response.`);
	}

	return overrideResponse;
}

function websiteOverrideResponse(): NonNullable<OverrideResponse> {
	const overrideResponse = capturedConfig.globals?.website?.overrideResponse;

	if (overrideResponse === undefined) {
		throw new Error("The website global must override its response.");
	}

	return overrideResponse;
}

/**
 * Reads back the JSON payload a sanitized MCP text response carries. The shape
 * checks throw rather than assert, matching how the override lookups above
 * report a missing hook: they are preconditions for reading the payload at all,
 * so the scenario's own assertion stays the one that reports a failure.
 */
function sanitizedPayload(
	overrideResponse: NonNullable<OverrideResponse>,
	doc: unknown,
): unknown {
	const response = overrideResponse(
		emptyResponse,
		doc as Record<string, unknown>,
		fakeRequest,
	);

	if (response.content.length !== 1 || response.content[0].type !== "text") {
		throw new Error(
			"A sanitized MCP response must carry exactly one text content entry.",
		);
	}

	return JSON.parse(response.content[0].text);
}

function onEvent(): (event: unknown) => void {
	const handler = capturedConfig.mcp?.handlerOptions?.onEvent;

	if (handler === undefined) {
		throw new Error("The MCP handler options must register an onEvent hook.");
	}

	return handler;
}

function overrideAuth(): NonNullable<PluginConfig["overrideAuth"]> {
	const handler = capturedConfig.overrideAuth;

	if (handler === undefined) {
		throw new Error("The plugin configuration must override auth.");
	}

	return handler;
}

describe("the MCP plugin configuration", () => {
	it("exposes the four content collections", () => {
		expect(Object.keys(capturedConfig.collections ?? {}).sort()).toEqual([
			"blog-posts",
			"cover-images",
			"media",
			"tags",
		]);
	});

	it("exposes the website global as read-only", () => {
		expect(capturedConfig.globals?.website?.enabled).toEqual({ find: true });
	});
});

describe("overrideResponse()", () => {
	it("keeps only a blog post's public fields, renaming _status to status", () => {
		expect(
			sanitizedPayload(collectionOverrideResponse("blog-posts"), {
				id: 1,
				slug: "hello",
				title: "こんにちは",
				_status: "published",
				internalNote: "not for MCP",
			}),
		).toEqual({
			id: 1,
			slug: "hello",
			title: "こんにちは",
			status: "published",
		});
	});

	it("sanitizes every document of a paginated blog post result", () => {
		expect(
			sanitizedPayload(collectionOverrideResponse("blog-posts"), {
				totalDocs: 1,
				limit: 10,
				page: 1,
				totalPages: 1,
				internalCursor: "leaky",
				docs: [{ id: 1, slug: "hello", internalNote: "not for MCP" }],
			}),
		).toEqual({
			totalDocs: 1,
			limit: 10,
			page: 1,
			totalPages: 1,
			docs: [{ id: 1, slug: "hello" }],
		});
	});

	it("keeps only a tag's public fields", () => {
		expect(
			sanitizedPayload(collectionOverrideResponse("tags"), {
				id: 3,
				slug: "typescript",
				name: "TypeScript",
				createdBy: "someone",
			}),
		).toEqual({ id: 3, slug: "typescript", name: "TypeScript" });
	});

	it("keeps only an upload's public file metadata", () => {
		for (const slug of ["cover-images", "media"] as const) {
			expect(
				sanitizedPayload(collectionOverrideResponse(slug), {
					id: 7,
					filename: "cover.webp",
					url: "https://example.com/cover.webp",
					mimeType: "image/webp",
					width: 1200,
					height: 630,
					sizes: {},
					prefix: "internal/path",
				}),
			).toEqual({
				id: 7,
				filename: "cover.webp",
				url: "https://example.com/cover.webp",
				mimeType: "image/webp",
				width: 1200,
				height: 630,
				sizes: {},
			});
		}
	});

	it("keeps only the website global's public fields, sanitizing its creator", () => {
		expect(
			sanitizedPayload(websiteOverrideResponse(), {
				name: "btnopen.com",
				description: "a blog",
				keywords: ["blog"],
				creator: {
					id: 1,
					name: "axross",
					bio: {},
					email: "private@example.com",
				},
				internalSetting: "leaky",
			}),
		).toEqual({
			name: "btnopen.com",
			description: "a blog",
			keywords: ["blog"],
			creator: { id: 1, name: "axross", bio: {} },
		});
	});

	it("degrades an absent document to null rather than an invalid response", () => {
		expect(
			sanitizedPayload(collectionOverrideResponse("tags"), undefined),
		).toBe(null);
	});

	it("returns an explicit error payload when sanitizing throws", () => {
		const warn = vi
			.spyOn(mcpLogger, "warn")
			.mockImplementation(() => undefined);

		// the sanitizer codecs are total, so the failure has to come from the
		// document itself: reading `docs` throws while the collection shape is
		// being detected.
		const unreadableDoc: Record<string, unknown> = {};
		Object.defineProperty(unreadableDoc, "docs", {
			enumerable: true,
			get() {
				throw new Error("unreadable payload");
			},
		});

		expect(
			sanitizedPayload(collectionOverrideResponse("blog-posts"), unreadableDoc),
		).toEqual({ error: "Failed to sanitize the response payload." });
		expect(warn).toHaveBeenCalledTimes(1);
	});
});

describe("onEvent()", () => {
	it("logs an unknown type for an event that is not a record", () => {
		const info = vi
			.spyOn(mcpLogger, "info")
			.mockImplementation(() => undefined);

		onEvent()("not an event");

		expect(info).toHaveBeenCalledWith(
			{ type: "UNKNOWN" },
			"MCP event received.",
		);
	});

	it("normalizes an unknown-shaped record to an unknown type and no facets", () => {
		const info = vi
			.spyOn(mcpLogger, "info")
			.mockImplementation(() => undefined);

		onEvent()({
			type: 42,
			method: {},
			status: "weird",
			duration: "soon",
			transport: "CARRIER-PIGEON",
			severity: "mild",
		});

		expect(info).toHaveBeenCalledWith(
			expect.objectContaining({
				type: "UNKNOWN",
				method: undefined,
				status: undefined,
				duration: undefined,
				transport: undefined,
				severity: undefined,
			}),
			"MCP event received.",
		);
	});

	it("passes a well-formed event's facets through", () => {
		const info = vi
			.spyOn(mcpLogger, "info")
			.mockImplementation(() => undefined);

		onEvent()({
			type: "REQUEST",
			method: "tools/list",
			status: "success",
			duration: 12,
			requestId: "req-1",
			sessionId: "sess-1",
			transport: "HTTP",
			source: "request",
			severity: "warning",
			context: "listing tools",
			timestamp: 1234,
		});

		expect(info).toHaveBeenCalledWith(
			expect.objectContaining({
				type: "REQUEST",
				method: "tools/list",
				status: "success",
				duration: 12,
				transport: "HTTP",
				source: "request",
			}),
			"MCP event received.",
		);
	});

	it("warns on an ERROR event, reducing its error to a message", () => {
		const warn = vi
			.spyOn(mcpLogger, "warn")
			.mockImplementation(() => undefined);
		const info = vi
			.spyOn(mcpLogger, "info")
			.mockImplementation(() => undefined);

		onEvent()({ type: "ERROR", error: new Error("it broke") });

		expect(warn).toHaveBeenCalledWith(
			expect.objectContaining({ type: "ERROR", error: "it broke" }),
			"MCP event reported an error.",
		);
		expect(info).not.toHaveBeenCalled();
	});

	it("accepts an error already reported as a string", () => {
		const warn = vi
			.spyOn(mcpLogger, "warn")
			.mockImplementation(() => undefined);

		onEvent()({ type: "ERROR", error: "it broke" });

		expect(warn).toHaveBeenCalledWith(
			expect.objectContaining({ error: "it broke" }),
			"MCP event reported an error.",
		);
	});
});

describe("overrideAuth()", () => {
	it("normalizes an absent user to null so access rules deny it", async () => {
		const request = {} as PayloadRequest;

		await overrideAuth()(request, async () => fakeAccessSettings({}));

		expect(request.user).toBe(null);
	});

	it("keeps the user an API key resolves to", async () => {
		const request = {} as PayloadRequest;
		const user = { id: 1, collection: "users" } as unknown as TypedUser;

		await overrideAuth()(request, async () => fakeAccessSettings({ user }));

		expect(request.user).toBe(user);
	});

	it("returns the resolved access settings unchanged", async () => {
		const accessSettings = fakeAccessSettings({});

		await expect(
			overrideAuth()({} as PayloadRequest, async () => accessSettings),
		).resolves.toBe(accessSettings);
	});
});
