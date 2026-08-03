import { expect, test } from "@playwright/test";
import { exampleBlogPostSlug } from "@/e2e/helpers/api/blog-post";

const notFoundStatus = 404;

// no `storageState` here on purpose: these run signed out, which is the whole
// point. The seed's example post is never published, so a visitor who asks for
// its draft view must get the not-found surface rather than the unpublished
// content. The authenticated counterparts live in page.agentic.test.ts and
// thumbnail.test.ts, which reuse the admin session and still see the draft.

test("A signed-out draft request for an unpublished post shows the not-found page", {
	tag: [
		"@scenario:post.draft.unauthenticated",
		"@area:posts",
		"@priority:must",
	],
}, async ({ page }) => {
	await test.step("Navigate to the unpublished post with draft=true", async () => {
		await page.goto(`/posts/${exampleBlogPostSlug}?draft=true`);
	});

	await test.step("Verify the not-found page is shown", async () => {
		await expect(page.getByTestId("not-found")).toBeVisible();
	});

	await test.step("Verify no post content is rendered", async () => {
		await expect(page.getByTestId("page")).toHaveCount(0);
	});
});

test("A signed-out request for an unpublished post's thumbnail responds 404", {
	tag: [
		"@scenario:post.thumbnail.draft-unauthenticated",
		"@area:metadata",
		"@priority:must",
	],
}, async ({ page }) => {
	await test.step("Request the unpublished post's thumbnail endpoint", async () => {
		// the endpoint hard-codes `draft: true` so live preview can render an
		// autosaved draft; without a session it must resolve to published-only
		// and find nothing.
		const response = await page.request.get(
			`/posts/${exampleBlogPostSlug}/thumbnail.png`,
		);

		expect(response.status()).toBe(notFoundStatus);
	});
});
