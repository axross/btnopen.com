import { expect, test } from "@playwright/test";
import { authenticatedStorageState } from "@/e2e/helpers/api/auth";
import { createPublishedBlogPost } from "@/e2e/helpers/api/blog-post";
import { signInAsReader } from "@/e2e/helpers/api/clerk";
import { findCommentsByPost } from "@/e2e/helpers/api/comment";
import { deleteBlogPost } from "@/e2e/helpers/api/mcp";
import { uniqueSlug } from "@/e2e/helpers/unique-slug";

test.use({ storageState: authenticatedStorageState });

const forbiddenStatus = 403;

// the Clerk-authenticated reader tests need Clerk mounted (the publishable key)
// and the +clerk_test reader (TEST_CLERK_READER_EMAIL, no default) to sign in, so
// they are defined only when both are set; without them these scenarios stay
// uncovered rather than failing on missing configuration. The Clerk secret key is
// validated by clerkSetup() in global-setup, not read here — security-
// conventions.md forbids reading CLERK_SECRET_KEY anywhere in the repo.
// biome-ignore-start lint/style/noProcessEnv: env-driven gate mirroring the CI test config
const canRunClerkReaderTests = Boolean(
	process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
		process.env.TEST_CLERK_READER_EMAIL,
);
// biome-ignore-end lint/style/noProcessEnv: env-driven gate mirroring the CI test config

test(
	"The comment endpoint rejects a write without a CSRF token",
	{
		tag: ["@scenario:post.comments.csrf", "@area:posts", "@priority:should"],
	},
	async ({ page }, testInfo) => {
		// the double-submit CSRF check runs before auth and post lookup, so a
		// tokenless write is rejected regardless of slug or Clerk configuration.
		const url = new URL(
			"/posts/any-slug/comments",
			testInfo.project.use.baseURL,
		);

		const response = await page.request.post(`${url}`, {
			headers: { "content-type": "application/json" },
			data: { body: "CSRF テスト" },
		});

		expect(response.status()).toBe(forbiddenStatus);
	},
);

// the reader sign-in and submit journeys additionally need the test reader and
// the Clerk secret key (for the sign-in ticket), so they are gated on the full
// configuration rather than on the publishable key alone.
if (canRunClerkReaderTests) {
	test(
		"A signed-out reader sees the Sign in with GitHub affordance",
		{
			tag: ["@scenario:post.comments.sign-in", "@area:posts", "@priority:may"],
		},
		async ({ page }, testInfo) => {
			let postId: number | null = null;

			try {
				const slug = uniqueSlug(
					"comments-sign-in",
					testInfo.repeatEachIndex,
					testInfo.workerIndex,
				);

				await test.step("Create a published post with comments enabled", async () => {
					({ id: postId } = await createPublishedBlogPost({
						page,
						slug,
						testInfo,
						title: "サインイン導線のある投稿",
					}));
				});

				await test.step("Navigate to the post as a signed-out reader", async () => {
					await page.goto(`/posts/${slug}`);
				});

				await test.step("The composer offers GitHub sign-in and no editable field", async () => {
					const composer = page.getByTestId("composer");

					await expect(composer).toBeVisible();
					await expect(composer.getByTestId("sign-in")).toBeVisible();
					await expect(composer.getByTestId("textarea")).toHaveCount(0);
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

	test(
		"A signed-in reader submits a comment that stays pending until approved",
		{
			tag: ["@scenario:post.comments.submit", "@area:posts", "@priority:may"],
		},
		async ({ page }, testInfo) => {
			const body = "サインインした読者からのコメント本文です。";

			let postId: number | null = null;

			try {
				const slug = uniqueSlug(
					"comments-submit",
					testInfo.repeatEachIndex,
					testInfo.workerIndex,
				);

				await test.step("Create a published post with comments enabled", async () => {
					({ id: postId } = await createPublishedBlogPost({
						page,
						slug,
						testInfo,
						title: "コメント投稿のある投稿",
					}));
				});

				await test.step("Sign in as a reader through Clerk", async () => {
					await signInAsReader({ page });
				});

				await test.step("Submit a comment through the composer", async () => {
					await page.goto(`/posts/${slug}`);

					const composer = page.getByTestId("composer");
					await expect(composer).toBeVisible();

					const textarea = composer.getByTestId("textarea");
					await expect(textarea).toBeVisible();
					await textarea.fill(body);

					await composer.getByTestId("submit").click();
				});

				await test.step("The composer acknowledges the pending submission", async () => {
					await expect(page.getByTestId("submitted")).toBeVisible();
				});

				await test.step("The pending comment is not shown on the public page", async () => {
					await page.reload();

					await expect(
						page.getByTestId("comments").getByText(body),
					).toHaveCount(0);
				});

				await test.step("A pending comment is persisted with the reader's identity", async () => {
					const comments = await findCommentsByPost({
						blogPostId: postId as number,
						page,
						testInfo,
					});

					const submitted = comments.find((comment) => comment.body === body);

					expect(submitted).toBeDefined();
					expect(submitted?.status).toBe("pending");
					expect(submitted?.authorProviderId).toBeTruthy();
				});
			} finally {
				if (postId !== null) {
					const id = postId;

					// deleting the post cascades to its comments (the blog-post
					// beforeDelete hook), removing the pending reader comment with it.
					await test.step("Clean up the post and its comments", async () => {
						await deleteBlogPost({ id, page, testInfo });
					});
				}
			}
		},
	);
}
