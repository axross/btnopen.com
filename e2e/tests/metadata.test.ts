import { expect, test } from "@playwright/test";
import { authenticatedStorageState } from "@/e2e/helpers/api/auth";
import { getWebsite } from "@/e2e/helpers/api/website";

test.use({ storageState: authenticatedStorageState });

test("Foundational metadata", async ({ page }, testInfo) => {
	await test.step("Navigate to the index route", async () => {
		await page.goto("/");
	});

	await test.step("Verify fundamental metadata tags are present", async () => {
		await expect(page.locator('meta[charset="utf-8"]')).toBeAttached();
		await expect(page.locator('meta[name="viewport"]')).toBeAttached();
		await expect(page.locator('meta[name="referrer"]')).toBeAttached();
		await expect(page.locator('meta[name="robots"]')).toBeAttached();
	});

	let website: Awaited<ReturnType<typeof getWebsite>>;

	await test.step("Retrieve the website record", async () => {
		website = await getWebsite({ page, testInfo });
	});

	await test.step("Verify the title contains the website name", async () => {
		const title = await page.title();

		expect(title).toContain(website.name);
	});

	await test.step("Verify the description metadata", async () => {
		await expect(page.locator('meta[name="description"]')).toHaveAttribute(
			"content",
			website.description,
		);
	});

	await test.step("Verify the author metadata", async () => {
		await expect(page.locator('meta[name="author"]')).toHaveAttribute(
			"content",
			website.creator.name,
		);
	});

	await test.step("Verify the category metadata", async () => {
		await expect(page.locator('meta[name="category"]')).toHaveAttribute(
			"content",
			"technology",
		);
	});

	await test.step("Verify the creator metadata", async () => {
		await expect(page.locator('meta[name="creator"]')).toHaveAttribute(
			"content",
			website.creator.name,
		);
	});

	await test.step("Verify the publisher metadata", async () => {
		await expect(page.locator('meta[name="publisher"]')).toHaveAttribute(
			"content",
			website.creator.name,
		);
	});

	await test.step("Verify the icon link is present", async () => {
		await expect(page.locator('link[rel="icon"]')).toBeAttached();
	});
});
