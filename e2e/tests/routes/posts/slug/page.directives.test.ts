import { expect, test } from "@playwright/test";
import { authenticatedStorageState } from "@/e2e/helpers/api/auth";
import { createDraftBlogPost } from "@/e2e/helpers/api/blog-post";
import { deleteBlogPost } from "@/e2e/helpers/api/mcp";

test.use({ storageState: authenticatedStorageState });

// A Lexical body of plain-text paragraphs. Once round-tripped to Markdown, a
// colon-word such as `TypeScript:strict` is parsed by remark-directive as a
// `textDirective`; this fixture proves the renderer keeps that text instead of
// dropping it.
function createTextBody(paragraphs: string[]): unknown {
	return {
		root: {
			type: "root",
			children: paragraphs.map((text) => ({
				type: "paragraph",
				children: [
					{
						type: "text",
						detail: 0,
						format: 0,
						mode: "normal",
						style: "",
						text,
						version: 1,
					},
				],
				direction: "ltr",
				format: "",
				indent: 0,
				textFormat: 0,
				version: 1,
			})),
			direction: "ltr",
			format: "",
			indent: 0,
			version: 1,
		},
	};
}

test(
	"Inline colon-word text directives render verbatim instead of vanishing",
	{
		tag: ["@scenario:post.content.directives", "@area:posts", "@priority:must"],
	},
	async ({ page }, testInfo) => {
		let createdId: number | null = null;

		try {
			// the collection soft-deletes (trash: true), so a unique per-run suffix
			// keeps the unique slug free across repeats and re-runs.
			const slug = `directives-${testInfo.repeatEachIndex}-${testInfo.workerIndex}-${Date.now()}`;

			await test.step("Create a draft post whose body contains inline `:word` directives", async () => {
				({ id: createdId } = await createDraftBlogPost({
					page,
					slug,
					testInfo,
					title: "テキストディレクティブの確認",
					body: createTextBody([
						"TypeScript:strict is nice.",
						"Use the :embed syntax inline.",
					]),
				}));
			});

			await test.step("Navigate to the post route (draft=true)", async () => {
				await page.goto(`/posts/${slug}?draft=true`);
			});

			const content = page.getByTestId("page").getByTestId("content");

			await test.step("Verify the colon-word renders verbatim", async () => {
				await expect(content).toContainText("TypeScript:strict is nice.");
			});

			await test.step("Verify an inline `:word` mention is not dropped", async () => {
				await expect(content).toContainText("Use the :embed syntax inline.");
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
