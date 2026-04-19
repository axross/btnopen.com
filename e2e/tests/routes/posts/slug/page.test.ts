import { expect, type Locator, test } from "@playwright/test";
import { format } from "date-fns";
import { authenticatedStorageState } from "@/e2e/helpers/api/auth";
import { getExampleBlogPost } from "@/e2e/helpers/api/blog-post";
import { getWebsite } from "@/e2e/helpers/api/website";

test.use({ storageState: authenticatedStorageState });

test.beforeEach(async ({ page }, testInfo) => {
	let slug: string;

	await test.step("Retrieve the example blog post record", async () => {
		({ slug } = await getExampleBlogPost({ page, testInfo }));
	});

	await test.step("Navigate to the post route (draft=true)", async () => {
		await page.goto(`/posts/${slug}?draft=true`);
	});
});

test("Blog post header", async ({ page }, testInfo) => {
	let blogPost: Awaited<ReturnType<typeof getExampleBlogPost>>;

	await test.step("Retrieve the example blog post record", async () => {
		blogPost = await getExampleBlogPost({ page, testInfo });
	});

	const header = page.getByTestId("page").getByTestId("header");

	await test.step("Verify the blog post title", async () => {
		await expect(header.getByTestId("title")).toHaveText(blogPost.title);
	});

	await test.step("Verify the blog post timestamp", async () => {
		await expect(header.getByTestId("timestamp")).toHaveText(
			format(blogPost.publishedAt ?? "", "PPP"),
		);
	});

	await test.step("Verify the blog post cover image", async () => {
		await expect(header.getByTestId("cover-image")).toHaveScreenshot(
			"cover-image.png",
		);
	});

	await test.step("Verify the blog post author", async () => {
		await expect(header.getByTestId("author")).toHaveText(blogPost.author.name);
	});

	await test.step("Verify the blog post tags", async () => {
		const tags = header.getByTestId("tags");
		const firstTag = tags.getByTestId("tag").first();

		await expect(firstTag).toHaveText(blogPost.tags[0].name);
	});
});

test("Blog post content", async ({ page }) => {
	const content = page.getByTestId("page").getByTestId("content");

	await test.step("Hide Next.js DevTools indicator", async () => {
		const indicator = page.locator("#devtools-indicator");

		let isIndicatorVisible = false;

		await test.step("Check whether the DevTools indicator exists", async () => {
			isIndicatorVisible = await indicator.isVisible();
		});

		if (isIndicatorVisible) {
			await test.step("Open the DevTools menu", async () => {
				const button = indicator.locator(
					'button[data-nextjs-dev-tools-button="true"]',
				);

				await button.click();
			});

			await test.step("Open the DevTools preferences", async () => {
				const menu = page.locator("#nextjs-dev-tools-menu");

				await menu.waitFor();

				const preferencesButton = menu.getByText("Preferences");

				await preferencesButton.click();
			});

			await test.step("Click the Hide DevTools button", async () => {
				const button = page.locator(
					'button[aria-describedby="hide-dev-tools"]',
				);

				await button.waitFor();

				await button.click();
			});

			await test.step("Verify the DevTools indicator is hidden", async () => {
				await expect(indicator).not.toBeVisible();
			});
		}
	});

	await test.step("Verify the blog post content", async () => {
		await expect(content).toHaveScreenshot("content.png");
	});
});

// seed post (`payload/helpers/seed/blog-post.md`) emits seven GFM tables under
// `# Tables`, in this authored order: `Compact reference`, `Wide comparison`,
// `Column alignment`, `Inline content`, `Header-only table`, `Single column`,
// `Sparse cells`. On the Pixel 7 viewport (~412px wide) the `Wide comparison`
// and `Inline content` tables overflow, while `Single column` sits well within
// the reading column.
const wideTableIndex = 1;
const narrowTableIndex = 5;

// opacity tolerances for the scroll-driven edge fades. The animation snaps to
// the keyframe endpoints once the scroll timeline is at the ends, so small
// tolerances guard against subpixel rounding without masking a regression to
// the old always-on or static-mask behavior.
const fadeInvisibleMax = 0.05;
const fadeVisibleMin = 0.95;

// keyboard scroll nudges per ArrowRight press are implementation-defined by the
// browser; 20 presses is comfortably above the single-press step on Chromium
// mobile and tolerant of future changes to that step size.
const keyboardScrollPressCount = 20;

test("Narrow table fits the reading column", async ({ page }) => {
	const tables = page
		.getByTestId("page")
		.getByTestId("content")
		.getByTestId("table");

	const scrollArea = tables
		.nth(narrowTableIndex)
		.getByTestId("table-scroll-area");

	await test.step("Verify the scroll area has no horizontal overflow", async () => {
		await expect
			.poll(async () =>
				scrollArea.evaluate(
					(element) => element.scrollWidth === element.clientWidth,
				),
			)
			.toBe(true);
	});
});

test("Wide table overflows and scrolls horizontally", async ({ page }) => {
	const tables = page
		.getByTestId("page")
		.getByTestId("content")
		.getByTestId("table");

	const wrapper = tables.nth(wideTableIndex);
	const scrollArea = wrapper.getByTestId("table-scroll-area");

	await test.step("Verify the scroll area has horizontal overflow", async () => {
		await expect
			.poll(async () =>
				scrollArea.evaluate(
					(element) => element.scrollWidth > element.clientWidth,
				),
			)
			.toBe(true);
	});

	await test.step("Verify the outer wrapper is not a scroll container", async () => {
		await expect
			.poll(async () =>
				wrapper.evaluate(
					(element) => element.scrollWidth === element.clientWidth,
				),
			)
			.toBe(true);
	});

	await test.step("Verify the scroll area is keyboard-focusable", async () => {
		await expect(scrollArea).toHaveAttribute("tabindex", "0");
	});
});

test("Wide table is keyboard-scrollable", async ({ page }) => {
	const tables = page
		.getByTestId("page")
		.getByTestId("content")
		.getByTestId("table");

	const scrollArea = tables
		.nth(wideTableIndex)
		.getByTestId("table-scroll-area");

	await test.step("Focus the scroll area", async () => {
		await scrollArea.focus();
	});

	await test.step("Verify the scroll area is the active element", async () => {
		await expect
			.poll(async () =>
				scrollArea.evaluate((element) => element === document.activeElement),
			)
			.toBe(true);
	});

	await test.step("Verify ArrowRight presses scroll the area horizontally", async () => {
		const initialScrollLeft = await scrollArea.evaluate(
			(element) => element.scrollLeft,
		);

		expect(initialScrollLeft).toBe(0);

		// sequential keypresses intentional: each press must be dispatched in
		// order to accumulate scrollLeft; Promise.all would race and Chromium
		// coalesces duplicate-frame keydowns when dispatched concurrently.
		for (let i = 0; i < keyboardScrollPressCount; i += 1) {
			// biome-ignore lint/performance/noAwaitInLoops: sequential keyboard input is required to accumulate scrollLeft
			await page.keyboard.press("ArrowRight");
		}

		await expect
			.poll(async () => scrollArea.evaluate((element) => element.scrollLeft))
			.toBeGreaterThan(0);
	});
});

test("Edge fades track scroll position", async ({ page }) => {
	const tables = page
		.getByTestId("page")
		.getByTestId("content")
		.getByTestId("table");

	// the fades are pseudo-elements on `.tableWrapper`, so read computed opacity
	// of `::before` / `::after` on the OUTER wrapper element.
	const wrapper = tables.nth(wideTableIndex);
	const scrollArea = wrapper.getByTestId("table-scroll-area");

	const readPseudoOpacity = (pseudo: "::before" | "::after") =>
		wrapper.evaluate(
			(element, selector) =>
				Number.parseFloat(getComputedStyle(element, selector).opacity),
			pseudo,
		);

	await test.step("Verify leading-edge fade is invisible at scroll position 0", async () => {
		await expect
			.poll(() => readPseudoOpacity("::before"))
			.toBeLessThan(fadeInvisibleMax);
	});

	await test.step("Verify trailing-edge fade is visible at scroll position 0", async () => {
		await expect
			.poll(() => readPseudoOpacity("::after"))
			.toBeGreaterThan(fadeVisibleMin);
	});

	await test.step("Scroll the area to its far-right edge", async () => {
		await scrollArea.evaluate((element) => {
			element.scrollTo({ left: element.scrollWidth, behavior: "instant" });
		});

		// the scroll-driven animation resolves on the next frame; `expect.poll`
		// re-samples the computed pseudo-element opacity until Chromium settles,
		// which avoids the fixed `page.waitForTimeout` anti-pattern.
		await expect
			.poll(() => readPseudoOpacity("::after"))
			.toBeLessThan(fadeInvisibleMax);
	});

	await test.step("Verify leading-edge fade is visible at far-right scroll position", async () => {
		await expect
			.poll(() => readPseudoOpacity("::before"))
			.toBeGreaterThan(fadeVisibleMin);
	});

	await test.step("Verify trailing-edge fade is invisible at far-right scroll position", async () => {
		await expect
			.poll(() => readPseudoOpacity("::after"))
			.toBeLessThan(fadeInvisibleMax);
	});
});

test("JSON-LD metadata", async ({ page }, testInfo) => {
	let website: Awaited<ReturnType<typeof getWebsite>>;

	await test.step("Retrieve the website record", async () => {
		website = await getWebsite({ page, testInfo });
	});

	let blogPost: Awaited<ReturnType<typeof getExampleBlogPost>>;

	await test.step("Retrieve the example blog post record", async () => {
		blogPost = await getExampleBlogPost({ page, testInfo });
	});

	let ldJson: Locator;

	await test.step("Verify the JSON LD element exists", async () => {
		ldJson = page.locator('script[type="application/ld+json"]');

		await expect(ldJson).toBeAttached();
	});

	await test.step("Verify the JSON LD element content", async () => {
		const ldJsonContent = await ldJson.textContent();
		const url = new URL(
			`/posts/${blogPost.slug}`,
			testInfo.project.use.baseURL,
		);

		expect(JSON.parse(ldJsonContent ?? "{}")).toEqual(
			expect.objectContaining({
				"@context": "https://schema.org",
				"@type": "BlogPosting",
				"@id": `${url}`,
				name: blogPost.title,
				url: `${url}`,
				description: blogPost.brief,
				author: expect.objectContaining({
					"@type": "Person",
					"@id": `${testInfo.project.use.baseURL}/`,
					name: blogPost.author.name,
					image: `${testInfo.project.use.baseURL}${blogPost.author.avatarImage.url}`,
				}),
				image: expect.objectContaining({
					"@type": "ImageObject",
					"@id": `${testInfo.project.use.baseURL}/posts/${blogPost.slug}/thumbnail.png`,
					url: `${testInfo.project.use.baseURL}/posts/${blogPost.slug}/thumbnail.png`,
					height: "1200",
					width: "630",
				}),
				isPartOf: expect.objectContaining({
					"@type": "Blog",
					"@id": `${testInfo.project.use.baseURL}/`,
					name: website.name,
					url: `${testInfo.project.use.baseURL}/`,
				}),
			}),
		);
	});
});

test("Open Graph metadata", async ({ page }, testInfo) => {
	let website: Awaited<ReturnType<typeof getWebsite>>;

	await test.step("Retrieve the website record", async () => {
		website = await getWebsite({ page, testInfo });
	});

	let blogPost: Awaited<ReturnType<typeof getExampleBlogPost>>;

	await test.step("Retrieve the example blog post record", async () => {
		blogPost = await getExampleBlogPost({ page, testInfo });
	});

	await test.step("Verify og:site_name", async () => {
		await expect(page.locator('meta[property="og:site_name"]')).toHaveAttribute(
			"content",
			website.name,
		);
	});

	await test.step("Verify og:title", async () => {
		await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
			"content",
			blogPost.title,
		);
	});

	await test.step("Verify og:description", async () => {
		await expect(
			page.locator('meta[property="og:description"]'),
		).toHaveAttribute("content", blogPost.brief);
	});

	await test.step("Verify og:type", async () => {
		await expect(page.locator('meta[property="og:type"]')).toHaveAttribute(
			"content",
			"article",
		);
	});

	await test.step("Verify og:locale", async () => {
		await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute(
			"content",
			"ja_JP",
		);
	});

	await test.step("Verify og:url", async () => {
		await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
			"content",
			`${testInfo.project.use.baseURL}/posts/${blogPost.slug}`,
		);
	});
});
