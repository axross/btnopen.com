import { expect, test } from "@playwright/test";
import {
	exampleBlogPostSlug,
	publishedBlogPostSlug,
} from "@/e2e/helpers/api/blog-post";

// no `storageState` here on purpose: this runs signed out and asks for the draft
// list explicitly, which is the case the gate exists for. `index.published-post`
// covers the same expectation for the plain public list (no `draft` param).

test("A signed-out draft request for the index lists only published posts", {
	tag: [
		"@scenario:index.draft.unauthenticated",
		"@area:index",
		"@priority:must",
	],
}, async ({ page }) => {
	await test.step("Navigate to the index route with draft=true", async () => {
		await page.goto("/?draft=true");
	});

	const blogPostList = page.getByTestId("page").getByTestId("blog-posts");

	await test.step("Verify the blog post list is visible", async () => {
		await blogPostList.waitFor();

		await expect(blogPostList).toBeVisible();
	});

	await test.step("Verify the published post is listed", async () => {
		await expect(
			blogPostList.locator(
				`[data-testid="blog-post"][data-slug="${publishedBlogPostSlug}"]`,
			),
		).toBeVisible();
	});

	await test.step("Verify the unpublished post is not listed", async () => {
		await expect(
			blogPostList.locator(
				`[data-testid="blog-post"][data-slug="${exampleBlogPostSlug}"]`,
			),
		).toHaveCount(0);
	});
});
