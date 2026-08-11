import { Fragment } from "react";
import jsxRuntime from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { renderMarkdown } from "./markdown";

// a themed token span emitted by the real Shiki highlighter, e.g.
// `<span style="color:var(--snippet-token-keyword)">const</span>`.
const highlightedKeywordPattern =
	/<span style="color:var\(--snippet-[^"]+\)">const<\/span>/;

/**
 * Renders markdown through the real pipeline — the real Shiki highlighter
 * included — and serializes the resulting React element to HTML. No component
 * map is passed, so every node renders as the intrinsic element the pipeline
 * chose; that keeps the assertions about the pipeline rather than about the
 * components `markdown.tsx` happens to map onto it.
 */
async function renderToHtml(markdown: string): Promise<string> {
	const element = await renderMarkdown({
		markdown,
		rehypeReactOptions: {
			jsx: jsxRuntime.jsx,
			jsxs: jsxRuntime.jsxs,
			// biome-ignore lint/style/useNamingConvention: follow the API of rehypeReact
			Fragment,
		},
	});

	return renderToStaticMarkup(element);
}

describe("renderMarkdown()", () => {
	it("renders paragraph prose", async () => {
		expect(await renderToHtml("ふつうの段落です。")).toBe(
			"<p>ふつうの段落です。</p>",
		);
	});

	it("highlights a fenced code block through Shiki", async () => {
		const html = await renderToHtml("```ts\nconst a: number = 1;\n```");

		expect(html).toContain('<pre class="shiki css-variables">');
		expect(html).toContain('<span class="line">');
		// the keyword sits in its own themed span, so the highlighter really ran
		// rather than the source passing through as plain text.
		expect(html).toMatch(highlightedKeywordPattern);
	});

	it("unnests the <code> wrapper inside a fenced code block's <pre>", async () => {
		const html = await renderToHtml("```ts\nconst a = 1;\n```");

		expect(html).not.toContain("<code");
	});

	it("renders a GFM table", async () => {
		expect(await renderToHtml("| a | b |\n| --- | --- |\n| 1 | 2 |")).toBe(
			"<table><thead><tr><th>a</th><th>b</th></tr></thead>" +
				"<tbody><tr><td>1</td><td>2</td></tr></tbody></table>",
		);
	});

	it("renders an embed leaf directive as an element carrying its attributes", async () => {
		expect(
			await renderToHtml('::embed{url="https://example.com" type="webpage"}'),
		).toBe('<embed url="https://example.com" type="webpage"/>');
	});

	it("rewrites a paragraph holding only a link into an embed directive", async () => {
		expect(await renderToHtml("[Example](https://example.com/article)")).toBe(
			'<embed url="https://example.com/article" type="webpage" title="Example"/>',
		);
	});

	it("renders a link inside a sentence as an anchor", async () => {
		expect(
			await renderToHtml(
				"詳しくは [ドキュメント](https://example.com/docs) を。",
			),
		).toBe(
			'<p>詳しくは <a href="https://example.com/docs">ドキュメント</a> を。</p>',
		);
	});

	it("drops the href of a link whose protocol is blocked, keeping its text", async () => {
		const html = await renderToHtml(
			"詳しくは [ここをクリック](javascript:alert(1)) を。",
		);

		expect(html).toContain("<a>ここをクリック</a>");
		expect(html).not.toContain("href");
		expect(html).not.toContain("javascript:");
	});

	it("keeps a text directive as its verbatim source instead of dropping it", async () => {
		expect(await renderToHtml("設定は TypeScript:strict です。")).toBe(
			"<p>設定は TypeScript:strict です。</p>",
		);
	});

	it("keeps an unhandled container directive as its verbatim source", async () => {
		const html = await renderToHtml(":::unknown\n\n本文です\n\n:::");

		expect(html).toContain(":::unknown");
		expect(html).toContain("本文です");
		expect(html).toContain(":::</p>");
	});

	it("keeps the banner container directive as a handled element", async () => {
		expect(
			await renderToHtml(':::banner{type="note"}\n\n注意書きです\n\n:::'),
		).toBe('<banner type="note"><p>注意書きです</p></banner>');
	});
});
