import { expect, test } from "@playwright/test";
import { authenticatedStorageState } from "@/e2e/helpers/api/auth";
import { getExampleBlogPost } from "@/e2e/helpers/api/blog-post";

test.use({ storageState: authenticatedStorageState });

test.beforeEach(async ({ page }, testInfo) => {
	let slug: string;

	await test.step("Retrieve the example blog post record", async () => {
		({ slug } = await getExampleBlogPost({ page, testInfo }));
	});

	await test.step("Navigate to the post route (draft=true)", async () => {
		await page.goto(`/posts/${slug}?draft=true`);
	});

	let ogImageUrl: string;

	await test.step("Retrieve the Open Graph image URL from the meta tag", async () => {
		const ogImageMeta = page.locator('meta[property="og:image"]');

		expect(ogImageMeta).toBeAttached();

		const ogImageContent = await ogImageMeta.getAttribute("content");

		expect(ogImageContent).toContain(slug);
		expect(ogImageContent).toContain("opengraph-image");

		// biome-ignore lint/style/noNonNullAssertion: asserted above
		ogImageUrl = ogImageContent!;
	});

	await test.step("Navigate to the Open Graph image", async () => {
		await page.goto(ogImageUrl);
	});
});

test("Open Graph image", async ({ page }) => {
	await test.step("Verify the Open Graph image", async () => {
		await expect(page).toHaveScreenshot("opengraph-image.png");
	});
});
