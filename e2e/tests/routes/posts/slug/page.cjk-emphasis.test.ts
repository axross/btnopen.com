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

// A bold text node (`format: 1`) — what the Lexical editor stores for `**bold**`
// and what `convertLexicalToMarkdown` serializes back to bare `**…**`.
function bold(value: string): LexicalNode {
	return { ...text(value), format: 1 };
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
	"Bold spans closing on CJK punctuation render as <strong> instead of literal asterisks",
	{
		tag: [
			"@scenario:post.content.cjk-emphasis",
			"@area:posts",
			"@priority:must",
		],
	},
	async ({ page }, testInfo) => {
		let createdId: number | null = null;

		try {
			// the collection soft-deletes (trash: true), so a unique per-run suffix
			// keeps the unique slug free across repeats and re-runs.
			const slug = `cjk-emphasis-${testInfo.repeatEachIndex}-${testInfo.workerIndex}-${Date.now()}`;

			await test.step("Create a draft post whose body has bold spans bordering CJK punctuation", async () => {
				({ id: createdId } = await createDraftBlogPost({
					page,
					slug,
					testInfo,
					title: "太字の確認",
					body: createBody([
						// closing `**` preceded by `。`, immediately followed by continuation
						// text — the flanking-rule violation from the report.
						paragraph([
							bold("エージェントはステートレスだという前提に立つこと。"),
							text("フローのうち失われる文脈を毎回渡し直す。"),
						]),
						// closing `**` preceded by `)`, immediately followed by continuation.
						paragraph([
							bold("ループエンジニアリング(Loop Engineering)"),
							text("です。"),
						]),
						// control: a bold span already right-flanking under CommonMark, to
						// guard against the fix breaking previously-correct emphasis.
						paragraph([
							text("「"),
							bold("どう始めるか"),
							text("」を先に決める。"),
						]),
					]),
				}));
			});

			await test.step("Navigate to the post route (draft=true)", async () => {
				await page.goto(`/posts/${slug}?draft=true`);
			});

			const content = page.getByTestId("page").getByTestId("content");

			await test.step("Verify the `。`-terminated bold span renders as <strong>", async () => {
				await expect(
					content.locator("strong", {
						hasText: "エージェントはステートレスだという前提に立つこと。",
					}),
				).toBeVisible();
				await expect(content).toContainText(
					"フローのうち失われる文脈を毎回渡し直す。",
				);
			});

			await test.step("Verify the `)`-terminated bold span renders as <strong>", async () => {
				await expect(
					content.locator("strong", {
						hasText: "ループエンジニアリング(Loop Engineering)",
					}),
				).toBeVisible();
			});

			await test.step("Verify the already-correct control bold span still renders as <strong>", async () => {
				await expect(
					content.locator("strong", { hasText: "どう始めるか" }),
				).toBeVisible();
			});

			await test.step("Verify no literal `**` delimiters leak into the rendered content", async () => {
				await expect(content).not.toContainText("**");
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
