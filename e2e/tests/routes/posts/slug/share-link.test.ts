import { expect, test } from "@playwright/test";
import { authenticatedStorageState } from "@/e2e/helpers/api/auth";
import {
	bulkUpdateBlogPost,
	createDraftBlogPost,
	createParagraphBlogPostBody,
	getBlogPostShareToken,
	rotateBlogPostShareToken,
	shareLinkPath,
} from "@/e2e/helpers/api/blog-post";
import { deleteBlogPost } from "@/e2e/helpers/api/mcp";
import { openSignedOutContext } from "@/e2e/helpers/signed-out-context";
import { uniqueSlug } from "@/e2e/helpers/unique-slug";

// two visitors per test. The file's own `page` is the AUTHOR: it creates the
// post, reads its secret, and deletes the post afterwards, all through the
// authenticated API. Every reader assertion runs in a separate context with no
// session — the reviewer this feature exists for. Signing the author out
// instead would prove the same thing while leaving cleanup without a session.

test.use({ storageState: authenticatedStorageState });

const okStatus = 200;
const notFoundStatus = 404;
// hoisted because a regex literal rebuilt per call is recompiled per call.
const noindexPattern = /noindex/;
const draftTitle = "共有リンクの下書きタイトル";
const draftBody = "共有リンクの下書き本文。";

test(
	"A signed-out reviewer holding a post's share link reads the draft",
	{
		tag: ["@scenario:post.share-link.valid", "@area:posts", "@priority:must"],
	},
	async ({ browser, page }, testInfo) => {
		let createdId: number | null = null;

		try {
			const slug = uniqueSlug(
				"share-link-valid",
				testInfo.repeatEachIndex,
				testInfo.workerIndex,
			);

			await test.step("Create a draft post", async () => {
				({ id: createdId } = await createDraftBlogPost({
					body: createParagraphBlogPostBody(draftBody),
					page,
					slug,
					testInfo,
					title: draftTitle,
				}));
			});

			const shareToken =
				await test.step("Read the post's share token", async () =>
					await getBlogPostShareToken({ page, slug, testInfo }));

			const reader = await openSignedOutContext({ browser, testInfo });

			try {
				const readerPage = await reader.newPage();

				const shareLinkResponse =
					await test.step("Open the share link signed out", async () =>
						await readerPage.goto(shareLinkPath(slug, shareToken)));

				const postPage = readerPage.getByTestId("page");

				// the header is what keeps the token out of the `Referer` a reviewer's
				// browser sends when they follow a link off the draft. `next.config.ts`
				// sets it and three documents assert the guarantee, so an edit to
				// `headers()` that dropped it would otherwise leave every gate green.
				await test.step("Verify the response carries an explicit Referrer-Policy", async () => {
					expect(shareLinkResponse?.headers()["referrer-policy"]).toBe(
						"strict-origin-when-cross-origin",
					);
				});

				await test.step("Verify the draft's title is rendered", async () => {
					await expect(
						postPage.getByTestId("header").getByTestId("title"),
					).toHaveText(draftTitle);
				});

				await test.step("Verify the draft's body is rendered", async () => {
					await expect(postPage.getByTestId("content")).toContainText(
						draftBody,
					);
				});

				await test.step("Verify the draft render opts out of indexing", async () => {
					await expect(
						readerPage.locator('head meta[name="robots"]'),
					).toHaveAttribute("content", noindexPattern);
				});

				await test.step("Verify the advertised og:image carries the token", async () => {
					await expect(
						readerPage.locator('head meta[property="og:image"]'),
					).toHaveAttribute(
						"content",
						new RegExp(`token=${encodeURIComponent(shareToken)}$`),
					);
				});

				await test.step("Verify the thumbnail renders for the same token", async () => {
					const response = await readerPage.request.get(
						`/posts/${slug}/thumbnail.png?token=${encodeURIComponent(shareToken)}`,
					);

					expect(response.status()).toBe(okStatus);
				});

				await test.step("Verify the thumbnail stays hidden without the token", async () => {
					const response = await readerPage.request.get(
						`/posts/${slug}/thumbnail.png`,
					);

					expect(response.status()).toBe(notFoundStatus);
				});
			} finally {
				await reader.close();
			}
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
	"A signed-out reader without the share token sees the not-found page",
	{
		tag: ["@scenario:post.share-link.absent", "@area:posts", "@priority:must"],
	},
	async ({ browser, page }, testInfo) => {
		let createdId: number | null = null;

		try {
			const slug = uniqueSlug(
				"share-link-absent",
				testInfo.repeatEachIndex,
				testInfo.workerIndex,
			);

			await test.step("Create a draft post", async () => {
				({ id: createdId } = await createDraftBlogPost({
					body: createParagraphBlogPostBody(draftBody),
					page,
					slug,
					testInfo,
					title: draftTitle,
				}));
			});

			const reader = await openSignedOutContext({ browser, testInfo });

			try {
				const readerPage = await reader.newPage();

				await test.step("Ask for the draft with no token at all", async () => {
					await readerPage.goto(`/posts/${slug}?draft=true`);
				});

				await test.step("Verify the not-found page is shown", async () => {
					await expect(readerPage.getByTestId("not-found")).toBeVisible();
				});

				await test.step("Verify no post content is rendered", async () => {
					await expect(readerPage.getByTestId("page")).toHaveCount(0);
				});

				await test.step("Verify an empty token unlocks nothing either", async () => {
					await readerPage.goto(`/posts/${slug}?draft=true&token=`);

					await expect(readerPage.getByTestId("not-found")).toBeVisible();
				});
			} finally {
				await reader.close();
			}
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
	"A share link stops working once the post's token is rotated",
	{
		tag: ["@scenario:post.share-link.rotated", "@area:posts", "@priority:must"],
	},
	async ({ browser, page }, testInfo) => {
		let createdId: number | null = null;

		try {
			const slug = uniqueSlug(
				"share-link-rotated",
				testInfo.repeatEachIndex,
				testInfo.workerIndex,
			);

			await test.step("Create a draft post", async () => {
				({ id: createdId } = await createDraftBlogPost({
					body: createParagraphBlogPostBody(draftBody),
					page,
					slug,
					testInfo,
					title: draftTitle,
				}));
			});

			const shareToken =
				await test.step("Read the post's share token", async () =>
					await getBlogPostShareToken({ page, slug, testInfo }));

			const reader = await openSignedOutContext({ browser, testInfo });

			try {
				const readerPage = await reader.newPage();

				// load the draft under the original token FIRST. Without this the
				// assertion after the rotation would pass even if rotation did nothing,
				// because it would never have been shown to work in the first place.
				await test.step("Confirm the link works before the rotation", async () => {
					await readerPage.goto(shareLinkPath(slug, shareToken));

					await expect(
						readerPage
							.getByTestId("page")
							.getByTestId("header")
							.getByTestId("title"),
					).toHaveText(draftTitle);
				});

				const rotatedToken =
					await test.step("Rotate the post's share token", async () => {
						if (createdId === null) {
							throw new Error("The draft post was not created.");
						}

						return await rotateBlogPostShareToken({
							id: createdId,
							page,
							testInfo,
						});
					});

				expect(rotatedToken).not.toBe(shareToken);

				await test.step("Verify the old link no longer renders the draft", async () => {
					await readerPage.goto(shareLinkPath(slug, shareToken));

					await expect(readerPage.getByTestId("not-found")).toBeVisible();
					await expect(readerPage.getByTestId("page")).toHaveCount(0);
				});

				await test.step("Verify the replacement link renders the draft", async () => {
					await readerPage.goto(shareLinkPath(slug, rotatedToken));

					await expect(
						readerPage
							.getByTestId("page")
							.getByTestId("header")
							.getByTestId("title"),
					).toHaveText(draftTitle);
				});

				// a rotation writes a draft, so the replacement lives in a version row
				// while the collection row keeps the revoked secret. A bulk write is
				// the one path that reads the collection row, so it is the one that
				// could carry the revoked secret forward and undo the revocation —
				// which no other step here would notice.
				await test.step("Bulk-update the post without asking for a draft write", async () => {
					if (createdId === null) {
						throw new Error("The draft post was not created.");
					}

					await bulkUpdateBlogPost({
						data: { _status: "draft", isCommentsEnabled: false },
						id: createdId,
						page,
						testInfo,
					});
				});

				await test.step("Verify the revoked link is still dead after the bulk write", async () => {
					await readerPage.goto(shareLinkPath(slug, shareToken));

					await expect(readerPage.getByTestId("not-found")).toBeVisible();
					await expect(readerPage.getByTestId("page")).toHaveCount(0);
				});

				await test.step("Verify the replacement link still renders the draft", async () => {
					await readerPage.goto(shareLinkPath(slug, rotatedToken));

					await expect(
						readerPage
							.getByTestId("page")
							.getByTestId("header")
							.getByTestId("title"),
					).toHaveText(draftTitle);
				});
			} finally {
				await reader.close();
			}
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
