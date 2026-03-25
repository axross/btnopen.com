import { expect, type Locator, test } from "@playwright/test";
import { authenticatedStorageState } from "@/e2e/helpers/api/auth";
import { getExampleBlogPost } from "@/e2e/helpers/api/blog-post";

const urlRegex = /^https?:\/\//;
const avatarImagePathnameRegex = /^\/api\/avatar-images\/file\//;

test.use({ storageState: authenticatedStorageState });

test.beforeEach(async ({ page }) => {
	await test.step("Navigate to the index route (draft=true)", async () => {
		await page.goto("/?draft=true");
	});
});

test("Introduction section", async ({ page }) => {
	const indexPage = page.getByTestId("page");
	let intro: Locator;

	await test.step("Verify the bio", async () => {
		intro = indexPage.getByTestId("intro");

		await expect(intro.getByTestId("bio")).toBeVisible();
	});

	await test.step("Verify the social links", async () => {
		const socialLinks = intro.getByTestId("social-links");

		await test.step("Verify the GitHub link", async () => {
			await expect(socialLinks.getByTestId("github")).toBeVisible();
		});

		await test.step("Verify the X link", async () => {
			await expect(socialLinks.getByTestId("xcom")).toBeVisible();
		});

		await test.step("Verify the LinkedIn link", async () => {
			await expect(socialLinks.getByTestId("linkedin")).toBeVisible();
		});
	});
});

test("Blog post list", async ({ page }, testInfo) => {
	let slug: string;
	let title: string;
	let brief: string;

	await test.step("Retrieve the example blog post record", async () => {
		({ slug, title, brief } = await getExampleBlogPost({ page, testInfo }));
	});

	const indexPage = page.getByTestId("page");
	let blogPostList!: Locator;

	await test.step("Verify whether the blog post list is visible", async () => {
		blogPostList = indexPage.getByTestId("blog-posts");

		await expect(blogPostList).toBeVisible();
	});

	let blogPost: Locator;

	await test.step("Verify whether the example blog post appears in the list", async () => {
		blogPost = blogPostList.locator(
			`[data-testid="blog-post"][data-slug="${slug}"]`,
		);

		await expect(blogPost).toBeVisible();
	});

	await test.step("Verify the example blog post title", async () => {
		await expect(blogPost.getByTestId("title")).toHaveText(title);
	});

	await test.step("Verify the example blog post brief", async () => {
		await expect(blogPost.getByTestId("brief")).toHaveText(brief);
	});

	await test.step("Verify the example blog post thumbnail image", async () => {
		await expect(blogPost.getByTestId("thumbnail-image")).toBeVisible();
	});

	await test.step("Click the blog post", async () => {
		await blogPost.click();
	});

	await test.step("Verify navigated to the example blog post page", async () => {
		await page.waitForURL(`/posts/${slug}`);

		expect(page).toHaveURL(`/posts/${slug}`);
	});
});

test("JSON-LD metadata", async ({ page }) => {
	const ldJson = page.locator('script[type="application/ld+json"]');

	await expect(ldJson).toBeAttached();

	const ldJsonContent = await ldJson.textContent();

	expect(JSON.parse(ldJsonContent ?? "{}")).toEqual(
		expect.objectContaining({
			"@context": "https://schema.org",
			"@type": "Blog",
			"@id": expect.stringMatching(urlRegex),
			name: "<btn open />",
			url: expect.stringMatching(urlRegex),
			author: {
				"@type": "Person",
				"@id": expect.stringMatching(urlRegex),
				name: expect.stringContaining(""),
				image: expect.stringMatching(avatarImagePathnameRegex),
			},
		}),
	);
});

test("Open Graph metadata", async ({ page }) => {
	await expect(page.locator('meta[property="og:site_name"]')).toContainText("");
	await expect(page.locator('meta[property="og:title"]')).toContainText("");
	await expect(page.locator('meta[property="og:description"]')).toContainText(
		"",
	);
	await expect(page.locator('meta[property="og:type"]')).toContainText("");
	await expect(page.locator('meta[property="og:locale"]')).toContainText("");
	await expect(page.locator('meta[property="og:url"]')).toContainText("");
});
