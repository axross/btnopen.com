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
