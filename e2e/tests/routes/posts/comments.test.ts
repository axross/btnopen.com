import { expect, test } from "@playwright/test";
import { authenticatedStorageState } from "@/e2e/helpers/api/auth";
import { createPublishedBlogPost } from "@/e2e/helpers/api/blog-post";
import { createComment, deleteComment } from "@/e2e/helpers/api/comment";
import { deleteBlogPost } from "@/e2e/helpers/api/mcp";

test.use({ storageState: authenticatedStorageState });

function uniqueSlug(prefix: string, repeat: number, worker: number): string {
	return `${prefix}-${repeat}-${worker}-${Date.now()}`;
}

test(
	"A post shows its approved comments with the author's reply, hiding pending ones",
	{
		tag: [
			"@scenario:post.comments.section",
			"@scenario:post.comments.author-reply",
			"@area:posts",
			"@priority:should",
		],
	},
	async ({ page }, testInfo) => {
		const approvedBody = "承認済みのコメント本文です。";
		const pendingBody = "保留中のコメント本文です。";
		const replyBody = "著者からの返信本文です。";

		let postId: number | null = null;
		const commentIds: number[] = [];

		try {
			const slug = uniqueSlug(
				"comments-section",
				testInfo.repeatEachIndex,
				testInfo.workerIndex,
			);

			await test.step("Create a published post with comments enabled", async () => {
				({ id: postId } = await createPublishedBlogPost({
					page,
					slug,
					testInfo,
					title: "コメントのある投稿",
				}));
			});

			await test.step("Seed an approved comment, a pending comment, and an author reply", async () => {
				const blogPostId = postId as number;

				const approvedId = await createComment({
					page,
					testInfo,
					blogPostId,
					body: approvedBody,
					status: "approved",
					authorName: "花子",
					authorGithubUsername: "hanako",
				});
				commentIds.push(approvedId);

				commentIds.push(
					await createComment({
						page,
						testInfo,
						blogPostId,
						body: pendingBody,
						status: "pending",
						authorName: "太郎",
					}),
				);

				commentIds.push(
					await createComment({
						page,
						testInfo,
						blogPostId,
						body: replyBody,
						status: "approved",
						authorReply: true,
						parentId: approvedId,
					}),
				);
			});

			await test.step("Navigate to the post", async () => {
				await page.goto(`/posts/${slug}`);
			});

			const comments = page.getByTestId("comments");

			await test.step("Verify the comments section is visible", async () => {
				await expect(comments).toBeVisible();
			});

			await test.step("Verify the approved comment is shown", async () => {
				await expect(comments.getByText(approvedBody)).toBeVisible();
			});

			await test.step("Verify the pending comment is not shown", async () => {
				await expect(comments.getByText(pendingBody)).toHaveCount(0);
			});

			await test.step("Verify the author reply is nested with an Author badge", async () => {
				const replies = comments.getByTestId("replies");

				await expect(replies.getByText(replyBody)).toBeVisible();
				await expect(replies.getByTestId("author-badge")).toBeVisible();
			});
		} finally {
			await Promise.all(
				commentIds.map((id) => deleteComment({ id, page, testInfo })),
			);

			if (postId !== null) {
				const id = postId;

				await test.step("Clean up the post", async () => {
					await deleteBlogPost({ id, page, testInfo });
				});
			}
		}
	},
);

test(
	"A post with comments disabled renders no comments section",
	{
		tag: [
			"@scenario:post.comments.disabled",
			"@area:posts",
			"@priority:should",
		],
	},
	async ({ page }, testInfo) => {
		let postId: number | null = null;

		try {
			const slug = uniqueSlug(
				"comments-disabled",
				testInfo.repeatEachIndex,
				testInfo.workerIndex,
			);

			await test.step("Create a published post with comments disabled", async () => {
				({ id: postId } = await createPublishedBlogPost({
					commentsEnabled: false,
					page,
					slug,
					testInfo,
					title: "コメントのない投稿",
				}));
			});

			await test.step("Navigate to the post", async () => {
				await page.goto(`/posts/${slug}`);
			});

			await test.step("Verify the post renders but the comments section does not", async () => {
				await expect(page.getByTestId("page")).toBeVisible();
				await expect(page.getByTestId("comments")).toHaveCount(0);
			});
		} finally {
			if (postId !== null) {
				const id = postId;

				await test.step("Clean up the post", async () => {
					await deleteBlogPost({ id, page, testInfo });
				});
			}
		}
	},
);
