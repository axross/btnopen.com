import { expect, test } from "@playwright/test";

test("Redirect to index page", {
	tag: ["@scenario:posts.redirect", "@area:posts", "@priority:should"],
}, async ({ page }) => {
	await test.step("Navigate to post list route", async () => {
		await page.goto("/posts");
	});

	await test.step("Verify that it redirects to the index route", async () => {
		await page.waitForURL("/");

		await expect(page).toHaveURL("/");
	});
});
