import { describe, expect, it } from "@jest/globals";
import { resolvePostReadMode } from "./post-read-mode";

describe("resolvePostReadMode()", () => {
	it("serves the draft when the caller asked for it and is permitted to read drafts", () => {
		expect(resolvePostReadMode({ requested: true, permitted: true })).toBe(
			"draft",
		);
	});

	it("serves the published document when the caller asked for a draft without permission", () => {
		expect(resolvePostReadMode({ requested: true, permitted: false })).toBe(
			"published",
		);
	});

	it("serves the published document when the caller did not ask for a draft", () => {
		expect(resolvePostReadMode({ requested: false, permitted: false })).toBe(
			"published",
		);
	});

	it("serves the published document to a permitted caller that did not ask for a draft", () => {
		expect(resolvePostReadMode({ requested: false, permitted: true })).toBe(
			"published",
		);
	});
});
