import type { Page, TestInfo } from "@playwright/test";
import { NIL as uuidNIL, v5 as uuidV5 } from "uuid";
import type z from "zod";
import { PayloadBlogPost } from "@/repositories/payload-types";
import { getCreatedDocId, getCurrentUserId, isRecord } from "./mcp";

export const exampleBlogPostSlug = "markdown-example";

export async function getExampleBlogPost({
	page,
	testInfo,
}: {
	page: Page;
	testInfo: TestInfo;
}): Promise<z.infer<typeof PayloadBlogPost>> {
	const url = new URL("/api/blog-posts", testInfo.project.use.baseURL);
	url.searchParams.set("where[slug][equals]", exampleBlogPostSlug);
	url.searchParams.set("draft", "true");
	url.searchParams.set("limit", "1");

	const response = await page.request.get(`${url}`);

	if (!response.ok()) {
		throw new Error(
			"Failed to get the example blog post due to non-200 response.",
		);
	}

	const json = await response.json();
	const docs = json.docs;

	if (Array.isArray(docs) && docs.length > 0) {
		return PayloadBlogPost.parse(docs[0]);
	}

	throw new Error(
		"Failed to get the example blog post because it was not found.",
	);
}

// Creates a draft blog post through the authenticated REST API, reusing the
// seeded cover image and current test user so the caller only supplies the
// slug/title and the optional agentic authoring fields. Pair every call with
// `deleteBlogPost` (from the mcp helper) in teardown.
export async function createDraftBlogPost({
	outline,
	authoringNotes,
	body,
	page,
	slug,
	testInfo,
	title,
}: {
	outline?: string;
	authoringNotes?: string;
	// Lexical body override (defaults to a minimal placeholder body). Pass a
	// custom body to exercise how specific content renders on the post page.
	body?: unknown;
	page: Page;
	slug: string;
	testInfo: TestInfo;
	title: string;
}): Promise<{ id: number; slug: string }> {
	const [coverImageId, userId] = await Promise.all([
		getExampleCoverImageId({ page, testInfo }),
		getCurrentUserId({ page, testInfo }),
	]);
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
			brief: "Draft post created by the agentic view e2e test.",
			body: body ?? createMinimalBlogPostBody(),
			author: userId,
			_status: "draft",
			...(outline === undefined ? {} : { outline }),
			...(authoringNotes === undefined ? {} : { authoringNotes }),
		},
	});

	if (!response.ok()) {
		throw new Error(
			`Failed to create draft blog post: ${response.status()} ${await response.text()}`,
		);
	}

	const json: unknown = await response.json();
	const id = getCreatedDocId(json);

	if (id === null) {
		throw new Error(
			"Failed to create draft blog post because no ID was returned.",
		);
	}

	return { id, slug };
}

// Creates a PUBLISHED post carrying the agentic authoring fields, then writes a
// draft version that clears them — reproducing the state where the published
// document has the fields but the post's draft version does not. Used to verify
// the draft agentic view falls back to the published values. Pair with
// `deleteBlogPost`.
export async function createPublishedPostWithEmptyDraftAgentic({
	outline,
	authoringNotes,
	page,
	slug,
	testInfo,
	title,
}: {
	outline?: string;
	authoringNotes?: string;
	page: Page;
	slug: string;
	testInfo: TestInfo;
	title: string;
}): Promise<{ id: number; slug: string }> {
	const [coverImageId, userId] = await Promise.all([
		getExampleCoverImageId({ page, testInfo }),
		getCurrentUserId({ page, testInfo }),
	]);
	const createUrl = new URL("/api/blog-posts", testInfo.project.use.baseURL);
	createUrl.searchParams.set("locale", "ja-JP");

	const createResponse = await page.request.post(`${createUrl}`, {
		headers: {
			"content-type": "application/json",
		},
		data: {
			title,
			slug,
			coverImage: coverImageId,
			brief: "Published post created by the agentic fallback e2e test.",
			body: createMinimalBlogPostBody(),
			author: userId,
			...(outline === undefined ? {} : { outline }),
			...(authoringNotes === undefined ? {} : { authoringNotes }),
			_status: "published",
			publishedAt: "2026-03-01T00:00:00Z",
		},
	});

	if (!createResponse.ok()) {
		throw new Error(
			`Failed to create published blog post: ${createResponse.status()} ${await createResponse.text()}`,
		);
	}

	const id = getCreatedDocId(await createResponse.json());

	if (id === null) {
		throw new Error(
			"Failed to create published blog post because no ID was returned.",
		);
	}

	const draftUrl = new URL(
		`/api/blog-posts/${id}`,
		testInfo.project.use.baseURL,
	);
	draftUrl.searchParams.set("draft", "true");
	draftUrl.searchParams.set("locale", "ja-JP");

	const draftResponse = await page.request.patch(`${draftUrl}`, {
		headers: {
			"content-type": "application/json",
		},
		data: {
			outline: null,
			authoringNotes: null,
		},
	});

	if (!draftResponse.ok()) {
		throw new Error(
			`Failed to clear the draft agentic fields: ${draftResponse.status()} ${await draftResponse.text()}`,
		);
	}

	return { id, slug };
}

// Creates a PUBLISHED post (so it is publicly visible), reusing the seeded
// cover image and current test user. `commentsEnabled` toggles the per-post
// comments section. Pair every call with `deleteBlogPost` in teardown.
export async function createPublishedBlogPost({
	commentsEnabled = true,
	page,
	slug,
	testInfo,
	title,
}: {
	commentsEnabled?: boolean;
	page: Page;
	slug: string;
	testInfo: TestInfo;
	title: string;
}): Promise<{ id: number; slug: string }> {
	const [coverImageId, userId] = await Promise.all([
		getExampleCoverImageId({ page, testInfo }),
		getCurrentUserId({ page, testInfo }),
	]);
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
			brief: "Published post created by the comments e2e test.",
			body: createMinimalBlogPostBody(),
			author: userId,
			commentsEnabled,
			_status: "published",
			publishedAt: "2026-03-01T00:00:00Z",
		},
	});

	if (!response.ok()) {
		throw new Error(
			`Failed to create published blog post: ${response.status()} ${await response.text()}`,
		);
	}

	const id = getCreatedDocId(await response.json());

	if (id === null) {
		throw new Error(
			"Failed to create published blog post because no ID was returned.",
		);
	}

	return { id, slug };
}

async function getExampleCoverImageId({
	page,
	testInfo,
}: {
	page: Page;
	testInfo: TestInfo;
}): Promise<string> {
	const coverImageId = uuidV5(exampleBlogPostSlug, uuidNIL);
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

function createMinimalBlogPostBody(): unknown {
	return {
		root: {
			type: "root",
			children: [
				{
					type: "paragraph",
					children: [
						{
							type: "text",
							detail: 0,
							format: 0,
							mode: "normal",
							style: "",
							text: "本文のプレースホルダー。",
							version: 1,
						},
					],
					direction: "ltr",
					format: "",
					indent: 0,
					textFormat: 0,
					version: 1,
				},
			],
			direction: "ltr",
			format: "",
			indent: 0,
			version: 1,
		},
	};
}
