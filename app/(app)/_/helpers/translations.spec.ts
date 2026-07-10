import { describe, expect, it } from "@jest/globals";
import enUS from "../translations/en-US.json" with { type: "json" };
import jaJP from "../translations/ja-JP.json" with { type: "json" };

/** Collects the dot-joined leaf key paths of a nested translation catalog. */
function collectKeyPaths(value: unknown, prefix = ""): string[] {
	if (typeof value !== "object" || value === null) {
		return [prefix];
	}

	return Object.entries(value as Record<string, unknown>)
		.flatMap(([key, nested]) =>
			collectKeyPaths(nested, prefix ? `${prefix}.${key}` : key),
		)
		.sort();
}

describe("translation catalogs", () => {
	it("expose the same set of keys in every locale", () => {
		expect(collectKeyPaths(enUS)).toEqual(collectKeyPaths(jaJP));
	});

	it("have non-empty string values in every locale", () => {
		for (const catalog of [enUS, jaJP]) {
			for (const path of collectKeyPaths(catalog)) {
				const value = path
					.split(".")
					.reduce<unknown>(
						(node, key) => (node as Record<string, unknown>)[key],
						catalog,
					);

				expect(typeof value).toBe("string");
				expect((value as string).length).toBeGreaterThan(0);
			}
		}
	});
});
