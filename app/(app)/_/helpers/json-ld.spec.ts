import { describe, expect, it } from "vitest";
import { serializeJsonLd } from "./json-ld";

const markupDelimiterPattern = /[<>&]/;

describe("serializeJsonLd()", () => {
	it("escapes a closing script tag so it cannot terminate the element", () => {
		const serialized = serializeJsonLd({
			name: "</script><img src=x onerror=alert(1)>",
		});

		expect(serialized).not.toContain("</script>");
		expect(serialized).toBe(
			'{"name":"\\u003c/script\\u003e\\u003cimg src=x onerror=alert(1)\\u003e"}',
		);
	});

	it("escapes a comment opener", () => {
		expect(serializeJsonLd({ name: "<!--" })).toBe('{"name":"\\u003c!--"}');
	});

	it("escapes a lone ampersand", () => {
		expect(serializeJsonLd({ name: "Q&A" })).toBe('{"name":"Q\\u0026A"}');
	});

	it("leaves no literal markup delimiter anywhere in the output", () => {
		const serialized = serializeJsonLd({
			"@context": "https://schema.org",
			name: "<b>&</b>",
			description: "a > b && b < c",
		});

		expect(serialized).not.toMatch(markupDelimiterPattern);
	});

	it("round-trips back to the input value", () => {
		const payload = {
			"@context": "https://schema.org",
			"@type": "BlogPosting",
			name: "</script><img src=x onerror=alert(1)>",
			description: "<!-- a > b && b < c -->",
			author: { "@type": "Person", name: "Q&A <script>" },
		};

		expect(JSON.parse(serializeJsonLd(payload))).toEqual(payload);
	});

	it("leaves a payload with no markup delimiter untouched", () => {
		const payload = { "@type": "Blog", name: "btnopen.com" };

		expect(serializeJsonLd(payload)).toBe(JSON.stringify(payload));
	});
});
