import { expect, test } from "@playwright/test";
import { authenticatedStorageState } from "@/e2e/helpers/api/auth";
import {
	createDraftBlogPost,
	createParagraphBlogPostBody,
	updateDraftBlogPost,
} from "@/e2e/helpers/api/blog-post";
import { deleteBlogPost } from "@/e2e/helpers/api/mcp";
import { uniqueSlug } from "@/e2e/helpers/unique-slug";

// regression coverage for #204: the draft read used to be served from a
// `"use cache"` entry tagged `blog-post:<slug>`, which no draft or autosave
// write ever invalidates — so an author's edit stayed invisible until the entry
// aged out. Every test here loads the preview surface BEFORE the edit on
// purpose: that first load is what populates the entry, and without it the
// assertions after the edit would pass even with the bug present.

test.use({ storageState: authenticatedStorageState });

test(
	"A draft edit shows on the next load of the post's preview URL",
	{
		tag: ["@scenario:post.draft.freshness", "@area:posts", "@priority:must"],
	},
	async ({ page }, testInfo) => {
		let createdId: number | null = null;

		try {
			const slug = uniqueSlug(
				"draft-freshness",
				testInfo.repeatEachIndex,
				testInfo.workerIndex,
			);

			await test.step("Create a draft post", async () => {
				({ id: createdId } = await createDraftBlogPost({
					page,
					slug,
					testInfo,
					title: "編集前のタイトル",
					body: createParagraphBlogPostBody("編集前の本文。"),
				}));
			});

			await test.step("Load the preview URL before the edit", async () => {
				await page.goto(`/posts/${slug}?preview=true&draft=true`);

				await expect(
					page.getByTestId("page").getByTestId("header").getByTestId("title"),
				).toHaveText("編集前のタイトル");
			});

			await test.step("Write a new title and body to the draft", async () => {
				if (createdId === null) {
					throw new Error("The draft post was not created.");
				}

				await updateDraftBlogPost({
					body: createParagraphBlogPostBody("編集後の本文。"),
					id: createdId,
					page,
					testInfo,
					title: "編集後のタイトル",
				});
			});

			await test.step("Reload the preview URL", async () => {
				await page.goto(`/posts/${slug}?preview=true&draft=true`);
			});

			const postPage = page.getByTestId("page");

			await test.step("Verify the new title is rendered", async () => {
				await expect(
					postPage.getByTestId("header").getByTestId("title"),
				).toHaveText("編集後のタイトル");
			});

			await test.step("Verify the new body is rendered", async () => {
				await expect(postPage.getByTestId("content")).toContainText(
					"編集後の本文。",
				);
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

test(
	"A draft edit to the authoring fields shows on the next load of the agentic view",
	{
		tag: [
			"@scenario:post.agentic.draft-freshness",
			"@area:posts",
			"@priority:should",
		],
	},
	async ({ page }, testInfo) => {
		let createdId: number | null = null;

		try {
			const slug = uniqueSlug(
				"agentic-freshness",
				testInfo.repeatEachIndex,
				testInfo.workerIndex,
			);

			await test.step("Create a draft post carrying authoring fields", async () => {
				({ id: createdId } = await createDraftBlogPost({
					authoringNotes: "- 編集前のノート項目",
					outline: "- 編集前のアウトライン項目",
					page,
					slug,
					testInfo,
					title: "オーサリング情報つきの下書き",
				}));
			});

			await test.step("Load the agentic view before the edit", async () => {
				await page.goto(`/posts/${slug}?agentic=true&draft=true`);

				await expect(
					page
						.getByTestId("page")
						.getByTestId("content")
						.getByTestId("outline")
						.getByRole("listitem")
						.filter({ hasText: "編集前のアウトライン項目" }),
				).toBeVisible();
			});

			await test.step("Write new authoring fields to the draft", async () => {
				if (createdId === null) {
					throw new Error("The draft post was not created.");
				}

				await updateDraftBlogPost({
					authoringNotes: "- 編集後のノート項目",
					id: createdId,
					outline: "- 編集後のアウトライン項目",
					page,
					testInfo,
				});
			});

			await test.step("Reload the agentic view", async () => {
				await page.goto(`/posts/${slug}?agentic=true&draft=true`);
			});

			const content = page.getByTestId("page").getByTestId("content");

			await test.step("Verify the new outline is rendered", async () => {
				await expect(
					content
						.getByTestId("outline")
						.getByRole("listitem")
						.filter({ hasText: "編集後のアウトライン項目" }),
				).toBeVisible();
			});

			await test.step("Verify the new authoring notes are rendered", async () => {
				await expect(
					content
						.getByTestId("authoring-notes")
						.getByRole("listitem")
						.filter({ hasText: "編集後のノート項目" }),
				).toBeVisible();
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
