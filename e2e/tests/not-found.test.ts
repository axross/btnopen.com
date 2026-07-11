import { expect, test } from "@playwright/test";

const notFoundStatus = 404;

test("Returns 404 status when invalid route is accessed", {
	tag: [
		"@scenario:not-found.status",
		"@area:not-found",
		"@priority:must",
		"@smoke",
	],
}, async ({ page }) => {
	let response: Awaited<ReturnType<typeof page.goto>>;

	await test.step("Navigate to a non-existent route", async () => {
		response = await page.goto("/this-page-does-not-exist");
	});

	await test.step("Verify the response status is 404", async () => {
		expect(response?.status()).toBe(notFoundStatus);
	});
});

test("Not found page UI", {
	tag: ["@scenario:not-found.ui", "@area:not-found", "@priority:should"],
}, async ({ page }) => {
	await test.step("Navigate to a non-existent route", async () => {
		await page.goto("/this-page-does-not-exist");
	});

	await test.step("Verify the header is visible", async () => {
		await expect(page.getByTestId("header")).toBeVisible();
	});

	await test.step("Verify the home link is visible", async () => {
		await expect(
			page.getByTestId("not-found").getByTestId("link"),
		).toBeVisible();
	});
});

test("Reduced-motion disables the status-code glitch animation", {
	tag: [
		"@scenario:not-found.reduced-motion",
		"@area:not-found",
		"@priority:may",
	],
}, async ({ page }) => {
	await test.step("Emulate the reduced-motion preference", async () => {
		await page.emulateMedia({ reducedMotion: "reduce" });
	});

	await test.step("Navigate to a non-existent route", async () => {
		await page.goto("/this-page-does-not-exist");
	});

	await test.step("Verify the glitch pseudo-element animations are disabled", async () => {
		const statusCode = page.getByTestId("not-found").getByTestId("status-code");

		await statusCode.waitFor();

		await expect
			.poll(() =>
				statusCode.evaluate((element) => [
					getComputedStyle(element, "::before").animationName,
					getComputedStyle(element, "::after").animationName,
				]),
			)
			.toEqual(["none", "none"]);
	});
});

test("Home link navigates to the index route", {
	tag: ["@scenario:not-found.home-link", "@area:not-found", "@priority:should"],
}, async ({ page }) => {
	await test.step("Navigate to a non-existent route", async () => {
		await page.goto("/this-page-does-not-exist");
	});

	await test.step("Click the home link", async () => {
		await page.getByTestId("not-found").getByTestId("link").click();
	});

	await test.step("Verify navigated to the index route", async () => {
		await page.waitForURL("/");

		await expect(page).toHaveURL("/");
	});
});
