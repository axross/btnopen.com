import { describe, expect, it } from "@jest/globals";
import { isRecord } from "./records";

describe("isRecord()", () => {
	it("accepts the value when it is a plain object", () => {
		expect(isRecord({ key: "value" })).toBe(true);
	});

	it("accepts the value when it is an array", () => {
		expect(isRecord(["value"])).toBe(true);
	});

	it("rejects the value when it is null or primitive", () => {
		expect(isRecord(null)).toBe(false);
		expect(isRecord("value")).toBe(false);
		expect(isRecord(1)).toBe(false);
		expect(isRecord(undefined)).toBe(false);
		expect(isRecord(() => "value")).toBe(false);
	});
});
