import { expect, test } from "@playwright/test";
import { authenticatedStorageState } from "@/e2e/helpers/api/auth";
import { createPublishedBlogPost } from "@/e2e/helpers/api/blog-post";
import { deleteBlogPost } from "@/e2e/helpers/api/mcp";
import { uniqueSlug } from "@/e2e/helpers/unique-slug";

test.use({ storageState: authenticatedStorageState });

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
					isCommentsEnabled: false,
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

// the composer is server-gated on `isClerkAvailable`, so its presence (and thus
// its absence on a draft view) is only observable when Clerk is configured.
// define this scenario only in that case, mirroring the suite's env-gated
// helpers rather than skipping at runtime.
// biome-ignore lint/style/noProcessEnv: env-driven gate mirroring runtime `isClerkAvailable`
if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
	test(
		"A draft/preview post view renders the comments section without the composer",
		{
			tag: [
				"@scenario:post.comments.draft-no-composer",
				"@area:posts",
				"@priority:should",
			],
		},
		async ({ page }, testInfo) => {
			let postId: number | null = null;

			try {
				const slug = uniqueSlug(
					"comments-draft",
					testInfo.repeatEachIndex,
					testInfo.workerIndex,
				);

				await test.step("Create a published post with comments enabled", async () => {
					({ id: postId } = await createPublishedBlogPost({
						page,
						slug,
						testInfo,
						title: "下書きプレビューの投稿",
					}));
				});

				await test.step("The published view shows the comments section with a composer", async () => {
					await page.goto(`/posts/${slug}`);

					await expect(page.getByTestId("comments")).toBeVisible();
					await expect(page.getByTestId("composer")).toBeVisible();
				});

				await test.step("The draft view shows the comments section but no composer", async () => {
					await page.goto(`/posts/${slug}?draft=true`);

					await expect(page.getByTestId("comments")).toBeVisible();
					await expect(page.getByTestId("composer")).toHaveCount(0);
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
}

// this scenario only holds when Clerk is genuinely unconfigured (local, CI, or
// a preview without Clerk keys); with Clerk on, the same post renders the
// section with a composer and an empty state. Define it only in that case
// rather than skipping at runtime, matching the suite's env-gated helpers.
// biome-ignore lint/style/noProcessEnv: env-driven gate mirroring runtime `isClerkAvailable`
if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
	test(
		"A comments-enabled post with no comments hides the section when Clerk is unavailable",
		{
			tag: [
				"@scenario:post.comments.unavailable-hidden",
				"@area:posts",
				"@priority:should",
			],
		},
		async ({ page }, testInfo) => {
			let postId: number | null = null;

			try {
				const slug = uniqueSlug(
					"comments-no-clerk",
					testInfo.repeatEachIndex,
					testInfo.workerIndex,
				);

				await test.step("Create a published post with comments enabled and no comments", async () => {
					({ id: postId } = await createPublishedBlogPost({
						page,
						slug,
						testInfo,
						title: "コメントのない有効な投稿",
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
}
