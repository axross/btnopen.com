// biome-ignore-all lint/style/noMagicNumbers: byte counts are intrinsic to size-bound tests
import { describe, expect, it } from "@jest/globals";
import {
	maxHtmlByteLength,
	ResponseTooLargeError,
	readBoundedArrayBuffer,
} from "./webembed-fetch";

/**
 * Builds a response whose body streams `chunkSizes` chunks of filler bytes,
 * optionally declaring a `Content-Length` that disagrees with what it sends.
 */
function buildResponse({
	chunkSizes,
	contentLength,
}: {
	chunkSizes: number[];
	contentLength?: string;
}): Response {
	const stream = new ReadableStream<Uint8Array>({
		start(controller) {
			for (const size of chunkSizes) {
				controller.enqueue(new Uint8Array(size).fill(0x61));
			}

			controller.close();
		},
	});

	return new Response(stream, {
		headers:
			contentLength === undefined ? {} : { "content-length": contentLength },
	});
}

describe("readBoundedArrayBuffer()", () => {
	it("reads a body that fits within the bound", async () => {
		const body = await readBoundedArrayBuffer(
			buildResponse({ chunkSizes: [4, 6] }),
			32,
		);

		expect(body.byteLength).toBe(10);
		expect(new Uint8Array(body).every((byte) => byte === 0x61)).toBe(true);
	});

	it("reads a body of exactly the bound", async () => {
		const body = await readBoundedArrayBuffer(
			buildResponse({ chunkSizes: [8, 8] }),
			16,
		);

		expect(body.byteLength).toBe(16);
	});

	it("rejects a declared Content-Length above the bound before reading", async () => {
		await expect(
			readBoundedArrayBuffer(
				buildResponse({ chunkSizes: [4], contentLength: "999" }),
				16,
			),
		).rejects.toThrow(ResponseTooLargeError);
	});

	it("abandons a body that overruns the bound while streaming", async () => {
		await expect(
			readBoundedArrayBuffer(buildResponse({ chunkSizes: [8, 8, 8] }), 16),
		).rejects.toThrow(ResponseTooLargeError);
	});

	it("abandons a body that understates its Content-Length", async () => {
		await expect(
			readBoundedArrayBuffer(
				buildResponse({ chunkSizes: [8, 8, 8], contentLength: "8" }),
				16,
			),
		).rejects.toThrow(ResponseTooLargeError);
	});

	it("ignores a malformed Content-Length and falls back to the streaming bound", async () => {
		const body = await readBoundedArrayBuffer(
			buildResponse({ chunkSizes: [4], contentLength: "not-a-number" }),
			16,
		);

		expect(body.byteLength).toBe(4);
	});

	it("returns an empty buffer for a body-less response", async () => {
		const body = await readBoundedArrayBuffer(new Response(null), 16);

		expect(body.byteLength).toBe(0);
	});

	it("defaults to the module's HTML byte bound", async () => {
		await expect(
			readBoundedArrayBuffer(
				buildResponse({
					chunkSizes: [4],
					contentLength: String(maxHtmlByteLength + 1),
				}),
			),
		).rejects.toThrow(ResponseTooLargeError);
	});
});
