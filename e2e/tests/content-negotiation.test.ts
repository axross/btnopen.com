import { expect, type Locator, type Page, test } from "@playwright/test";
import { authenticatedStorageState } from "@/e2e/helpers/api/auth";
import { publishedBlogPostSlug } from "@/e2e/helpers/api/blog-post";
import { getSharedMediaAlt, sharedMediaId } from "@/e2e/helpers/api/media";

test.use({ storageState: authenticatedStorageState });

// The body image the seed embeds. `next/image` rewrites the src into
// `/_next/image?url=…`, which percent-encodes the slashes but leaves the media
// id intact, so matching on the id locates the image under both the optimized
// and the unoptimized src.
function getBodyImage(page: Page): Locator {
	return page
		.getByTestId("page")
		.getByTestId("content")
		.locator(`img[src*="${sharedMediaId}"]`);
}

test.describe("English content negotiation", () => {
	test.use({ locale: "en-US" });

	test("serves English chrome and locale metadata to an English browser", {
		tag: [
			"@scenario:localization.english",
			"@area:localization",
			"@priority:should",
		],
	}, async ({ page }) => {
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

	test(
		"renders a body image's English alt text",
		{
			tag: [
				"@scenario:localization.media-alt",
				"@area:localization",
				"@priority:should",
			],
		},
		async ({ page }, testInfo) => {
			let alt: string;

			await test.step("Read the shared media's English alt from the CMS", async () => {
				alt = await getSharedMediaAlt({ locale: "en-US", page, testInfo });
			});

			await test.step("Navigate to the published post route", async () => {
				await page.goto(`/posts/${publishedBlogPostSlug}`);
			});

			await test.step("Verify the body image carries the English alt", async () => {
				await expect(getBodyImage(page)).toHaveAttribute("alt", alt);
			});
		},
	);
});

test.describe("Japanese content negotiation", () => {
	test.use({ locale: "ja-JP" });

	test("serves Japanese chrome and locale metadata to a Japanese browser", {
		tag: [
			"@scenario:localization.japanese",
			"@area:localization",
			"@priority:must",
		],
	}, async ({ page }) => {
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

	test(
		"renders a body image's Japanese alt text",
		{
			tag: [
				"@scenario:localization.media-alt",
				"@area:localization",
				"@priority:should",
			],
		},
		async ({ page }, testInfo) => {
			let alt: string;

			await test.step("Read the shared media's Japanese alt from the CMS", async () => {
				alt = await getSharedMediaAlt({ locale: "ja-JP", page, testInfo });
			});

			await test.step("Navigate to the published post route", async () => {
				await page.goto(`/posts/${publishedBlogPostSlug}`);
			});

			await test.step("Verify the body image carries the Japanese alt", async () => {
				await expect(getBodyImage(page)).toHaveAttribute("alt", alt);
			});
		},
	);
});

test.describe("language switcher", () => {
	test.use({ locale: "en-US" });

	test("persists an explicit locale choice across reloads via cookie", {
		tag: [
			"@scenario:localization.switcher-persists",
			"@area:localization",
			"@priority:should",
		],
	}, async ({ page }) => {
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
