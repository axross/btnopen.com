import type { Page, TestInfo } from "@playwright/test";
import { NIL as uuidNIL, v5 as uuidV5 } from "uuid";
import type z from "zod";
import { PayloadBlogPost } from "@/repositories/payload-types";

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
// slug/title and an optional outline. Pair every call with `deleteBlogPost`
// (from the mcp helper) in teardown.
export async function createDraftBlogPost({
	outline,
	page,
	slug,
	testInfo,
	title,
}: {
	outline?: string;
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
			brief: "Draft post created by the outline e2e test.",
			body: createMinimalBlogPostBody(),
			author: userId,
			_status: "draft",
			...(outline === undefined ? {} : { outline }),
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
