import { describe, expect, it } from "@jest/globals";
import {
	bannerEndRegex,
	bannerStartRegex,
	exportBannerDirective,
	importBannerDirective,
} from "./banner-directive";

/**
 * A stand-in for the parent editor's `lexicalToMarkdown`: it reads a `markdown`
 * marker off the fake editor state so the converter's body handling is testable
 * without a real Lexical editor.
 */
function fakeLexicalToMarkdown({
	editorState,
}: {
	editorState: Record<string, unknown>;
}): string {
	return typeof editorState.markdown === "string" ? editorState.markdown : "";
}

/**
 * A stand-in for the parent editor's `markdownToLexical`: it wraps the markdown
 * back into a fake editor state so a round trip is assertable.
 */
function fakeMarkdownToLexical({
	markdown,
}: {
	markdown: string;
}): Record<string, unknown> {
	return { root: { markdown } };
}

/**
 * Mimics how the Lexical multiline transformer feeds a matched
 * `:::banner{…}:::` block into the `import` converter: the opening line becomes
 * `openMatch`, and the lines between the fences become the trimmed `children`.
 */
function parseExportedBanner(markdown: string): {
	openMatch: RegExpMatchArray | undefined;
	children: string;
} {
	const lines = markdown.split("\n");
	const openMatch = bannerStartRegex.exec(lines[0]) ?? undefined;
	const endIndex = lines.findIndex(
		(line, index) => index > 0 && bannerEndRegex.test(line),
	);
	const children = lines.slice(1, endIndex).join("\n").trim();

	return { openMatch, children };
}

describe("exportBannerDirective()", () => {
	it("emits a container directive wrapping the body markdown", () => {
		expect(
			exportBannerDirective(
				{ type: "note", body: { markdown: "Hello **world**." } },
				fakeLexicalToMarkdown,
			),
		).toBe(':::banner{type="note"}\n\nHello **world**.\n\n:::');
	});

	it("emits the warning type", () => {
		expect(
			exportBannerDirective(
				{ type: "warning", body: { markdown: "Careful." } },
				fakeLexicalToMarkdown,
			),
		).toContain('type="warning"');
	});

	it("preserves a body with multiple paragraphs", () => {
		expect(
			exportBannerDirective(
				{ type: "note", body: { markdown: "One.\n\nTwo." } },
				fakeLexicalToMarkdown,
			),
		).toBe(':::banner{type="note"}\n\nOne.\n\nTwo.\n\n:::');
	});

	it("falls back to the note type when type is missing", () => {
		expect(
			exportBannerDirective(
				{ body: { markdown: "Body." } },
				fakeLexicalToMarkdown,
			),
		).toContain('type="note"');
	});

	it("returns false when the body is missing or empty", () => {
		expect(exportBannerDirective({ type: "note" }, fakeLexicalToMarkdown)).toBe(
			false,
		);
		expect(
			exportBannerDirective(
				{ type: "note", body: { markdown: "   " } },
				fakeLexicalToMarkdown,
			),
		).toBe(false);
	});
});

describe("importBannerDirective()", () => {
	it("parses the type and converts the body", () => {
		const { openMatch, children } = parseExportedBanner(
			':::banner{type="warning"}\nBe careful.\n:::',
		);

		expect(
			importBannerDirective(openMatch, children, fakeMarkdownToLexical),
		).toEqual({
			type: "warning",
			body: { root: { markdown: "Be careful." } },
		});
	});

	it("defaults the type to note when the attribute is absent", () => {
		const { openMatch, children } = parseExportedBanner(
			":::banner{}\nBody.\n:::",
		);

		expect(
			importBannerDirective(openMatch, children, fakeMarkdownToLexical),
		).toMatchObject({ type: "note" });
	});

	it("returns false when the opening line did not match", () => {
		expect(
			importBannerDirective(undefined, "Body.", fakeMarkdownToLexical),
		).toBe(false);
	});
});

describe("banner directive round trip", () => {
	it("imports back what exportBannerDirective() emits", () => {
		const bodyMarkdown = "First line.\n\nSecond line with `code`.";
		const fields = { type: "warning", body: { markdown: bodyMarkdown } };

		const directive = exportBannerDirective(fields, fakeLexicalToMarkdown);

		expect(directive).not.toBe(false);

		const { openMatch, children } = parseExportedBanner(directive as string);

		expect(
			importBannerDirective(openMatch, children, fakeMarkdownToLexical),
		).toEqual({
			type: "warning",
			body: fakeMarkdownToLexical({ markdown: bodyMarkdown }),
		});
	});
});
