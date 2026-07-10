import { expect, test } from "@playwright/test";
import { authenticatedStorageState } from "@/e2e/helpers/api/auth";

test.use({ storageState: authenticatedStorageState });

test.describe("English content negotiation", () => {
	test.use({ locale: "en-US" });

	test("serves English chrome and locale metadata to an English browser", async ({
		page,
	}) => {
		await test.step("Navigate to the index route (draft=true)", async () => {
			await page.goto("/?draft=true");
		});

		await test.step("Verify <html lang> reflects English", async () => {
			await expect(page.locator("html")).toHaveAttribute("lang", "en");
		});

		await test.step("Verify og:locale reflects English", async () => {
			await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute(
				"content",
				"en_US",
			);
		});

		await test.step("Verify og:locale:alternate advertises Japanese", async () => {
			await expect(
				page.locator('meta[property="og:locale:alternate"]'),
			).toHaveAttribute("content", "ja_JP");
		});

		await test.step("Verify the Posts section heading is in English", async () => {
			await expect(
				page.getByRole("heading", { level: 2, name: "Posts" }),
			).toBeVisible();
		});

		await test.step("Verify the switcher marks English as the active locale", async () => {
			await page.getByTestId("language-switcher").click();

			await expect(
				page.getByRole("menuitemradio", { name: "English" }),
			).toHaveAttribute("aria-checked", "true");
		});
	});
});

test.describe("Japanese content negotiation", () => {
	test.use({ locale: "ja-JP" });

	test("serves Japanese chrome and locale metadata to a Japanese browser", async ({
		page,
	}) => {
		await test.step("Navigate to the index route (draft=true)", async () => {
			await page.goto("/?draft=true");
		});

		await test.step("Verify <html lang> reflects Japanese", async () => {
			await expect(page.locator("html")).toHaveAttribute("lang", "ja");
		});

		await test.step("Verify og:locale reflects Japanese", async () => {
			await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute(
				"content",
				"ja_JP",
			);
		});

		await test.step("Verify og:locale:alternate advertises English", async () => {
			await expect(
				page.locator('meta[property="og:locale:alternate"]'),
			).toHaveAttribute("content", "en_US");
		});

		await test.step("Verify the Posts section heading is in Japanese", async () => {
			await expect(
				page.getByRole("heading", { level: 2, name: "投稿" }),
			).toBeVisible();
		});
	});
});

test.describe("language switcher", () => {
	test.use({ locale: "en-US" });

	test("persists an explicit locale choice across reloads via cookie", async ({
		page,
	}) => {
		await test.step("Navigate to the index route (draft=true)", async () => {
			await page.goto("/?draft=true");
		});

		await test.step("Verify the negotiated locale starts as English", async () => {
			await expect(page.locator("html")).toHaveAttribute("lang", "en");
		});

		await test.step("Switch to Japanese", async () => {
			await page.getByTestId("language-switcher").click();
			await page.getByRole("menuitemradio", { name: "日本語" }).click();

			await expect(page.locator("html")).toHaveAttribute("lang", "ja");
		});

		await test.step("Verify the choice is stored in the NEXT_LOCALE cookie", async () => {
			const cookies = await page.context().cookies();
			const localeCookie = cookies.find(
				(cookie) => cookie.name === "NEXT_LOCALE",
			);

			expect(localeCookie?.value).toBe("ja-JP");
		});

		await test.step("Verify the choice overrides Accept-Language after a reload", async () => {
			await page.reload();

			await expect(page.locator("html")).toHaveAttribute("lang", "ja");
		});
	});
});
