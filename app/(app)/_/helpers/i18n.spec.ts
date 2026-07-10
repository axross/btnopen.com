import { describe, expect, it } from "@jest/globals";
import { negotiateLocale } from "./i18n";

describe("negotiateLocale()", () => {
	describe("cookie precedence", () => {
		it("returns the cookie locale when it is a supported value", () => {
			expect(
				negotiateLocale({ cookieValue: "en-US", acceptLanguage: null }),
			).toBe("en-US");
		});

		it("lets a valid cookie override the Accept-Language header", () => {
			expect(
				negotiateLocale({
					cookieValue: "en-US",
					acceptLanguage: "ja-JP,ja;q=0.9",
				}),
			).toBe("en-US");
		});

		it("ignores an unsupported cookie value and falls back to the header", () => {
			expect(
				negotiateLocale({ cookieValue: "fr-FR", acceptLanguage: "en-US" }),
			).toBe("en-US");
		});
	});

	describe("Accept-Language matching", () => {
		it("matches a full locale tag", () => {
			expect(
				negotiateLocale({ cookieValue: null, acceptLanguage: "en-US" }),
			).toBe("en-US");
		});

		it("matches on the primary language subtag", () => {
			expect(negotiateLocale({ acceptLanguage: "en" })).toBe("en-US");
			expect(negotiateLocale({ acceptLanguage: "ja" })).toBe("ja-JP");
		});

		it("honours quality values when ranking entries", () => {
			expect(
				negotiateLocale({ acceptLanguage: "en-US;q=0.7, ja-JP;q=0.9" }),
			).toBe("ja-JP");
			expect(negotiateLocale({ acceptLanguage: "ja;q=0.5, en;q=0.8" })).toBe(
				"en-US",
			);
		});

		it("skips unsupported languages and picks the best supported one", () => {
			expect(
				negotiateLocale({
					acceptLanguage: "fr-FR, de;q=0.9, en-US;q=0.8, ja;q=0.5",
				}),
			).toBe("en-US");
		});

		it("ignores entries with a zero quality value", () => {
			expect(negotiateLocale({ acceptLanguage: "en;q=0, ja-JP;q=0.4" })).toBe(
				"ja-JP",
			);
		});
	});

	describe("default fallback", () => {
		it("falls back to Japanese when nothing is provided", () => {
			expect(negotiateLocale({})).toBe("ja-JP");
		});

		it("falls back to Japanese when the header has no supported locale", () => {
			expect(negotiateLocale({ acceptLanguage: "fr-FR,de;q=0.9" })).toBe(
				"ja-JP",
			);
		});

		it("falls back to Japanese for an empty header", () => {
			expect(
				negotiateLocale({ cookieValue: undefined, acceptLanguage: "" }),
			).toBe("ja-JP");
		});
	});
});
