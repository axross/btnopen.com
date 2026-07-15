import { describe, expect, it } from "@jest/globals";
import {
	embedBlock,
	exportEmbedDirective,
	importEmbedDirective,
	validateEmbedUrl,
} from "./embed-block";

function matchDirectiveLine(line: string): RegExpMatchArray | undefined {
	const startRegex = embedBlock.jsx?.customStartRegex;

	if (startRegex === undefined) {
		throw new Error("The embed block must define a custom start regex.");
	}

	return startRegex.exec(line) ?? undefined;
}

describe("validateEmbedUrl()", () => {
	it("accepts an https URL", () => {
		expect(validateEmbedUrl("https://example.com/article")).toBe(true);
	});

	it("accepts an http URL", () => {
		expect(validateEmbedUrl("http://example.com")).toBe(true);
	});

	it("rejects an empty or missing value", () => {
		expect(validateEmbedUrl("")).not.toBe(true);
		expect(validateEmbedUrl(null)).not.toBe(true);
		expect(validateEmbedUrl(undefined)).not.toBe(true);
	});

	it("rejects a non-URL string", () => {
		expect(validateEmbedUrl("not a url")).not.toBe(true);
	});

	it("rejects a non-http(s) protocol", () => {
		expect(validateEmbedUrl("javascript:alert(1)")).not.toBe(true);
		expect(validateEmbedUrl("ftp://example.com")).not.toBe(true);
	});
});

describe("exportEmbedDirective()", () => {
	it("emits a single directive line with url and type", () => {
		expect(
			exportEmbedDirective({
				url: "https://example.com/article",
				type: "webpage",
				options: null,
			}),
		).toBe('::embed{url="https://example.com/article" type="webpage"}');
	});

	it("omits the options attribute when options are unset", () => {
		expect(
			exportEmbedDirective({ url: "https://example.com", type: "webpage" }),
		).not.toContain("options=");
	});

	it("emits options as single-quoted JSON when set", () => {
		expect(
			exportEmbedDirective({
				url: "https://example.com",
				type: "webpage",
				options: { maxWidth: 480 },
			}),
		).toBe(
			'::embed{url="https://example.com" type="webpage" options=\'{"maxWidth":480}\'}',
		);
	});

	it("escapes single quotes inside options so the attribute stays parseable", () => {
		const directive = exportEmbedDirective({
			url: "https://example.com",
			type: "webpage",
			options: { caption: "it's fine" },
		});

		expect(directive).not.toBe(false);
		expect(directive).not.toContain("it's");

		const roundTripped = importEmbedDirective(
			matchDirectiveLine(directive as string),
		);

		expect(roundTripped).toMatchObject({
			options: { caption: "it's fine" },
		});
	});

	it("falls back to the webpage type when type is missing", () => {
		expect(exportEmbedDirective({ url: "https://example.com" })).toContain(
			'type="webpage"',
		);
	});

	it("returns false when the url is missing", () => {
		expect(exportEmbedDirective({ type: "webpage" })).toBe(false);
		expect(exportEmbedDirective({ url: "" })).toBe(false);
	});
});

describe("importEmbedDirective()", () => {
	it("parses url and type from a matched directive line", () => {
		expect(
			importEmbedDirective(
				matchDirectiveLine(
					'::embed{url="https://example.com/article" type="webpage"}',
				),
			),
		).toEqual({
			url: "https://example.com/article",
			type: "webpage",
			options: null,
		});
	});

	it("parses JSON options containing braces", () => {
		expect(
			importEmbedDirective(
				matchDirectiveLine(
					'::embed{url="https://example.com" type="webpage" options=\'{"nested":{"a":1}}\'}',
				),
			),
		).toEqual({
			url: "https://example.com",
			type: "webpage",
			options: { nested: { a: 1 } },
		});
	});

	it("defaults the type to webpage when the attribute is absent", () => {
		expect(
			importEmbedDirective(matchDirectiveLine('::embed{url="https://a.dev"}')),
		).toMatchObject({ type: "webpage" });
	});

	it("degrades malformed options JSON to null", () => {
		expect(
			importEmbedDirective(
				matchDirectiveLine("::embed{url=\"https://a.dev\" options='{oops'}"),
			),
		).toMatchObject({ options: null });
	});

	it("returns false when the directive has no url", () => {
		expect(
			importEmbedDirective(matchDirectiveLine('::embed{type="webpage"}')),
		).toBe(false);
		expect(importEmbedDirective(undefined)).toBe(false);
	});

	it("round-trips what exportEmbedDirective() emits", () => {
		const fields = {
			url: "https://example.com/article",
			type: "webpage",
			options: { theme: "dark", size: { width: 640 } },
		};

		const directive = exportEmbedDirective(fields);

		expect(directive).not.toBe(false);
		expect(
			importEmbedDirective(matchDirectiveLine(directive as string)),
		).toEqual(fields);
	});
});
