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

function text(value: string): LexicalNode {
	return {
		type: "text",
		detail: 0,
		format: 0,
		mode: "normal",
		style: "",
		text: value,
		version: 1,
	};
}

function paragraph(children: LexicalNode[]): LexicalNode {
	return {
		type: "paragraph",
		children,
		direction: "ltr",
		format: "",
		indent: 0,
		textFormat: 0,
		version: 1,
	};
}

// A single paragraph whose lines are joined by hard line breaks round-trips to
// Markdown as `line1\nline2\n…`. Wrapping the lines in `:::name` / `:::` fences
// therefore produces a real `containerDirective` — the case that, before the
// fix, hit the unknown-node handler and vanished.
function linedParagraph(lines: string[]): LexicalNode {
	const children: LexicalNode[] = [];

	lines.forEach((line, index) => {
		if (index > 0) {
			children.push({ type: "linebreak", version: 1 });
		}

		children.push(text(line));
	});

	return paragraph(children);
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

test(
	"Text and container directives render verbatim instead of vanishing",
	{
		tag: ["@scenario:post.content.directives", "@area:posts", "@priority:must"],
	},
	async ({ page }, testInfo) => {
		let createdId: number | null = null;

		try {
			// the collection soft-deletes (trash: true), so a unique per-run suffix
			// keeps the unique slug free across repeats and re-runs.
			const slug = `directives-${testInfo.repeatEachIndex}-${testInfo.workerIndex}-${Date.now()}`;

			await test.step("Create a draft post whose body contains text and container directives", async () => {
				({ id: createdId } = await createDraftBlogPost({
					page,
					slug,
					testInfo,
					title: "ディレクティブの確認",
					body: createBody([
						// inline `:word` → textDirective
						paragraph([text("TypeScript:strict is nice.")]),
						paragraph([text("Use the :embed syntax inline.")]),
						// `:::name … :::` fence → containerDirective
						linedParagraph([":::note", "container body survives", ":::"]),
					]),
				}));
			});

			await test.step("Navigate to the post route (draft=true)", async () => {
				await page.goto(`/posts/${slug}?draft=true`);
			});

			const content = page.getByTestId("page").getByTestId("content");

			await test.step("Verify an inline colon-word renders verbatim", async () => {
				await expect(content).toContainText("TypeScript:strict is nice.");
			});

			await test.step("Verify an inline `:word` mention is not dropped", async () => {
				await expect(content).toContainText("Use the :embed syntax inline.");
			});

			await test.step("Verify a `:::` container block does not vanish", async () => {
				await expect(content).toContainText(":::note");
				await expect(content).toContainText("container body survives");
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
