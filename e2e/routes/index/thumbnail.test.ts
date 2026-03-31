import { expect, test } from "@playwright/test";
import { authenticatedStorageState } from "@/e2e/helpers/api/auth";

test.use({ storageState: authenticatedStorageState });

test.beforeEach(async ({ page }) => {
	await test.step("Navigate to the index route (draft=true)", async () => {
		await page.goto("/?draft=true");
	});

	let thumbnailUrl: string;

	await test.step("Retrieve the thumbnail URL from the meta tag", async () => {
		const ogImageMeta = page.locator('meta[property="og:image"]');

		await expect(ogImageMeta).toBeAttached();

		const ogImageContent = await ogImageMeta.getAttribute("content");

		expect(ogImageContent).toEqual(expect.any(String));

		// biome-ignore lint/style/noNonNullAssertion: asserted above
		thumbnailUrl = ogImageContent!;
	});

	await test.step("Navigate to the thumbnail image", async () => {
		await page.goto(thumbnailUrl);
	});
});

test("Thumbnail image", async ({ page }) => {
	await test.step("Verify the thumbnail image", async () => {
		await expect(page).toHaveScreenshot("thumbnail.png");
	});
});
