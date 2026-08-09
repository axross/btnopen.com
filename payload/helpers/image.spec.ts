import { describe, expect, it, jest } from "@jest/globals";
import { createPngImageSize, webpFormatOptions } from "./image";

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

describe("createPngImageSize()", () => {
	it("derives the size name from the width when no name is given", () => {
		expect(createPngImageSize({ width: 640 })).toMatchObject({
			name: "640w",
			width: 640,
		});
	});

	it("uses the given name, leaving the width unset", () => {
		expect(createPngImageSize({ name: "thumbnail" })).toMatchObject({
			name: "thumbnail",
			width: undefined,
		});
	});

	it("prefers an explicit name over the width-derived one", () => {
		expect(
			createPngImageSize({ name: "open-graph", width: 1200, height: 630 }),
		).toMatchObject({ name: "open-graph", width: 1200, height: 630 });
	});

	it("crops from the centre without enlarging a smaller original", () => {
		expect(createPngImageSize({ width: 640 })).toMatchObject({
			fit: "cover",
			position: "center",
			withoutEnlargement: true,
		});
	});

	it("encodes the size as lossless png", () => {
		expect(createPngImageSize({ width: 640 }).formatOptions).toEqual({
			format: "png",
			options: {
				quality: 100,
				smartSubsample: true,
				smartDeblock: true,
				effort: 4,
			},
		});
	});

	it("names the generated file after the original, the size, and the extension", () => {
		const { generateImageName } = createPngImageSize({ width: 640 });

		expect(
			generateImageName?.({
				originalName: "portrait",
				sizeName: "640w",
				extension: "png",
				width: 640,
				height: 640,
			}),
		).toBe("portrait-640w.png");
	});
});
