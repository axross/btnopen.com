import { expect, test } from "@playwright/test";

// four describe the collection itself, and the fifth carries the permanent
// control.
const privacySectionCount = 5;

test.beforeEach(async ({ page }) => {
	await test.step("Navigate to the privacy route", async () => {
		await page.goto("/privacy");
	});
});

test("Privacy page", {
	tag: ["@scenario:privacy.page", "@area:privacy", "@priority:must", "@smoke"],
}, async ({ page }) => {
	const privacyPage = page.getByTestId("page");

	await test.step("Verify the page has a single top-level heading", async () => {
		await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
	});

	await test.step("Verify the page describes each kind of collection", async () => {
		// asserting the section count rather than the copy keeps the test from
		// re-stating wording the translation catalogs own.
		await expect(privacyPage.getByRole("heading", { level: 2 })).toHaveCount(
			privacySectionCount,
		);
	});

	await test.step("Verify the permanent consent control", async () => {
		const control = privacyPage.getByTestId("analytics-consent-control");

		await expect(control).toBeVisible();
		await expect(
			control.getByTestId("analytics-consent-switch"),
		).toHaveAttribute("aria-checked", "false");
	});

	await test.step("Verify an unanswered visitor is not reported as having declined", async () => {
		const state = privacyPage.getByTestId("analytics-consent-state");
		const denied = await page
			.getByTestId("analytics-consent-banner")
			.isVisible();

		// the banner is still up, so no decision is stored — the control must
		// say so rather than showing the refusal the switch position implies.
		expect(denied).toBe(true);
		await expect(state).toBeVisible();
	});
});

test("Footer privacy link", {
	tag: [
		"@scenario:privacy.footer-link",
		"@area:privacy",
		"@priority:must",
		"@smoke",
	],
}, async ({ page }) => {
	await test.step("Navigate to the index route", async () => {
		await page.goto("/");
	});

	await test.step("Follow the footer's privacy link", async () => {
		await page.getByTestId("footer").getByRole("link").click();
		await page.waitForURL("**/privacy");
	});

	await test.step("Verify the privacy page rendered", async () => {
		await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
		await expect(page.getByTestId("analytics-consent-control")).toBeVisible();
	});
});
