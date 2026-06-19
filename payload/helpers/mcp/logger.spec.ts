import { describe, expect, it } from "@jest/globals";
import { mcpLogger } from "./logger";

describe("mcpLogger", () => {
	it("exposes the expected logger methods", () => {
		expect(typeof mcpLogger.info).toBe("function");
		expect(typeof mcpLogger.warn).toBe("function");
		expect(typeof mcpLogger.child).toBe("function");
	});

	it("is scoped with a module binding", () => {
		expect(typeof mcpLogger.bindings().module).toBe("string");
	});
});
