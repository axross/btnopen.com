import { expect, test } from "@playwright/test";
import { authenticatedStorageState } from "@/e2e/helpers/api/auth";
import { createPublishedBlogPost } from "@/e2e/helpers/api/blog-post";
import { deleteBlogPost } from "@/e2e/helpers/api/mcp";
import { uniqueSlug } from "@/e2e/helpers/unique-slug";

test.use({ storageState: authenticatedStorageState });

// the payload the JSON-LD injector must not let through: `</script>` would
// terminate the script element it is serialized into, and everything after it
// would be parsed as markup — the `<img>` would land in the document and its
// `onerror` would run.
const hostileTitle = "</script><img src=x onerror=alert(1)>";

test(
	"A post title carrying a closing script tag cannot break out of the JSON-LD block",
	{
		tag: [
			"@scenario:post.json-ld.escaping",
			"@area:metadata",
			"@priority:must",
		],
	},
	async ({ page }, testInfo) => {
		let postId: number | null = null;
		const dialogMessages: string[] = [];

		// an injected `onerror` would surface as a dialog; nothing on this page
		// opens one legitimately, so any dialog at all is the vulnerability firing.
		page.on("dialog", (dialog) => {
			dialogMessages.push(dialog.message());

			return dialog.dismiss();
		});

		try {
			const slug = uniqueSlug(
				"json-ld-escaping",
				testInfo.repeatEachIndex,
				testInfo.workerIndex,
			);

			await test.step("Create a published post whose title closes a script tag", async () => {
				({ id: postId } = await createPublishedBlogPost({
					page,
					slug,
					testInfo,
					title: hostileTitle,
				}));
			});

			await test.step("Navigate to the post", async () => {
				await page.goto(`/posts/${slug}`);
			});

			await test.step("Verify the post renders normally", async () => {
				await expect(
					page.getByTestId("page").getByTestId("header").getByTestId("title"),
				).toHaveText(hostileTitle);
			});

			await test.step("Verify exactly one JSON-LD block is emitted", async () => {
				await expect(
					page.locator('script[type="application/ld+json"]'),
				).toHaveCount(1);
			});

			await test.step("Verify no element was injected out of the JSON-LD block", async () => {
				// the post body is the seeded placeholder paragraph and the cover image
				// is a `next/image`, so the injected `<img src=x>` is distinguishable by
				// its src alone.
				await expect(page.locator('img[src="x"]')).toHaveCount(0);
				await expect(page.locator("[onerror]")).toHaveCount(0);
			});

			await test.step("Verify the JSON-LD still parses and carries the title verbatim", async () => {
				const content = await page
					.locator('script[type="application/ld+json"]')
					.textContent();

				expect(content).not.toContain("</script>");

				expect(JSON.parse(content ?? "{}")).toEqual(
					expect.objectContaining({
						"@type": "BlogPosting",
						name: hostileTitle,
					}),
				);
			});

			await test.step("Verify no dialog was raised", async () => {
				expect(dialogMessages).toEqual([]);
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
