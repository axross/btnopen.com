import { expect, test } from "@playwright/test";
import { authenticatedStorageState } from "@/e2e/helpers/api/auth";
import {
	exampleBlogPostSlug,
	getPublishedBlogPost,
} from "@/e2e/helpers/api/blog-post";

// This exercises the public index view: it navigates without `draft=true`, so
// the list renders published-only regardless of the session. The storage state
// is reused only so the `/api/blog-posts` read (which is access-controlled) can
// fetch the expected record — it does not enable drafts, which need the param.
test.use({ storageState: authenticatedStorageState });

test(
	"The public index page lists the published post and omits the draft",
	{
		tag: ["@scenario:index.published-post", "@area:index", "@priority:should"],
	},
	async ({ page }, testInfo) => {
		let slug!: string;
		let title!: string;
		let brief!: string;

		await test.step("Retrieve the published blog post record", async () => {
			({ slug, title, brief } = await getPublishedBlogPost({ page, testInfo }));
		});

		await test.step("Navigate to the public index route", async () => {
			await page.goto("/");
		});

		const blogPostList = page.getByTestId("page").getByTestId("blog-posts");

		await test.step("Verify the blog post list is visible", async () => {
			await blogPostList.waitFor();

			await expect(blogPostList).toBeVisible();
		});

		await test.step("Verify the published post appears with its title and brief", async () => {
			const publishedPost = blogPostList.locator(
				`[data-testid="blog-post"][data-slug="${slug}"]`,
			);

			await expect(publishedPost).toBeVisible();
			await expect(publishedPost.getByTestId("title")).toHaveText(title);
			await expect(publishedPost.getByTestId("brief")).toHaveText(brief);
		});

		await test.step("Verify the draft post is not listed publicly", async () => {
			await expect(
				blogPostList.locator(
					`[data-testid="blog-post"][data-slug="${exampleBlogPostSlug}"]`,
				),
			).toHaveCount(0);
		});
	},
);
