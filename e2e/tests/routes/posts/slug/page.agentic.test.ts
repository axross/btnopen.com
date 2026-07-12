import { expect, test } from "@playwright/test";
import { authenticatedStorageState } from "@/e2e/helpers/api/auth";
import {
	createDraftBlogPost,
	createPublishedPostWithEmptyDraftAgentic,
	exampleBlogPostSlug,
	getExampleBlogPost,
} from "@/e2e/helpers/api/blog-post";
import { deleteBlogPost } from "@/e2e/helpers/api/mcp";

const noindexPattern = /noindex/;

test.use({ storageState: authenticatedStorageState });

test(
	"Agentic view renders the summary, outline, and status",
	{
		tag: ["@scenario:post.agentic", "@area:posts", "@priority:must", "@smoke"],
	},
	async ({ page }, testInfo) => {
		let blogPost: Awaited<ReturnType<typeof getExampleBlogPost>>;

		await test.step("Retrieve the example blog post record", async () => {
			blogPost = await getExampleBlogPost({ page, testInfo });
		});

		await test.step("Navigate to the agentic view (agentic=true&draft=true)", async () => {
			await page.goto(`/posts/${exampleBlogPostSlug}?agentic=true&draft=true`);
		});

		const root = page.getByTestId("page");

		await test.step("Verify the header shows the post title", async () => {
			await expect(root.getByTestId("header").getByTestId("title")).toHaveText(
				blogPost.title,
			);
		});

		const content = root.getByTestId("content");

		await test.step("Verify the summary text is rendered", async () => {
			await expect(content.getByTestId("summary")).toContainText("Markdown");
		});

		await test.step("Verify the outline Markdown is rendered as a bullet list", async () => {
			await expect(
				content
					.getByTestId("outline")
					.getByRole("listitem")
					.filter({ hasText: "ねらい" }),
			).toBeVisible();
		});

		await test.step("Verify the outline Markdown is rendered as links", async () => {
			await expect(
				content.getByTestId("outline").getByRole("link", {
					name: "Markdown Guide",
				}),
			).toHaveAttribute("href", "https://www.markdownguide.org/");
		});

		await test.step("Verify the agenticStatus JSON is rendered", async () => {
			await expect(content.getByTestId("status")).toContainText('"phase"');
		});
	},
);

test("Agentic view opts out of search indexing", {
	tag: ["@scenario:post.agentic.noindex", "@area:metadata", "@priority:should"],
}, async ({ page }) => {
	await test.step("Navigate to the agentic view (agentic=true&draft=true)", async () => {
		await page.goto(`/posts/${exampleBlogPostSlug}?agentic=true&draft=true`);
	});

	await test.step("Verify the robots meta disallows indexing", async () => {
		await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
			"content",
			noindexPattern,
		);
	});
});

test(
	"Agentic view shows an empty state when there is no authoring content",
	{
		tag: ["@scenario:post.agentic.empty", "@area:posts", "@priority:should"],
	},
	async ({ page }, testInfo) => {
		let createdId: number | null = null;

		try {
			// the collection soft-deletes (trash: true), so a unique per-run suffix
			// keeps the unique slug free across repeats and re-runs.
			const slug = `agentic-empty-${testInfo.repeatEachIndex}-${testInfo.workerIndex}-${Date.now()}`;

			await test.step("Create a draft post with no authoring fields", async () => {
				({ id: createdId } = await createDraftBlogPost({
					page,
					slug,
					testInfo,
					title: "オーサリング情報なしの下書き",
				}));
			});

			await test.step("Navigate to the agentic view (agentic=true&draft=true)", async () => {
				await page.goto(`/posts/${slug}?agentic=true&draft=true`);
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
	"Draft agentic view falls back to the published values when the draft has none",
	{
		tag: [
			"@scenario:post.agentic.draft-fallback",
			"@area:posts",
			"@priority:should",
		],
	},
	async ({ page }, testInfo) => {
		let createdId: number | null = null;

		try {
			const slug = `agentic-fallback-${testInfo.repeatEachIndex}-${testInfo.workerIndex}-${Date.now()}`;

			await test.step("Create a published post whose draft version has no authoring fields", async () => {
				({ id: createdId } = await createPublishedPostWithEmptyDraftAgentic({
					page,
					slug,
					testInfo,
					title: "公開済み・下書きにオーサリング情報なし",
					summary: "フォールバックのサマリー: 公開版の情報を表示する。",
					outline: "- フォールバック項目: 公開版のアウトラインを表示する",
					agenticStatus: { phase: "fallback" },
				}));
			});

			await test.step("Navigate to the agentic view (agentic=true&draft=true)", async () => {
				await page.goto(`/posts/${slug}?agentic=true&draft=true`);
			});

			const content = page.getByTestId("page").getByTestId("content");

			await test.step("Verify the published summary is shown via fallback", async () => {
				await expect(content.getByTestId("summary")).toContainText(
					"フォールバックのサマリー",
				);
			});

			await test.step("Verify the published outline is shown via fallback", async () => {
				await expect(
					content
						.getByTestId("outline")
						.getByRole("listitem")
						.filter({ hasText: "フォールバック項目" }),
				).toBeVisible();
			});

			await test.step("Verify the published status is shown via fallback", async () => {
				await expect(content.getByTestId("status")).toContainText('"fallback"');
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

test("Unknown post slug shows the not-found page on the agentic view", {
	tag: [
		"@scenario:post.agentic.not-found",
		"@area:not-found",
		"@priority:should",
	],
}, async ({ page }) => {
	await test.step("Navigate to a non-existent post's agentic view", async () => {
		await page.goto("/posts/this-slug-does-not-exist?agentic=true");
	});

	await test.step("Verify the not-found page is visible", async () => {
		await expect(page.getByTestId("not-found")).toBeVisible();
	});
});
