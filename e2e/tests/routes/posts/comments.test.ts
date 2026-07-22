import { expect, type Locator, test } from "@playwright/test";
import { authenticatedStorageState } from "@/e2e/helpers/api/auth";
import { createPublishedBlogPost } from "@/e2e/helpers/api/blog-post";
import { createComment, deleteComment } from "@/e2e/helpers/api/comment";
import { deleteBlogPost } from "@/e2e/helpers/api/mcp";

test.use({ storageState: authenticatedStorageState });

const forbiddenStatus = 403;
// the fallback badge is sized to the avatar box; a bare glyph is well under this.
const avatarFallbackMinSizePx = 32;
const avatarFallbackSquareTolerancePx = 1;

function uniqueSlug(prefix: string, repeat: number, worker: number): string {
	return `${prefix}-${repeat}-${worker}-${Date.now()}`;
}

// no locator-native matcher exists for a computed `filter`, so read it via
// getComputedStyle (the sanctioned exception, as with pseudo-element state),
// re-sampled through expect.poll at the call sites so it settles.
function computedFilter(locator: Locator): Promise<string> {
	return locator.evaluate((element) => getComputedStyle(element).filter);
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

test(
	"The comment endpoint rejects a write without a CSRF token",
	{
		tag: ["@scenario:post.comments.csrf", "@area:posts", "@priority:should"],
	},
	async ({ page }, testInfo) => {
		// The double-submit CSRF check runs before auth and post lookup, so a
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

// The composer is server-gated on `isClerkAvailable`, so its presence (and thus
// its absence on a draft view) is only observable when Clerk is configured.
// Define this scenario only in that case, mirroring the suite's env-gated
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

// This scenario only holds when Clerk is genuinely unconfigured (local, CI, or
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
