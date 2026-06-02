import { describe, expect, it } from "@jest/globals";
import { getErrorMessage } from "./errors";

describe("getErrorMessage()", () => {
	it("returns the message when the thrown value is an Error instance", () => {
		expect(getErrorMessage(new Error("Failed"))).toBe("Failed");
	});

	it("returns the input unchanged when the thrown value is a string", () => {
		expect(getErrorMessage("Failed")).toBe("Failed");
	});

	it("returns the fallback message when the thrown value is unknown", () => {
		expect(getErrorMessage({ message: "Hidden" })).toBe(
			"Unknown MCP tool error.",
		);
		expect(getErrorMessage(null)).toBe("Unknown MCP tool error.");
	});
});
