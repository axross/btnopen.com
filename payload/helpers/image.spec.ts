import { beforeEach, describe, expect, it, vi } from "vitest";
import { getStaticDir, webpFormatOptions } from "./image";

/**
 * Fakes the environment barrel at the module boundary so both sides of
 * `getStaticDir()`'s Vercel Blob branch run in one spec. The subject reads the
 * token on every call rather than at module scope, so flipping this holder
 * between cases is enough and the subject needs no re-import.
 */
const runtime = vi.hoisted(() => ({ vercelBlobToken: null as string | null }));

vi.mock("./runtime", () => runtime);

beforeEach(() => {
	runtime.vercelBlobToken = null;
});

describe("getStaticDir()", () => {
	it("returns the bare collection name when a Vercel Blob token is present", () => {
		runtime.vercelBlobToken = "vercel_blob_rw_test-token";

		expect(getStaticDir("cover-images")).toBe("cover-images");
	});

	it("returns a local .data path when no Vercel Blob token is present", () => {
		expect(getStaticDir("cover-images")).toBe(".data/cover-images");
	});

	it("keeps each collection in its own directory", () => {
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
