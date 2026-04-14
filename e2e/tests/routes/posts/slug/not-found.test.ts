import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
	await test.step("Navigate to a non-existent post slug", async () => {
		await page.goto("/posts/this-slug-does-not-exist");
	});
});

test("Unknown post slug shows not found page", async ({ page }) => {
	await test.step("Verify the not found page is visible", async () => {
		await expect(page.getByTestId("not-found")).toBeVisible();
	});
});

test("Blog post not found page UI", async ({ page }) => {
	const notFound = page.getByTestId("not-found");

	await test.step("Verify the not found page is visible", async () => {
		await expect(notFound).toBeVisible();
	});

	await test.step("Verify the heading is visible", async () => {
		await expect(notFound.locator("h1")).toBeVisible();
	});

	await test.step("Verify the home link is visible", async () => {
		await expect(notFound.getByTestId("link")).toBeVisible();
	});
});

test("Home link on blog post not found navigates to index", async ({
	page,
}) => {
	await test.step("Click the home link", async () => {
		await page.getByTestId("not-found").getByTestId("link").click();
	});

	await test.step("Verify navigated to the index route", async () => {
		await page.waitForURL("/");

		await expect(page).toHaveURL("/");
	});
});
