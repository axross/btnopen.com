import { expect, test } from "@playwright/test";
import { authenticatedStorageState } from "@/e2e/helpers/api/auth";
import {
	getPublishedBlogPost,
	publishedBlogPostSlug,
} from "@/e2e/helpers/api/blog-post";

// The public (non-draft) view of the seed's published post: it must be reachable
// at its route and render both its body and the seeded reader-comment thread —
// which the draft example post never exercises publicly. Navigation omits
// `draft=true`, so this is the published view; the storage state is reused only
// so the access-controlled `/api/blog-posts` read can fetch the expected record.
test.use({ storageState: authenticatedStorageState });

test(
	"The published post is publicly reachable and renders its content and seeded comments",
	{
		tag: ["@scenario:post.published.public", "@area:posts", "@priority:should"],
	},
	async ({ page }, testInfo) => {
		let title!: string;

		await test.step("Retrieve the published blog post record", async () => {
			({ title } = await getPublishedBlogPost({ page, testInfo }));
		});

		await test.step("Navigate to the published post page", async () => {
			await page.goto(`/posts/${publishedBlogPostSlug}`);
		});

		const postPage = page.getByTestId("page");

		await test.step("Verify the post header title", async () => {
			await expect(
				postPage.getByTestId("header").getByTestId("title"),
			).toHaveText(title);
		});

		await test.step("Verify the post content renders", async () => {
			await expect(postPage.getByTestId("content")).toBeVisible();
		});

		const comments = postPage.getByTestId("comments");

		await test.step("Verify the seeded comments section renders an approved comment", async () => {
			await expect(comments).toBeVisible();
			await expect(comments.getByTestId("comment").first()).toBeVisible();
		});

		await test.step("Verify the seeded author reply renders with an Author badge", async () => {
			await expect(
				comments.getByTestId("replies").getByTestId("author-badge").first(),
			).toBeVisible();
		});
	},
);
