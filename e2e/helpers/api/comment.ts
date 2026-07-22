import type { Page, TestInfo } from "@playwright/test";
import { getCreatedDocId } from "./mcp";

type CommentStatus = "pending" | "approved" | "rejected";

// Creates a comment directly through the authenticated Payload REST API (which
// the seeded test user can do as an admin), letting a test seed any moderation
// state, author reply, or parent it needs. Pair every call with `deleteComment`
// in teardown.
export async function createComment({
	authorAvatarUrl,
	authorGithubUsername,
	authorName,
	authorReply = false,
	blogPostId,
	body,
	page,
	parentId,
	status,
	testInfo,
}: {
	authorAvatarUrl?: string;
	authorGithubUsername?: string;
	authorName?: string;
	authorReply?: boolean;
	blogPostId: number;
	body: string;
	page: Page;
	parentId?: number;
	status: CommentStatus;
	testInfo: TestInfo;
}): Promise<number> {
	const url = new URL("/api/comments", testInfo.project.use.baseURL);

	const response = await page.request.post(`${url}`, {
		headers: {
			"content-type": "application/json",
		},
		data: {
			blogPost: blogPostId,
			body,
			status,
			authorReply,
			...(authorName === undefined ? {} : { authorName }),
			...(authorGithubUsername === undefined ? {} : { authorGithubUsername }),
			...(authorAvatarUrl === undefined ? {} : { authorAvatarUrl }),
			...(parentId === undefined ? {} : { parent: parentId }),
		},
	});

	if (!response.ok()) {
		throw new Error(
			`Failed to create comment: ${response.status()} ${await response.text()}`,
		);
	}

	const id = getCreatedDocId(await response.json());

	if (id === null) {
		throw new Error("Failed to create comment because no ID was returned.");
	}

	return id;
}

export async function deleteComment({
	id,
	page,
	testInfo,
}: {
	id: number;
	page: Page;
	testInfo: TestInfo;
}): Promise<void> {
	const url = new URL(`/api/comments/${id}`, testInfo.project.use.baseURL);
	const response = await page.request.delete(`${url}`);

	if (!response.ok()) {
		throw new Error(
			`Failed to delete comment: ${response.status()} ${await response.text()}`,
		);
	}
}
