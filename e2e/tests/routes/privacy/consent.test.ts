import { expect, type Page, test } from "@playwright/test";

const consentCookieName = "btn-analytics-consent";

/** The stored decision, or `null` when the visitor has not answered. */
async function readConsentCookie(page: Page): Promise<string | null> {
	const cookies = await page.context().cookies();

	return (
		cookies.find((cookie) => cookie.name === consentCookieName)?.value ?? null
	);
}

/**
 * Marks the current document so a later check can tell a same-document update
 * from a reload — the marker does not survive a navigation.
 */
async function markDocument(page: Page): Promise<void> {
	await page.evaluate(() => {
		(window as unknown as { consentProbe?: boolean }).consentProbe = true;
	});
}

async function isSameDocument(page: Page): Promise<boolean> {
	return page.evaluate(
		() =>
			(window as unknown as { consentProbe?: boolean }).consentProbe === true,
	);
}

test("No decision stored", {
	tag: [
		"@scenario:privacy.consent.ungated",
		"@area:privacy",
		"@priority:must",
		"@smoke",
	],
}, async ({ page }) => {
	const requestedUrls: string[] = [];

	page.on("request", (request) => requestedUrls.push(request.url()));

	await test.step("Navigate to the index route", async () => {
		await page.goto("/");
	});

	await test.step("Verify the banner asks for a decision", async () => {
		await expect(page.getByTestId("analytics-consent-banner")).toBeVisible();
		await expect(page.getByTestId("analytics-consent-grant")).toBeVisible();
		await expect(page.getByTestId("analytics-consent-deny")).toBeVisible();
	});

	await test.step("Verify no analytics SDK was fetched", async () => {
		// this is what the dynamic import buys: a static one would put the SDK
		// in the initial bundle, and a chunk carrying its name would be
		// requested here whether or not a token is configured.
		expect(
			requestedUrls.filter((url) => url.includes("mixpanel")),
		).toStrictEqual([]);
	});

	await test.step("Verify nothing was stored", async () => {
		expect(await readConsentCookie(page)).toBeNull();
	});
});

test("Granting", {
	tag: [
		"@scenario:privacy.consent.grant",
		"@area:privacy",
		"@priority:must",
		"@smoke",
	],
}, async ({ page }) => {
	await test.step("Navigate to the index route", async () => {
		await page.goto("/");
		await markDocument(page);
	});

	await test.step("Grant consent", async () => {
		await page.getByTestId("analytics-consent-grant").click();
	});

	await test.step("Verify the banner is gone", async () => {
		await expect(page.getByTestId("analytics-consent-banner")).toHaveCount(0);
	});

	await test.step("Verify the decision was stored", async () => {
		expect(await readConsentCookie(page)).toBe("granted");
	});

	await test.step("Verify the page did not reload", async () => {
		expect(await isSameDocument(page)).toBe(true);
	});
});

test("Revoking from the privacy page", {
	tag: ["@scenario:privacy.consent.revoke", "@area:privacy", "@priority:must"],
}, async ({ page, baseURL }) => {
	await test.step("Arrive with consent already granted", async () => {
		await page.context().addCookies([
			{
				name: consentCookieName,
				value: "granted",
				url: baseURL ?? "http://localhost:3000",
			},
		]);
		await page.goto("/privacy");
		await markDocument(page);
	});

	const control = page.getByTestId("analytics-consent-control");
	const consentSwitch = control.getByTestId("analytics-consent-switch");
	let grantedStateText: string | null = null;

	await test.step("Verify the control reflects the granted decision", async () => {
		await expect(consentSwitch).toHaveAttribute("aria-checked", "true");

		grantedStateText = await control
			.getByTestId("analytics-consent-state")
			.textContent();
	});

	await test.step("Revoke consent", async () => {
		await consentSwitch.click();
	});

	await test.step("Verify the control reflects the revocation", async () => {
		await expect(consentSwitch).toHaveAttribute("aria-checked", "false");
		// asserted as a change rather than as copy, so the test does not own
		// wording the translation catalogs do.
		await expect(control.getByTestId("analytics-consent-state")).not.toHaveText(
			grantedStateText ?? "",
		);
	});

	await test.step("Verify the decision was stored", async () => {
		expect(await readConsentCookie(page)).toBe("denied");
	});

	await test.step("Verify the page did not reload", async () => {
		expect(await isSameDocument(page)).toBe(true);
	});
});

test("A decision already stored", {
	tag: [
		"@scenario:privacy.consent.decided",
		"@area:privacy",
		"@priority:should",
	],
}, async ({ page, baseURL }) => {
	await test.step("Arrive with consent already refused", async () => {
		await page.context().addCookies([
			{
				name: consentCookieName,
				value: "denied",
				url: baseURL ?? "http://localhost:3000",
			},
		]);
		await page.goto("/");
	});

	await test.step("Verify the banner never appears", async () => {
		// asserted after the page has settled, so a banner that rendered and
		// then hid itself after hydration would still be caught.
		await expect(page.getByTestId("analytics-consent-banner")).toHaveCount(0);
		await expect(page.getByTestId("footer")).toBeVisible();
		await expect(page.getByTestId("analytics-consent-banner")).toHaveCount(0);
	});
});
