import { mcpPlugin } from "@payloadcms/plugin-mcp";
import type { Field, PayloadRequest, TypedUser } from "payload";
import z from "zod";
import { rootLogger } from "@/logger";
import {
	PayloadBlogPost,
	PayloadLocale,
	PayloadTag,
	PayloadUpload,
} from "@/repositories/payload-types";
import type { BlogPost } from "../types";

const logger = rootLogger.child({ module: "🤖" });

interface McpTextResponse {
	content: Array<{
		text: string;
		type: "text";
	}>;
}

type MutableField = Record<string, unknown> & {
	defaultValue?: unknown;
	fields?: MutableField[];
	name?: string;
	type?: string;
};

type BlogPostWriteData = Partial<
	Pick<BlogPost, "body" | "brief" | "slug" | "title">
> & {
	_status: "draft";
	author?: number;
	coverImage?: string;
	tags?: number[];
};

interface McpEvent {
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

const BlogPostBodyEditorState = PayloadBlogPost.shape.body
	.unwrap()
	.describe(
		"Payload Lexical editor state JSON for blog post body. Use upload nodes with relationTo='media' and value set to an existing media ID; do not pass Markdown.",
	);

const GetBlogPostDraftEditorStateParameters = z.object({
	slug: PayloadBlogPost.shape.slug.describe(
		"Current slug of the blog post draft to read.",
	),
	locale: PayloadLocale.optional()
		.default("ja-JP")
		.describe("Locale to read. Defaults to Japanese."),
	fallbackLocale: PayloadLocale.optional().describe(
		"Optional fallback locale.",
	),
});

const CreateBlogPostDraftParameters = z.object({
	title: PayloadBlogPost.shape.title.describe("Draft title."),
	slug: PayloadBlogPost.shape.slug.describe("Unique URL slug for the draft."),
	brief: PayloadBlogPost.shape.brief.describe("Short draft summary."),
	body: BlogPostBodyEditorState,
	coverImageId: PayloadUpload.shape.id
		.unwrap()
		.describe("ID of an existing cover-images upload."),
	tagSlugs: z
		.array(PayloadTag.shape.slug)
		.optional()
		.describe("Existing tag slugs to attach to the draft."),
	locale: PayloadLocale.optional()
		.default("ja-JP")
		.describe("Locale to write. Defaults to Japanese."),
	fallbackLocale: PayloadLocale.optional().describe(
		"Optional fallback locale.",
	),
});

const UpdateBlogPostDraftParameters = z.object({
	slug: PayloadBlogPost.shape.slug.describe(
		"Current slug of the blog post draft to update.",
	),
	nextSlug: PayloadBlogPost.shape.slug
		.optional()
		.describe("Optional replacement slug."),
	title: PayloadBlogPost.shape.title
		.optional()
		.describe("Updated draft title."),
	brief: PayloadBlogPost.shape.brief
		.optional()
		.describe("Updated draft summary."),
	body: BlogPostBodyEditorState.optional().describe(
		"Replacement Payload Lexical editor state JSON. Omit this field to preserve the existing body, including image/media upload nodes.",
	),
	coverImageId: PayloadUpload.shape.id
		.unwrap()
		.optional()
		.describe("ID of an existing cover-images upload."),
	tagSlugs: z
		.array(PayloadTag.shape.slug)
		.optional()
		.describe("Replacement tag slugs. Pass an empty array to clear tags."),
	locale: PayloadLocale.optional()
		.default("ja-JP")
		.describe("Locale to write. Defaults to Japanese."),
	fallbackLocale: PayloadLocale.optional().describe(
		"Optional fallback locale.",
	),
});

export const payloadMcpPlugin = mcpPlugin({
	collections: {
		"blog-posts": {
			enabled: { find: true },
			description:
				"Blog posts for btnopen.com. Use find for discovery only. Use draft-specific editor-state tools for full body reads and draft-only writes.",
			overrideResponse: (_, doc) =>
				createJsonResponse(sanitizeCollectionResult(doc, sanitizeBlogPost)),
		},
		tags: {
			enabled: { find: true },
			description:
				"Editorial tags used to categorize blog posts. Find tags before assigning tagSlugs in draft tools.",
			overrideResponse: (_, doc) =>
				createJsonResponse(sanitizeCollectionResult(doc, sanitizeTag)),
		},
		"cover-images": {
			enabled: { find: true },
			description:
				"Existing public cover image uploads for blog post coverImage metadata. Find a cover image ID before creating a draft.",
			overrideResponse: (_, doc) =>
				createJsonResponse(sanitizeCollectionResult(doc, sanitizeUpload)),
		},
		media: {
			enabled: { find: true },
			description:
				"Existing public media uploads for Payload Lexical upload nodes in blog post bodies.",
			overrideResponse: (_, doc) =>
				createJsonResponse(sanitizeCollectionResult(doc, sanitizeUpload)),
		},
	},
	globals: {
		website: {
			enabled: { find: true },
			description:
				"Public site profile for btnopen.com, including localized site name and description.",
			overrideResponse: (_, doc) => createJsonResponse(sanitizeWebsite(doc)),
		},
	},
	mcp: {
		handlerOptions: {
			onEvent: logMcpEvent,
		},
		serverOptions: {
			serverInfo: {
				name: "btnopen Payload CMS",
				version: "1.0.0",
			},
		},
		tools: [
			{
				name: "getBlogPostDraftEditorState",
				description:
					"Read one blog post draft with its Payload Lexical editor state body. Use before body edits so existing upload/media nodes can be preserved.",
				parameters: toMcpParameters(
					GetBlogPostDraftEditorStateParameters.shape,
				),
				handler: getBlogPostDraftEditorState,
			},
			{
				name: "createBlogPostDraft",
				description:
					"Create a draft-only blog post from Payload Lexical editor state JSON. This never publishes content and does not accept Markdown.",
				parameters: toMcpParameters(CreateBlogPostDraftParameters.shape),
				handler: createBlogPostDraft,
			},
			{
				name: "updateBlogPostDraft",
				description:
					"Update an existing blog post as a draft. Omit body to preserve existing rich content; pass Payload Lexical editor state JSON only when replacing the body.",
				parameters: toMcpParameters(UpdateBlogPostDraftParameters.shape),
				handler: updateBlogPostDraft,
			},
		],
	},
	overrideApiKeyCollection: (collection) => ({
		...collection,
		fields: collection.fields.map((field) =>
			disableCustomToolDefault(field as MutableField),
		) as Field[],
	}),
	overrideAuth: async (req, getDefaultMcpAccessSettings) => {
		const accessSettings = await getDefaultMcpAccessSettings();
		req.user = accessSettings.user as TypedUser;

		return accessSettings;
	},
});

async function getBlogPostDraftEditorState(
	args: Record<string, unknown>,
	req: PayloadRequest,
): Promise<McpTextResponse> {
	const parsedArgs = GetBlogPostDraftEditorStateParameters.safeParse(args);

	if (!parsedArgs.success) {
		return createErrorResponse(formatZodError(parsedArgs.error));
	}

	const params = parsedArgs.data;
	const startedAt = performance.now();

	logger.info(
		{ slug: params.slug, locale: params.locale },
		"Started reading blog post draft editor state through MCP.",
	);

	const blogPost = await findBlogPostBySlug(req, params.slug, {
		fallbackLocale: params.fallbackLocale,
		locale: params.locale,
		select: {
			id: true,
			slug: true,
			title: true,
			brief: true,
			body: true,
			_status: true,
			updatedAt: true,
			createdAt: true,
		},
	});

	if (!blogPost) {
		return createErrorResponse(
			`No blog post exists for slug "${params.slug}".`,
		);
	}

	logger.info(
		{ slug: blogPost.slug, duration: performance.now() - startedAt },
		"Completed reading blog post draft editor state through MCP.",
	);

	return createJsonResponse({
		blogPost: sanitizeBlogPostWithBody(blogPost),
		message:
			"Read the draft editor state. Preserve existing upload/media nodes when replacing body.",
	});
}

async function createBlogPostDraft(
	args: Record<string, unknown>,
	req: PayloadRequest,
): Promise<McpTextResponse> {
	const parsedArgs = CreateBlogPostDraftParameters.safeParse(args);

	if (!parsedArgs.success) {
		return createErrorResponse(formatZodError(parsedArgs.error));
	}

	const params = parsedArgs.data;
	const startedAt = performance.now();

	logger.info(
		{ slug: params.slug, locale: params.locale },
		"Started creating blog post draft through MCP.",
	);

	const body = params.body as BlogPost["body"];

	await validateRichTextReferences(req, body);

	const tagIds = await resolveTagIds(req, params.tagSlugs);
	const coverImageId = await resolveCoverImageId(req, params.coverImageId);
	const authorId = getAuthenticatedUserId(req);

	const data: BlogPostWriteData = {
		_status: "draft",
		title: params.title,
		slug: params.slug,
		brief: params.brief,
		coverImage: coverImageId,
		tags: tagIds,
		author: authorId,
		body,
	};

	const blogPost = await req.payload.create({
		collection: "blog-posts",
		data,
		depth: 0,
		draft: true,
		fallbackLocale: params.fallbackLocale,
		locale: params.locale,
		overrideAccess: false,
		req,
		select: draftResultSelect,
		user: req.user,
	});

	logger.info(
		{ slug: blogPost.slug, duration: performance.now() - startedAt },
		"Completed creating blog post draft through MCP.",
	);

	return createJsonResponse({
		blogPost: sanitizeBlogPost(blogPost),
		message:
			"Created a draft blog post. Review and publish it from Payload Admin.",
	});
}

async function updateBlogPostDraft(
	args: Record<string, unknown>,
	req: PayloadRequest,
): Promise<McpTextResponse> {
	const parsedArgs = UpdateBlogPostDraftParameters.safeParse(args);

	if (!parsedArgs.success) {
		return createErrorResponse(formatZodError(parsedArgs.error));
	}

	const params = parsedArgs.data;
	const startedAt = performance.now();

	logger.info(
		{ slug: params.slug, locale: params.locale },
		"Started updating blog post draft through MCP.",
	);

	const existingBlogPost = await findBlogPostBySlug(req, params.slug, {
		fallbackLocale: params.fallbackLocale,
		locale: params.locale,
		select: {
			id: true,
			slug: true,
		},
	});

	if (!existingBlogPost) {
		return createErrorResponse(
			`No blog post exists for slug "${params.slug}".`,
		);
	}

	const data: BlogPostWriteData = {
		_status: "draft",
	};

	if (params.nextSlug) {
		data.slug = params.nextSlug;
	}

	if (params.title) {
		data.title = params.title;
	}

	if (params.brief) {
		data.brief = params.brief;
	}

	if (params.body) {
		const body = params.body as BlogPost["body"];

		await validateRichTextReferences(req, body);
		data.body = body;
	}

	if (params.coverImageId) {
		data.coverImage = await resolveCoverImageId(req, params.coverImageId);
	}

	if (params.tagSlugs) {
		data.tags = await resolveTagIds(req, params.tagSlugs);
	}

	if (Object.keys(data).length === 1) {
		return createErrorResponse("No draft fields were provided to update.");
	}

	const blogPost = await req.payload.update({
		id: existingBlogPost.id,
		collection: "blog-posts",
		data,
		depth: 0,
		draft: true,
		fallbackLocale: params.fallbackLocale,
		locale: params.locale,
		overrideAccess: false,
		overrideLock: false,
		req,
		select: draftResultSelect,
		user: req.user,
	});

	logger.info(
		{ slug: blogPost.slug, duration: performance.now() - startedAt },
		"Completed updating blog post draft through MCP.",
	);

	return createJsonResponse({
		blogPost: sanitizeBlogPost(blogPost),
		message:
			"Updated the blog post draft. Review and publish it from Payload Admin.",
	});
}

const draftResultSelect = {
	id: true,
	slug: true,
	title: true,
	brief: true,
	_status: true,
	updatedAt: true,
	createdAt: true,
} as const;

async function resolveCoverImageId(
	req: PayloadRequest,
	coverImageId: string,
): Promise<string> {
	const coverImage = await req.payload.findByID({
		id: coverImageId,
		collection: "cover-images",
		depth: 0,
		overrideAccess: false,
		req,
		select: {
			id: true,
		},
		user: req.user,
	});

	return coverImage.id;
}

async function resolveTagIds(
	req: PayloadRequest,
	tagSlugs: string[] | undefined,
): Promise<number[] | undefined> {
	if (tagSlugs === undefined) {
		return;
	}

	if (tagSlugs.length === 0) {
		return [];
	}

	const tags = await req.payload.find({
		collection: "tags",
		depth: 0,
		limit: tagSlugs.length,
		overrideAccess: false,
		pagination: false,
		req,
		select: {
			id: true,
			slug: true,
		},
		user: req.user,
		where: {
			slug: {
				in: tagSlugs,
			},
		},
	});

	const foundSlugs = new Set(tags.docs.map((tag) => tag.slug));
	const missingSlugs = tagSlugs.filter((slug) => !foundSlugs.has(slug));

	if (missingSlugs.length > 0) {
		throw new Error(`Unknown tag slugs: ${missingSlugs.join(", ")}`);
	}

	return tags.docs.map((tag) => tag.id);
}

async function findBlogPostBySlug<Select extends Record<string, boolean>>(
	req: PayloadRequest,
	slug: string,
	options: {
		fallbackLocale?: "en-US" | "ja-JP";
		locale: "en-US" | "ja-JP";
		select: Select;
	},
): Promise<BlogPost | null> {
	const result = await req.payload.find({
		collection: "blog-posts",
		depth: 0,
		draft: true,
		fallbackLocale: options.fallbackLocale,
		limit: 1,
		locale: options.locale,
		overrideAccess: false,
		pagination: false,
		req,
		select: options.select,
		user: req.user,
		where: {
			slug: {
				equals: slug,
			},
		},
	});

	return (result.docs[0] as BlogPost | undefined) ?? null;
}

async function validateRichTextReferences(
	req: PayloadRequest,
	body: BlogPost["body"],
): Promise<void> {
	const uploadIds = new Set<string>();

	collectUploadIds(body.root.children, uploadIds);

	await Promise.all(
		Array.from(uploadIds).map(async (mediaId) => {
			await req.payload.findByID({
				id: mediaId,
				collection: "media",
				depth: 0,
				overrideAccess: false,
				req,
				select: {
					id: true,
				},
				user: req.user,
			});
		}),
	);
}

function collectUploadIds(nodes: unknown[], uploadIds: Set<string>): void {
	for (const node of nodes) {
		if (!isRecord(node)) {
			continue;
		}

		if (node.type === "upload") {
			if (node.relationTo !== "media" || typeof node.value !== "string") {
				throw new Error(
					"Blog post body upload nodes must use relationTo='media' and an existing media ID as value.",
				);
			}

			uploadIds.add(node.value);
		}

		if (Array.isArray(node.children)) {
			collectUploadIds(node.children, uploadIds);
		}
	}
}

function getAuthenticatedUserId(req: PayloadRequest): number {
	const user = req.user;

	if (isRecord(user) && typeof user.id === "number") {
		return user.id;
	}

	throw new Error("MCP request does not have an authenticated user.");
}

function createJsonResponse(data: unknown): McpTextResponse {
	return {
		content: [
			{
				type: "text",
				text: JSON.stringify(data, null, 2),
			},
		],
	};
}

function createErrorResponse(message: string): McpTextResponse {
	return {
		content: [
			{
				type: "text",
				text: `Error: ${message}`,
			},
		],
	};
}

function sanitizeCollectionResult(
	doc: Record<string, unknown>,
	sanitizeDoc: (value: unknown) => unknown,
): unknown {
	if (Array.isArray(doc.docs)) {
		return {
			totalDocs: doc.totalDocs,
			limit: doc.limit,
			page: doc.page,
			totalPages: doc.totalPages,
			docs: doc.docs.map(sanitizeDoc),
		};
	}

	return sanitizeDoc(doc);
}

function sanitizeBlogPost(value: unknown): unknown {
	if (!isRecord(value)) {
		return value;
	}

	return {
		id: value.id,
		slug: value.slug,
		title: value.title,
		brief: value.brief,
		status: value._status,
		publishedAt: value.publishedAt,
		createdAt: value.createdAt,
		updatedAt: value.updatedAt,
		tags: Array.isArray(value.tags) ? value.tags.map(sanitizeTag) : undefined,
		coverImage: sanitizeUpload(value.coverImage),
		author: sanitizeUser(value.author),
	};
}

function sanitizeBlogPostWithBody(value: unknown): unknown {
	const blogPost = sanitizeBlogPost(value);

	return {
		...(isRecord(blogPost) ? blogPost : { blogPost }),
		body: isRecord(value) ? value.body : undefined,
	};
}

function sanitizeWebsite(value: unknown): unknown {
	if (!isRecord(value)) {
		return value;
	}

	return {
		name: value.name,
		description: value.description,
		keywords: value.keywords,
		creator: sanitizeUser(value.creator),
	};
}

function sanitizeTag(value: unknown): unknown {
	if (!isRecord(value)) {
		return value;
	}

	return {
		id: value.id,
		slug: value.slug,
		name: value.name,
	};
}

function sanitizeUpload(value: unknown): unknown {
	if (!isRecord(value)) {
		return value;
	}

	return {
		id: value.id,
		filename: value.filename,
		url: value.url,
		mimeType: value.mimeType,
		width: value.width,
		height: value.height,
		sizes: value.sizes,
	};
}

function sanitizeUser(value: unknown): unknown {
	if (!isRecord(value)) {
		return value;
	}

	return {
		id: value.id,
		name: value.name,
		avatarImage: sanitizeUpload(value.avatarImage),
	};
}

function disableCustomToolDefault(field: MutableField): MutableField {
	const nextField = {
		...field,
	};

	if (Array.isArray(nextField.fields)) {
		nextField.fields = nextField.fields.map(disableCustomToolDefault);
	}

	if (field.name === "payload-mcp-tool" && Array.isArray(nextField.fields)) {
		nextField.fields = nextField.fields.map((childField) => ({
			...childField,
			defaultValue: false,
		}));
	}

	return nextField;
}

function toMcpParameters(shape: z.ZodRawShape): never {
	// The plugin declaration is narrower than the MCP SDK runtime, which accepts
	// Zod v3/v4-compatible raw shapes.
	return shape as never;
}

function logMcpEvent(event: unknown): void {
	const safeEvent = sanitizeMcpEvent(event);

	if (safeEvent.type === "ERROR") {
		logger.warn(safeEvent, "MCP event reported an error.");

		return;
	}

	logger.info(safeEvent, "MCP event received.");
}

function sanitizeMcpEvent(event: unknown): McpEvent {
	if (!isRecord(event)) {
		return {
			type: "UNKNOWN",
		};
	}

	const errorMessage = getMcpEventErrorMessage(event.error);

	return {
		type: typeof event.type === "string" ? event.type : "UNKNOWN",
		method: typeof event.method === "string" ? event.method : undefined,
		status:
			event.status === "success" || event.status === "error"
				? event.status
				: undefined,
		duration: typeof event.duration === "number" ? event.duration : undefined,
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
		context: typeof event.context === "string" ? event.context : undefined,
		error: errorMessage,
		timestamp:
			typeof event.timestamp === "number" ? event.timestamp : undefined,
	};
}

function getMcpEventErrorMessage(error: unknown): string | undefined {
	if (error instanceof Error) {
		return error.message;
	}

	if (typeof error === "string") {
		return error;
	}

	return;
}

function formatZodError(error: z.ZodError): string {
	return error.issues
		.map((issue) => `${issue.path.join(".") || "arguments"}: ${issue.message}`)
		.join("\n");
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}
