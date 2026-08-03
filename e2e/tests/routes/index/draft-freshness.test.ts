import { expect, test } from "@playwright/test";
import { authenticatedStorageState } from "@/e2e/helpers/api/auth";
import {
	createDraftBlogPost,
	updateDraftBlogPost,
} from "@/e2e/helpers/api/blog-post";
import { deleteBlogPost } from "@/e2e/helpers/api/mcp";
import { uniqueSlug } from "@/e2e/helpers/unique-slug";

// the index's draft list had the same defect as the post routes (#204), under
// the `blog-posts` tag. As in the post-route counterpart, the load before the
// edit is what populates the cache entry the assertion afterwards depends on.

test.use({ storageState: authenticatedStorageState });

test(
	"A draft edit shows on the next load of the index's draft list",
	{
		tag: ["@scenario:index.draft.freshness", "@area:index", "@priority:should"],
	},
	async ({ page }, testInfo) => {
		let createdId: number | null = null;

		try {
			const slug = uniqueSlug(
				"index-draft-freshness",
				testInfo.repeatEachIndex,
				testInfo.workerIndex,
			);

			await test.step("Create a draft post", async () => {
				({ id: createdId } = await createDraftBlogPost({
					page,
					slug,
					testInfo,
					title: "一覧・編集前のタイトル",
				}));
			});

			const blogPosts = page.getByTestId("page").getByTestId("blog-posts");

			await test.step("Load the index's draft list before the edit", async () => {
				await page.goto("/?draft=true");

				await expect(
					blogPosts
						.getByTestId("blog-post")
						.filter({ hasText: "一覧・編集前のタイトル" }),
				).toBeVisible();
			});

			await test.step("Write a new title to the draft", async () => {
				if (createdId === null) {
					throw new Error("The draft post was not created.");
				}

				await updateDraftBlogPost({
					id: createdId,
					page,
					testInfo,
					title: "一覧・編集後のタイトル",
				});
			});

			await test.step("Reload the index's draft list", async () => {
				await page.goto("/?draft=true");
			});

			await test.step("Verify the new title is listed", async () => {
				await expect(
					blogPosts
						.getByTestId("blog-post")
						.filter({ hasText: "一覧・編集後のタイトル" }),
				).toBeVisible();
			});

			await test.step("Verify the old title is gone", async () => {
				await expect(
					blogPosts
						.getByTestId("blog-post")
						.filter({ hasText: "一覧・編集前のタイトル" }),
				).toHaveCount(0);
			});
		} finally {
			if (createdId !== null) {
				const id = createdId;

				await test.step("Clean up the draft post", async () => {
					await deleteBlogPost({ id, page, testInfo });
				});
			}
		}
	},
);
