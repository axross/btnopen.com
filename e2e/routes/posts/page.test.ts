import { expect, test } from "@playwright/test";

test("Redirect to index page", async ({ page }) => {
	await test.step("Navigate to post list route", async () => {
		await page.goto("/posts");
	});

	await test.step("Verify that it redirects to the index route", async () => {
		await page.waitForURL("/");

		expect(page).toHaveURL("/");
	});
});
