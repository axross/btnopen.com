import { expect, test } from "@playwright/test";

test("has foundational metadata", async ({ page }) => {
	await page.goto("/");

	// verify fundamental metadata
	await expect(page.locator('meta[charset="utf-8"]')).toBeAttached();
	await expect(page.locator('meta[name="viewport"]')).toBeAttached();
	await expect(page.locator('meta[name="referrer"]')).toBeAttached();
	await expect(page.locator('meta[name="robots"]')).toBeAttached();

	// verify description metadata
	await expect(page.locator("title")).toContainText("");
	await expect(page.locator('meta[name="description"]')).toContainText("");
	await expect(page.locator('meta[name="author"]')).toContainText("");
	await expect(page.locator('meta[name="category"]')).toContainText("");
	await expect(page.locator('meta[name="creator"]')).toContainText("");
	await expect(page.locator('meta[name="publisher"]')).toContainText("");

	// verify icon
	await expect(page.locator('link[rel="icon"]')).toBeAttached();
});
