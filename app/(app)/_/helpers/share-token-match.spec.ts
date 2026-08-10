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
});
