import { expect, test } from "@playwright/test";
import { authenticatedStorageState } from "@/e2e/helpers/api/auth";
import {
	createDraftBlogPost,
	createPublishedPostWithEmptyDraftOutline,
	exampleBlogPostSlug,
	getExampleBlogPost,
} from "@/e2e/helpers/api/blog-post";
import { deleteBlogPost } from "@/e2e/helpers/api/mcp";

const noindexPattern = /noindex/;

test.use({ storageState: authenticatedStorageState });

test(
	"Outline preview renders the outline as Markdown",
	{
		tag: ["@scenario:post.outline", "@area:posts", "@priority:must", "@smoke"],
	},
	async ({ page }, testInfo) => {
		let blogPost: Awaited<ReturnType<typeof getExampleBlogPost>>;

		await test.step("Retrieve the example blog post record", async () => {
			blogPost = await getExampleBlogPost({ page, testInfo });
		});

		await test.step("Navigate to the outline route (draft=true)", async () => {
			await page.goto(`/posts/${exampleBlogPostSlug}/outline?draft=true`);
		});

		const root = page.getByTestId("page");

		await test.step("Verify the outline heading shows the post title", async () => {
			await expect(root.getByTestId("header").getByTestId("title")).toHaveText(
				blogPost.title,
			);
		});

		const content = root.getByTestId("content");

		await test.step("Verify the outline Markdown is rendered as a bullet list", async () => {
			await expect(
				content.getByRole("listitem").filter({ hasText: "ねらい" }),
			).toBeVisible();
		});

		await test.step("Verify the outline Markdown is rendered as links", async () => {
			await expect(
				content.getByRole("link", { name: "Markdown Guide" }),
			).toHaveAttribute("href", "https://www.markdownguide.org/");
		});
	},
);

test("Outline preview opts out of search indexing", {
	tag: ["@scenario:post.outline.noindex", "@area:metadata", "@priority:should"],
}, async ({ page }) => {
	await test.step("Navigate to the outline route (draft=true)", async () => {
		await page.goto(`/posts/${exampleBlogPostSlug}/outline?draft=true`);
	});

	await test.step("Verify the robots meta disallows indexing", async () => {
		await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
			"content",
			noindexPattern,
		);
	});
});

test(
	"Outline preview shows an empty state when there is no outline",
	{
		tag: ["@scenario:post.outline.empty", "@area:posts", "@priority:should"],
	},
	async ({ page }, testInfo) => {
		let createdId: number | null = null;

		try {
			// the collection soft-deletes (trash: true), so a unique per-run suffix
			// keeps the unique slug free across repeats and re-runs.
			const slug = `outline-empty-${testInfo.repeatEachIndex}-${testInfo.workerIndex}-${Date.now()}`;

			await test.step("Create a draft post with no outline", async () => {
				({ id: createdId } = await createDraftBlogPost({
					page,
					slug,
					testInfo,
					title: "アウトライン未設定の下書き",
				}));
			});

			await test.step("Navigate to the outline route (draft=true)", async () => {
				await page.goto(`/posts/${slug}/outline?draft=true`);
			});

			await test.step("Verify the empty state is shown", async () => {
				await expect(
					page.getByTestId("page").getByTestId("empty"),
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

test(
	"Draft preview falls back to the published outline when the draft has none",
	{
		tag: [
			"@scenario:post.outline.draft-fallback",
			"@area:posts",
			"@priority:should",
		],
	},
	async ({ page }, testInfo) => {
		let createdId: number | null = null;

		try {
			const slug = `outline-fallback-${testInfo.repeatEachIndex}-${testInfo.workerIndex}-${Date.now()}`;

			await test.step("Create a published post whose draft version has no outline", async () => {
				({ id: createdId } = await createPublishedPostWithEmptyDraftOutline({
					page,
					slug,
					testInfo,
					title: "公開済み・下書きにアウトラインなし",
					outline: "- フォールバック項目: 公開版のアウトラインを表示する",
				}));
			});

			await test.step("Navigate to the outline route (draft=true)", async () => {
				await page.goto(`/posts/${slug}/outline?draft=true`);
			});

			await test.step("Verify the published outline is shown via fallback", async () => {
				await expect(
					page
						.getByTestId("page")
						.getByTestId("content")
						.getByRole("listitem")
						.filter({ hasText: "フォールバック項目" }),
				).toBeVisible();
			});
		} finally {
			if (createdId !== null) {
				const id = createdId;

				await test.step("Clean up the post", async () => {
					await deleteBlogPost({ id, page, testInfo });
				});
			}
		}
	},
);

test("Unknown post slug shows the not-found page on the outline route", {
	tag: [
		"@scenario:post.outline.not-found",
		"@area:not-found",
		"@priority:should",
	],
}, async ({ page }) => {
	await test.step("Navigate to a non-existent post's outline route", async () => {
		await page.goto("/posts/this-slug-does-not-exist/outline");
	});

	await test.step("Verify the not-found page is visible", async () => {
		await expect(page.getByTestId("not-found")).toBeVisible();
	});
});
