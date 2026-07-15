import { describe, expect, it } from "@jest/globals";
import { shouldInvalidatePostCaches } from "./post-cache-invalidation";

describe("shouldInvalidatePostCaches()", () => {
	it("invalidates on delete", () => {
		expect(shouldInvalidatePostCaches({ operation: "delete" })).toBe(true);
	});

	it("invalidates on a non-draft publish across write operations", () => {
		for (const operation of ["create", "update", "updateByID"]) {
			expect(shouldInvalidatePostCaches({ operation, draft: false })).toBe(
				true,
			);
			expect(shouldInvalidatePostCaches({ operation })).toBe(true);
		}
	});

	it("skips draft and autosave writes across write operations", () => {
		for (const operation of ["create", "update", "updateByID"]) {
			expect(shouldInvalidatePostCaches({ operation, draft: true })).toBe(
				false,
			);
		}
	});

	it("skips read-only operations", () => {
		for (const operation of ["find", "findByID", "count"]) {
			expect(shouldInvalidatePostCaches({ operation })).toBe(false);
		}
	});
});
