import { describe, expect, it } from "vitest";
import { timingSafeEqual } from "./timing-safe-equal";

describe("timingSafeEqual()", () => {
	it("accepts two equal strings", () => {
		expect(timingSafeEqual("s3cret-token", "s3cret-token")).toBe(true);
	});

	it("rejects two different strings of the same length", () => {
		expect(timingSafeEqual("s3cret-token", "s3cret-tokeN")).toBe(false);
	});

	it("rejects two strings differing only in their first character", () => {
		expect(timingSafeEqual("abcdef", "Abcdef")).toBe(false);
	});

	it("rejects strings of different lengths", () => {
		expect(timingSafeEqual("token", "token-longer")).toBe(false);
	});

	it("rejects a string compared against the empty string", () => {
		expect(timingSafeEqual("token", "")).toBe(false);
		expect(timingSafeEqual("", "token")).toBe(false);
	});

	it("accepts two empty strings, leaving emptiness for the caller to reject", () => {
		expect(timingSafeEqual("", "")).toBe(true);
	});
});
