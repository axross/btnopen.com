// biome-ignore-all lint/style/noMagicNumbers: byte fixtures are intrinsic to encoding tests
import { describe, expect, it } from "@jest/globals";
import { decodeHtml } from "./webembed-html";

// "こんにちは" in Shift_JIS — Node's TextEncoder only emits UTF-8, so
// non-UTF-8 fixtures are precomputed byte literals
const shiftJisKonnichiwa = [
	0x82, 0xb1, 0x82, 0xf1, 0x82, 0xc9, 0x82, 0xbf, 0x82, 0xcd,
];

// "こんにちは" in EUC-JP
const eucJpKonnichiwa = [
	0xa4, 0xb3, 0xa4, 0xf3, 0xa4, 0xcb, 0xa4, 0xc1, 0xa4, 0xcf,
];

/**
 * Concatenates ASCII markup strings and raw byte runs into one HTML body
 * buffer, so fixtures can mix readable markup with precomputed non-UTF-8
 * bytes.
 */
function buildBody(...parts: (string | number[])[]): ArrayBuffer {
	const bytes = parts.flatMap((part) =>
		typeof part === "string" ? [...new TextEncoder().encode(part)] : part,
	);

	return new Uint8Array(bytes).buffer;
}

describe("decodeHtml()", () => {
	it("decodes with the Content-Type header's charset parameter", () => {
		const body = buildBody(
			"<html><head><title>",
			shiftJisKonnichiwa,
			"</title></head></html>",
		);

		const result = decodeHtml(body, "text/html; charset=Shift_JIS");

		expect(result.html).toContain("<title>こんにちは</title>");
		expect(result.encoding).toBe("shift_jis");
	});

	it("decodes with a quoted charset parameter", () => {
		const body = buildBody("<p>", eucJpKonnichiwa, "</p>");

		const result = decodeHtml(body, 'text/html; charset="euc-jp"');

		expect(result.html).toContain("<p>こんにちは</p>");
		expect(result.encoding).toBe("euc-jp");
	});

	it("sniffs a <meta charset> declaration when the header has no charset", () => {
		const body = buildBody(
			'<html><head><meta charset="shift_jis"><title>',
			shiftJisKonnichiwa,
			"</title></head></html>",
		);

		const result = decodeHtml(body, "text/html");

		expect(result.html).toContain("<title>こんにちは</title>");
		expect(result.encoding).toBe("shift_jis");
	});

	it("sniffs a <meta http-equiv> content-type declaration", () => {
		const body = buildBody(
			'<html><head><meta http-equiv="Content-Type" content="text/html; charset=euc-jp"><title>',
			eucJpKonnichiwa,
			"</title></head></html>",
		);

		const result = decodeHtml(body, null);

		expect(result.html).toContain("<title>こんにちは</title>");
		expect(result.encoding).toBe("euc-jp");
	});

	it("prefers the header charset over a conflicting <meta> declaration", () => {
		const body = buildBody(
			'<html><head><meta charset="euc-jp"><title>',
			shiftJisKonnichiwa,
			"</title></head></html>",
		);

		const result = decodeHtml(body, "text/html; charset=shift_jis");

		expect(result.html).toContain("<title>こんにちは</title>");
		expect(result.encoding).toBe("shift_jis");
	});

	it("prefers a byte-order mark over a conflicting header charset", () => {
		const utf8Bom = [0xef, 0xbb, 0xbf];
		const body = buildBody(utf8Bom, "<title>こんにちは</title>");

		const result = decodeHtml(body, "text/html; charset=shift_jis");

		expect(result.html).toBe("<title>こんにちは</title>");
		expect(result.encoding).toBe("utf-8");
	});

	it("falls back through an unknown charset label to the next source", () => {
		const body = buildBody(
			'<html><head><meta charset="shift_jis"><title>',
			shiftJisKonnichiwa,
			"</title></head></html>",
		);

		const result = decodeHtml(body, "text/html; charset=not-a-charset");

		expect(result.html).toContain("<title>こんにちは</title>");
		expect(result.encoding).toBe("shift_jis");
	});

	it("defaults to UTF-8 when nothing declares an encoding", () => {
		const body = buildBody("<title>こんにちは</title>");

		const result = decodeHtml(body, null);

		expect(result.html).toBe("<title>こんにちは</title>");
		expect(result.encoding).toBe("utf-8");
	});

	it("ignores a <meta> declaration beyond the first 1024 bytes", () => {
		const body = buildBody(
			`<html><head>${"<!-- padding -->".repeat(64)}<meta charset="shift_jis"><title>`,
			shiftJisKonnichiwa,
			"</title></head></html>",
		);

		const result = decodeHtml(body, "text/html");

		expect(result.encoding).toBe("utf-8");
		expect(result.html).not.toContain("こんにちは");
	});
});
