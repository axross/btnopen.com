import { expect, test } from "@playwright/test";

const notFoundStatus = 404;

test("Unknown post slug returns 404", async ({ page }) => {
	let response: Awaited<ReturnType<typeof page.goto>>;

	await test.step("Navigate to a non-existent post slug", async () => {
		response = await page.goto("/posts/this-slug-does-not-exist");
	});

	await test.step("Verify the response status is 404", async () => {
		expect(response?.status()).toBe(notFoundStatus);
	});
});
