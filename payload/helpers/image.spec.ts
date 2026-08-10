import { describe, expect, it, jest } from "@jest/globals";
import { webpFormatOptions } from "./image";

/**
 * Re-imports the module with the environment barrel faked, so both sides of
 * `getStaticDir`'s Vercel Blob branch run in one spec.
 *
 * `jest.mock()` is deliberately not used: SWC's Jest transform only hoists a
 * `jest.mock` call written against the bare global `jest`, and this project
 * imports its Jest APIs from `@jest/globals` (see `testing-conventions.md`), so
 * a hoisted mock would never be registered before the subject's own import.
 * `jest.doMock()` needs no hoisting, and the dynamic import below compiles to a
 * `require` that runs after it.
 */
async function importImageWith(vercelBlobToken: string | null) {
	jest.resetModules();
	jest.doMock("./runtime", () => ({ vercelBlobToken }));

	return import("./image");
}

describe("getStaticDir()", () => {
	it("returns the bare collection name when a Vercel Blob token is present", async () => {
		const { getStaticDir } = await importImageWith("vercel_blob_rw_test-token");

		expect(getStaticDir("cover-images")).toBe("cover-images");
	});

	it("returns a local .data path when no Vercel Blob token is present", async () => {
		const { getStaticDir } = await importImageWith(null);

		expect(getStaticDir("cover-images")).toBe(".data/cover-images");
	});

	it("keeps each collection in its own directory", async () => {
		const { getStaticDir } = await importImageWith(null);

		expect(getStaticDir("media")).toBe(".data/media");
		expect(getStaticDir("avatar-images")).toBe(".data/avatar-images");
	});
});

describe("webpFormatOptions", () => {
	it("encodes uploads as webp", () => {
		expect(webpFormatOptions.format).toBe("webp");
	});

	it("carries the lossy encoder settings uploads are stored with", () => {
		expect(webpFormatOptions.options).toEqual({
			quality: 90,
			smartSubsample: true,
			smartDeblock: true,
			effort: 4,
		});
	});
});
