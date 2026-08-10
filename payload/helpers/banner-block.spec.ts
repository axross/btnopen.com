import { beforeAll, describe, expect, it, jest } from "@jest/globals";
import type { Block } from "payload";
import {
	bannerEndRegex,
	bannerStartRegex,
	defaultBannerType,
} from "./banner-directive";

/**
 * A stand-in for the parent editor's `lexicalToMarkdown`: it reads a `markdown`
 * marker off the fake editor state so the block's body handling is testable
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

function findField(block: Block, name: string) {
	return block.fields.find((field) => "name" in field && field.name === name);
}

let bannerBlock: Block;

/**
 * `banner-block.ts` pulls in `@payloadcms/richtext-lexical` for the nested
 * body's editor, which is ESM-only and irrelevant here — the subject is the
 * block's field contract and its markdown round trip, not the editor. Fake it
 * at the boundary and import the block afterwards.
 *
 * `jest.mock()` is deliberately not used: SWC's Jest transform only hoists a
 * `jest.mock` call written against the bare global `jest`, and this project
 * imports its Jest APIs from `@jest/globals` (see `testing-conventions.md`), so
 * a hoisted mock would never be registered before the subject's own import.
 * `jest.doMock()` needs no hoisting, and the dynamic import below compiles to a
 * `require` that runs after it. the module registry is deliberately not reset:
 * nothing has required the editor package yet, and a reset would hand
 * `banner-block.ts` a second copy of `banner-directive.ts`, breaking the
 * identity the fence assertions rely on.
 */
beforeAll(async () => {
	jest.doMock("@payloadcms/richtext-lexical", () => ({
		lexicalEditor: () => ({}),
	}));

	({ bannerBlock } = await import("./banner-block"));
});

describe("bannerBlock", () => {
	it("is registered under the banner slug", () => {
		expect(bannerBlock.slug).toBe("banner");
	});

	it("offers note and warning as the selectable types", () => {
		const typeField = findField(bannerBlock, "type");

		expect(JSON.stringify(typeField)).toContain('"value":"note"');
		expect(JSON.stringify(typeField)).toContain('"value":"warning"');
	});

	it("requires a type and defaults it to the directive's fallback", () => {
		expect(findField(bannerBlock, "type")).toMatchObject({
			type: "select",
			required: true,
			defaultValue: defaultBannerType,
		});
	});

	it("requires a rich-text body carrying its own editor", () => {
		const bodyField = findField(bannerBlock, "body");

		expect(bodyField).toMatchObject({ type: "richText", required: true });
		expect(bodyField).toHaveProperty("editor");
	});

	it("matches the container directive fences the markdown form uses", () => {
		expect(bannerBlock.jsx?.customStartRegex).toBe(bannerStartRegex);
		expect(bannerBlock.jsx?.customEndRegex).toBe(bannerEndRegex);
	});
});

describe("bannerBlock.jsx.export()", () => {
	it("emits a container directive wrapping the body markdown", () => {
		expect(
			bannerBlock.jsx?.export({
				fields: { type: "warning", body: { markdown: "気をつけて。" } },
				lexicalToMarkdown: fakeLexicalToMarkdown,
			}),
		).toBe(':::banner{type="warning"}\n\n気をつけて。\n\n:::');
	});

	it("emits nothing for a block with no usable body", () => {
		expect(
			bannerBlock.jsx?.export({
				fields: { type: "note", body: { markdown: "" } },
				lexicalToMarkdown: fakeLexicalToMarkdown,
			}),
		).toBe(false);
	});
});

describe("bannerBlock.jsx.import()", () => {
	it("parses the type and body out of a matched directive", () => {
		const { openMatch, children } = parseExportedBanner(
			':::banner{type="warning"}\n\n気をつけて。\n\n:::',
		);

		expect(
			bannerBlock.jsx?.import({
				openMatch,
				children,
				closeMatch: null,
				props: {},
				markdownToLexical: fakeMarkdownToLexical,
			}),
		).toEqual({
			type: "warning",
			body: { root: { markdown: "気をつけて。" } },
		});
	});

	it("falls back to the default type when the directive omits one", () => {
		const { openMatch, children } = parseExportedBanner(
			':::banner{id="x"}\n\n本文です。\n\n:::',
		);

		expect(
			bannerBlock.jsx?.import({
				openMatch,
				children,
				closeMatch: null,
				props: {},
				markdownToLexical: fakeMarkdownToLexical,
			}),
		).toMatchObject({ type: defaultBannerType });
	});

	it("round-trips what the export converter emits", () => {
		const exported = bannerBlock.jsx?.export({
			fields: { type: "note", body: { markdown: "Hello **world**." } },
			lexicalToMarkdown: fakeLexicalToMarkdown,
		});

		expect(typeof exported).toBe("string");

		const { openMatch, children } = parseExportedBanner(exported as string);

		expect(
			bannerBlock.jsx?.import({
				openMatch,
				children,
				closeMatch: null,
				props: {},
				markdownToLexical: fakeMarkdownToLexical,
			}),
		).toEqual({
			type: "note",
			body: { root: { markdown: "Hello **world**." } },
		});
	});
});
