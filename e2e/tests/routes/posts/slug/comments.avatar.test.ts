import { expect, type Locator, test } from "@playwright/test";
import { authenticatedStorageState } from "@/e2e/helpers/api/auth";
import { createPublishedBlogPost } from "@/e2e/helpers/api/blog-post";
import { createComment, deleteComment } from "@/e2e/helpers/api/comment";
import { deleteBlogPost } from "@/e2e/helpers/api/mcp";
import { uniqueSlug } from "@/e2e/helpers/unique-slug";

test.use({ storageState: authenticatedStorageState });

// the fallback badge is sized to the avatar box; a bare glyph is well under this.
const avatarFallbackMinSizePx = 32;
const avatarFallbackSquareTolerancePx = 1;

// no locator-native matcher exists for a computed `filter`, so read it via
// getComputedStyle (the sanctioned exception, as with pseudo-element state),
// re-sampled through expect.poll at the call sites so it settles.
function computedFilter(locator: Locator): Promise<string> {
	return locator.evaluate((element) => getComputedStyle(element).filter);
}

test(
	"A reader comment's avatar is tinted to the brand hue while the author's stays true-colour",
	{
		tag: [
			"@scenario:post.comments.avatar-tint",
			"@area:posts",
			"@priority:should",
		],
	},
	async ({ page }, testInfo) => {
		const readerBody = "テーマ色に着色されるアバターのコメントです。";
		const replyBody = "著者アバターは元の色のままです。";
		// a seeded local fixture (see public/images/comment-avatars) so the reader
		// avatar renders as an <img> and exercises the brand-hue tint recipe.
		const readerAvatarUrl = "/images/comment-avatars/minato.webp";

		let postId: number | null = null;
		const commentIds: number[] = [];

		try {
			const slug = uniqueSlug(
				"comments-avatar-tint",
				testInfo.repeatEachIndex,
				testInfo.workerIndex,
			);

			await test.step("Create a published post with comments enabled", async () => {
				({ id: postId } = await createPublishedBlogPost({
					page,
					slug,
					testInfo,
					title: "アバターのある投稿",
				}));
			});

			await test.step("Seed a reader comment with an avatar and an author reply", async () => {
				const blogPostId = postId as number;

				const readerId = await createComment({
					page,
					testInfo,
					blogPostId,
					body: readerBody,
					status: "approved",
					authorName: "みなと",
					authorGithubUsername: "minato",
					authorAvatarUrl: readerAvatarUrl,
				});
				commentIds.push(readerId);

				commentIds.push(
					await createComment({
						page,
						testInfo,
						blogPostId,
						body: replyBody,
						status: "approved",
						authorReply: true,
						parentId: readerId,
					}),
				);
			});

			await test.step("Navigate to the post", async () => {
				await page.goto(`/posts/${slug}`);
			});

			const comments = page.getByTestId("comments");
			await expect(comments).toBeVisible();

			// the first top-level (non-author) comment is the reader with a photo.
			const readerAvatar = comments
				.getByTestId("comment")
				.first()
				.getByTestId("avatar");

			// captured in light theme, re-checked after switching to dark.
			let lightFilter = "";

			await test.step("The reader avatar carries the brand-hue tint filter", async () => {
				await expect(readerAvatar).toBeVisible();

				// poll until the container-query-driven filter settles on the tint.
				await expect
					.poll(() => computedFilter(readerAvatar))
					.toContain("sepia");

				lightFilter = await computedFilter(readerAvatar);
				expect(lightFilter).not.toBe("none");
			});

			await test.step("The author reply avatar stays true-colour (unfiltered)", async () => {
				const authorAvatar = comments
					.getByTestId("replies")
					.getByTestId("avatar");

				await expect(authorAvatar).toBeVisible();
				await expect.poll(() => computedFilter(authorAvatar)).toBe("none");
			});

			await test.step("The reader avatar stays tinted in dark theme", async () => {
				await page.emulateMedia({ colorScheme: "dark" });

				// the dark scheme applies its own saturation/brightness compensation, so
				// re-sample until the filter differs from light — proving the
				// theme-driven container query re-evaluated rather than the tint being
				// theme-agnostic — then confirm it is still a (dark) sepia grade.
				await expect
					.poll(() => computedFilter(readerAvatar))
					.not.toBe(lightFilter);

				const darkFilter = await computedFilter(readerAvatar);
				expect(darkFilter).not.toBe("none");
				expect(darkFilter).toContain("sepia");

				await page.emulateMedia({ colorScheme: "light" });
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
	"A reader comment without an avatar shows a sized, circular letter badge",
	{
		tag: [
			"@scenario:post.comments.avatar-fallback",
			"@area:posts",
			"@priority:should",
		],
	},
	async ({ page }, testInfo) => {
		let postId: number | null = null;
		const commentIds: number[] = [];

		try {
			const slug = uniqueSlug(
				"comments-avatar-fallback",
				testInfo.repeatEachIndex,
				testInfo.workerIndex,
			);

			await test.step("Create a published post with comments enabled", async () => {
				({ id: postId } = await createPublishedBlogPost({
					page,
					slug,
					testInfo,
					title: "アバターのないコメントの投稿",
				}));
			});

			await test.step("Seed a reader comment with no avatar image", async () => {
				commentIds.push(
					await createComment({
						page,
						testInfo,
						blogPostId: postId as number,
						body: "アバター画像のないコメントです。",
						status: "approved",
						authorName: "遥",
					}),
				);
			});

			await test.step("Navigate to the post", async () => {
				await page.goto(`/posts/${slug}`);
			});

			await test.step("The letter badge renders as a sized, rounded circle", async () => {
				const fallback = page
					.getByTestId("comments")
					.getByTestId("avatar-fallback");

				await expect(fallback).toBeVisible();

				const box = await fallback.boundingBox();

				if (box === null) {
					throw new Error("The avatar fallback has no bounding box.");
				}

				// sized to the avatar box and square, not collapsed to the bare glyph.
				expect(box.width).toBeGreaterThanOrEqual(avatarFallbackMinSizePx);
				expect(Math.abs(box.width - box.height)).toBeLessThanOrEqual(
					avatarFallbackSquareTolerancePx,
				);

				// poll the computed border-radius (no locator-native matcher for it).
				await expect
					.poll(() =>
						fallback.evaluate(
							(element) => getComputedStyle(element).borderRadius,
						),
					)
					.not.toBe("0px");
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
