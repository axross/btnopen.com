import { expect, type Locator, test } from "@playwright/test";
import { authenticatedStorageState } from "@/e2e/helpers/api/auth";
import { getExampleBlogPost } from "@/e2e/helpers/api/blog-post";
import { getWebsite } from "@/e2e/helpers/api/website";

const socialLinkCount = 3;

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

		await test.step("Verify the social links expose list semantics", async () => {
			await expect(socialLinks).toHaveRole("list");
			await expect(socialLinks.getByRole("listitem")).toHaveCount(
				socialLinkCount,
			);
		});

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

test("Landmark regions", async ({ page }) => {
	await test.step("Verify the introduction region is exposed", async () => {
		await expect(
			page.getByRole("region", { name: "Introduction" }),
		).toBeVisible();
	});

	await test.step("Verify the Posts region is exposed and named by its heading", async () => {
		await expect(page.getByRole("region", { name: "Posts" })).toBeVisible();
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

		await blogPostList.waitFor();

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
		await page.waitForURL(`/posts/${slug}?draft=true`);

		await expect(page).toHaveURL(`/posts/${slug}?draft=true`);
	});
});

test("Heading structure and list semantics", async ({ page }, testInfo) => {
	let website: Awaited<ReturnType<typeof getWebsite>>;

	await test.step("Retrieve the website record", async () => {
		website = await getWebsite({ page, testInfo });
	});

	await test.step("Verify a single top-level heading names the creator", async () => {
		const heading = page.getByRole("heading", { level: 1 });

		await expect(heading).toHaveCount(1);
		await expect(heading).toHaveText(website.creator.name);
	});

	await test.step("Verify the Posts section is a level-2 heading", async () => {
		await expect(
			page.getByRole("heading", { level: 2, name: "Posts" }),
		).toBeVisible();
	});

	await test.step("Verify the blog post list exposes list semantics", async () => {
		const blogPostList = page.getByTestId("blog-posts");

		await blogPostList.waitFor();

		await expect(blogPostList).toHaveRole("list");
		await expect(blogPostList.getByRole("listitem").first()).toBeVisible();
	});
});

test("JSON-LD metadata", async ({ page }, testInfo) => {
	let website: Awaited<ReturnType<typeof getWebsite>>;

	await test.step("Retrieve the website record", async () => {
		website = await getWebsite({ page, testInfo });
	});

	let ldJson: Locator;

	await test.step("Verify the JSON LD element exists", async () => {
		ldJson = page.locator('script[type="application/ld+json"]');

		await expect(ldJson).toBeAttached();
	});

	await test.step("Verify the JSON LD element content", async () => {
		const ldJsonContent = await ldJson.textContent();

		expect(JSON.parse(ldJsonContent ?? "{}")).toEqual(
			expect.objectContaining({
				"@context": "https://schema.org",
				"@type": "Blog",
				"@id": `${testInfo.project.use.baseURL}/`,
				name: website.name,
				url: `${testInfo.project.use.baseURL}/`,
				author: {
					"@type": "Person",
					"@id": `${testInfo.project.use.baseURL}/`,
					name: website.creator.name,
					image: `${testInfo.project.use.baseURL}${website.creator.avatarImage.url}`,
				},
			}),
		);
	});
});

test("Open Graph metadata", async ({ page }, testInfo) => {
	let website: Awaited<ReturnType<typeof getWebsite>>;

	await test.step("Retrieve the website record", async () => {
		website = await getWebsite({ page, testInfo });
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
			website.name,
		);
	});

	await test.step("Verify og:description", async () => {
		await expect(
			page.locator('meta[property="og:description"]'),
		).toHaveAttribute("content", website.description);
	});

	await test.step("Verify og:type", async () => {
		await expect(page.locator('meta[property="og:type"]')).toHaveAttribute(
			"content",
			"website",
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
			`${testInfo.project.use.baseURL}`,
		);
	});
});
