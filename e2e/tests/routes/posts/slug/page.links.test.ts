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

// A Payload Lexical link node, which `convertLexicalToMarkdown` serializes to
// `[label](url)`. Its own field validation accepts any value that is non-empty
// and space-free, so a dangerous protocol is storable — which is exactly why the
// rendering pipeline has to be the one that refuses it.
function link(url: string, label: string): LexicalNode {
	return {
		type: "link",
		children: [text(label)],
		direction: "ltr",
		fields: { doc: null, linkType: "custom", newTab: false, url },
		format: "",
		indent: 0,
		version: 3,
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
	"Body links isolate external destinations, keep internal ones internal, and neutralize dangerous protocols",
	{
		tag: ["@scenario:post.content.links", "@area:posts", "@priority:must"],
	},
	async ({ page }, testInfo) => {
		let createdId: number | null = null;

		try {
			// the collection soft-deletes (trash: true), so a unique per-run suffix
			// keeps the unique slug free across repeats and re-runs.
			const slug = `links-${testInfo.repeatEachIndex}-${testInfo.workerIndex}-${Date.now()}`;

			await test.step("Create a draft post whose body carries inline links of every kind", async () => {
				({ id: createdId } = await createDraftBlogPost({
					page,
					slug,
					testInfo,
					title: "リンクの確認",
					// every link sits inline within surrounding text on purpose: a link
					// alone in a paragraph is rewritten into an `embed` directive by
					// `remarkEmbeds`, which is a different (already protocol-gated) path.
					body: createBody([
						paragraph([
							text("外部サイトは "),
							link("https://example.com/", "外部リンク"),
							text(" を参照。"),
						]),
						paragraph([
							text("関連記事は "),
							link("/posts/declarative-ui", "内部リンク"),
							text(" を参照。"),
						]),
						paragraph([
							text("連絡は "),
							link("mailto:yo@axross.dev", "メールリンク"),
							text(" まで。"),
						]),
						paragraph([
							text("これは "),
							link("javascript:alert(1)", "危険なリンク"),
							text(" です。"),
						]),
					]),
				}));
			});

			await test.step("Navigate to the post route (draft=true)", async () => {
				await page.goto(`/posts/${slug}?draft=true`);
			});

			const content = page.getByTestId("page").getByTestId("content");

			await test.step("Verify an external link opens in a tab isolated from this page", async () => {
				const external = content.locator('a[href="https://example.com/"]');

				await expect(external).toBeVisible();
				await expect(external).toHaveAttribute("target", "_blank");
				await expect(external).toHaveAttribute("rel", "noopener noreferrer");
			});

			await test.step("Verify an internal link carries neither target nor rel", async () => {
				const internal = content.locator('a[href="/posts/declarative-ui"]');

				await expect(internal).toBeVisible();
				expect(await internal.getAttribute("target")).toBeNull();
				expect(await internal.getAttribute("rel")).toBeNull();
			});

			await test.step("Verify a mailto link keeps its href and stays in place", async () => {
				const contact = content.locator('a[href="mailto:yo@axross.dev"]');

				await expect(contact).toBeVisible();
				expect(await contact.getAttribute("target")).toBeNull();
				expect(await contact.getAttribute("rel")).toBeNull();
			});

			await test.step("Verify a javascript: link renders inert while keeping its text", async () => {
				const dangerous = content.locator("a", { hasText: "危険なリンク" });

				await expect(dangerous).toBeVisible();
				expect(await dangerous.getAttribute("href")).toBeNull();
				await expect(content.locator('a[href^="javascript:"]')).toHaveCount(0);
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
