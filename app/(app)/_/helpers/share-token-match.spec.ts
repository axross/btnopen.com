import { describe, expect, it } from "vitest";
import { matchesShareToken } from "./share-token-match";

const storedToken = "pnryCl0emXnq8uYvQGiGKTgwg2NYZ_fQf6o3KPhbXSA";

describe("matchesShareToken()", () => {
	it("accepts a supplied token equal to the stored one", () => {
		expect(
			matchesShareToken({ supplied: storedToken, stored: storedToken }),
		).toBe(true);
	});

	it("rejects a supplied token that differs in one character", () => {
		expect(
			matchesShareToken({
				supplied: `${storedToken.slice(0, -1)}b`,
				stored: storedToken,
			}),
		).toBe(false);
	});

	it("rejects a supplied token of a different length", () => {
		expect(
			matchesShareToken({
				supplied: storedToken.slice(0, -1),
				stored: storedToken,
			}),
		).toBe(false);
	});

	it("rejects an absent supplied token", () => {
		expect(
			matchesShareToken({ supplied: undefined, stored: storedToken }),
		).toBe(false);
		expect(matchesShareToken({ supplied: null, stored: storedToken })).toBe(
			false,
		);
	});

	it("rejects an empty supplied token", () => {
		expect(matchesShareToken({ supplied: "", stored: storedToken })).toBe(
			false,
		);
	});

	it("rejects every supplied token when the post has no stored token", () => {
		expect(matchesShareToken({ supplied: storedToken, stored: null })).toBe(
			false,
		);
		expect(
			matchesShareToken({ supplied: storedToken, stored: undefined }),
		).toBe(false);
		expect(matchesShareToken({ supplied: storedToken, stored: "" })).toBe(
			false,
		);
	});

	it("rejects an empty supplied token against an empty stored token", () => {
		expect(matchesShareToken({ supplied: "", stored: "" })).toBe(false);
	});

	// Next.js hands back an array for a repeated search parameter, and an array of
	// the stored token's length passes a length guard while having no
	// `charCodeAt`. Repeating `token` is something any anonymous visitor can do,
	// and every minted token is the same length, so this row is the difference
	// between a rejection and a 500 on the post page.
	it("rejects an array of the stored token's length", () => {
		expect(
			matchesShareToken({
				supplied: Array.from({ length: storedToken.length }, () => "a"),
				stored: storedToken,
			}),
		).toBe(false);
	});

	it("rejects a supplied value that is not a string", () => {
		const aNumber = 42;

		for (const supplied of [
			aNumber,
			true,
			{},
			[],
			["a"],
			Symbol("a"),
			() => "a",
		]) {
			expect(matchesShareToken({ supplied, stored: storedToken })).toBe(false);
		}
	});
});
