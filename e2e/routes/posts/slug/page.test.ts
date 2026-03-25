import { expect, test } from "@playwright/test";
import { authenticatedStorageState } from "@/e2e/helpers/api/auth";
import { getExampleBlogPost } from "@/e2e/helpers/api/blog-post";

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
			"March 22nd, 2026",
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

	await test.step("Verify the blog post content", async () => {
		await expect(content).toHaveScreenshot("content.png");
	});
});
