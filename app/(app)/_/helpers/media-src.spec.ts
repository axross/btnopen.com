import { describe, expect, it } from "@jest/globals";
import { resolveMediaId } from "./media-src";

const mediaId = "019d1223-94d4-754c-8f57-47337be15c9e";

describe("resolveMediaId()", () => {
	it("extracts the id from a flat production src", () => {
		expect(resolveMediaId(`/api/media/file/${mediaId}.webp`)).toBe(mediaId);
	});

	it("extracts the id from a preview src carrying the blob-namespace query", () => {
		expect(
			resolveMediaId(`/api/media/file/${mediaId}.webp?prefix=pr-107`),
		).toBe(mediaId);
	});

	it("accepts an empty blob-namespace value", () => {
		expect(resolveMediaId(`/api/media/file/${mediaId}.webp?prefix=`)).toBe(
			mediaId,
		);
	});

	it("returns null for a query other than the blob namespace", () => {
		expect(
			resolveMediaId(`/api/media/file/${mediaId}.webp?width=100`),
		).toBeNull();
	});

	it("returns null when extra parameters follow the blob namespace", () => {
		expect(
			resolveMediaId(`/api/media/file/${mediaId}.webp?prefix=pr-107&x=1`),
		).toBeNull();
	});

	it("returns null for a non-media upload src", () => {
		expect(resolveMediaId(`/api/cover-images/file/${mediaId}.webp`)).toBeNull();
	});

	it("returns null for a src without a media id", () => {
		expect(resolveMediaId("/api/media/file/not-a-uuid.webp")).toBeNull();
	});

	it("returns null for an absolute URL", () => {
		expect(
			resolveMediaId(`https://example.com/api/media/file/${mediaId}.webp`),
		).toBeNull();
	});
});
