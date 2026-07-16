import { expect, test } from "@playwright/test";
import { authenticatedStorageState } from "@/e2e/helpers/api/auth";
import { createDraftBlogPost } from "@/e2e/helpers/api/blog-post";
import { deleteBlogPost } from "@/e2e/helpers/api/mcp";

test.use({ storageState: authenticatedStorageState });

interface LexicalNode {
	type: string;
	version: number;
	[key: string]: unknown;
}

function paragraph(value: string): LexicalNode {
	return {
		type: "paragraph",
		children: [
			{
				type: "text",
				detail: 0,
				format: 0,
				mode: "normal",
				style: "",
				text: value,
				version: 1,
			},
		],
		direction: "ltr",
		format: "",
		indent: 0,
		textFormat: 0,
		version: 1,
	};
}

function embedBlockNode(url: string, type: string): LexicalNode {
	return {
		type: "block",
		fields: {
			id: "e2e-embed-x",
			blockName: "",
			blockType: "embed",
			url,
			type,
			options: null,
		},
		format: "",
		version: 2,
	};
}

function createBody(children: LexicalNode[]): unknown {
	return {
		root: {
			type: "root",
			children,
			direction: "ltr",
			format: "",
			indent: 0,
			version: 1,
		},
	};
}

// A stable, public tweet ("just setting up my twttr"). The card's "View on X"
// link and the degraded fallback link both point at this /status/20 URL, so the
// assertion holds whether or not the live syndication endpoint is reachable.
const tweetUrl = "https://x.com/jack/status/20";

test(
	"Blog post x.com embed renders a first-party card linking to the tweet",
	{
		tag: ["@scenario:post.embed.x", "@area:posts", "@priority:should"],
	},
	async ({ page }, testInfo) => {
		let createdId: number | null = null;

		try {
			// the collection soft-deletes (trash: true), so a unique per-run suffix
			// keeps the unique slug free across repeats and re-runs.
			const slug = `embed-x-${testInfo.repeatEachIndex}-${testInfo.workerIndex}-${Date.now()}`;

			await test.step("Create a draft post whose body contains an x.com embed block", async () => {
				({ id: createdId } = await createDraftBlogPost({
					page,
					slug,
					testInfo,
					title: "X 埋め込みの確認",
					body: createBody([
						paragraph("Before the embed."),
						embedBlockNode(tweetUrl, "x.com"),
						paragraph("After the embed."),
					]),
				}));
			});

			await test.step("Navigate to the post route (draft=true)", async () => {
				await page.goto(`/posts/${slug}?draft=true`);
			});

			const content = page.getByTestId("page").getByTestId("content");
			const embed = content.getByTestId("embed");

			await test.step("Verify the embed resolves (card or degraded link)", async () => {
				await expect(embed).toBeVisible();
			});

			await test.step("Verify it links out to the tweet, not an iframe or widget", async () => {
				// success renders a "View on X" link; the fallback renders the URL as a
				// plain anchor — both expose an anchor to the /status/20 URL.
				await expect(
					content.locator('a[href*="/status/20"]').first(),
				).toBeVisible();
				// the reader-facing render is first-party markup: no X iframe embed.
				await expect(content.locator("iframe")).toHaveCount(0);
			});
		} finally {
			if (createdId !== null) {
				const id = createdId;

				await test.step("Clean up the draft post", async () => {
					await deleteBlogPost({ id, page, testInfo });
				});
			}
		}
	},
);
