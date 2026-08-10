// biome-ignore-all lint/style/noMagicNumbers: byte counts and HTTP status codes are intrinsic to what these tests bound
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
	fetchPermittedUrl,
	maxHtmlByteLength,
	maxRedirectHops,
	ResponseTooLargeError,
	readBoundedArrayBuffer,
	TooManyRedirectsError,
} from "./webembed-fetch";
import { BlockedHostError, type HostResolver } from "./webembed-host";

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

// the guard resolves a hostname through this seam while the real fetch resolves
// it through the OS, so a test can call one loopback server "public" and another
// "private" and still have both actually reachable. that is what lets the
// redirect cases run against a real server without touching the network.
const publicAddress = "93.184.216.34";
const privateAddress = "10.0.0.1";

/** Treats `localhost` as public and the literal loopback address as private. */
const resolveHost: HostResolver = async (hostname) =>
	hostname === "localhost" ? [publicAddress] : [privateAddress];

/** `/hops/<n>` redirects to `/hops/<n - 1>` until it runs out and serves a page. */
const hopPathPattern = /^\/hops\/(\d+)$/;

let originServer: Server;
let blockedServer: Server;
let originOrigin: string;
let blockedOrigin: string;
let blockedRequestCount = 0;

function portOf(server: Server): number {
	return (server.address() as AddressInfo).port;
}

function listen(server: Server): Promise<void> {
	return new Promise((resolve) => {
		server.listen(0, resolve);
	});
}

function close(server: Server): Promise<void> {
	return new Promise((resolve) => {
		server.close(() => {
			resolve();
		});
	});
}

beforeAll(async () => {
	blockedServer = createServer((_request, response) => {
		blockedRequestCount += 1;

		response.writeHead(200, { "content-type": "text/html" });
		response.end(
			"<html><head><title>Should never be read</title></head></html>",
		);
	});

	originServer = createServer((request, response) => {
		const path = request.url ?? "/";
		const remainingHops = hopPathPattern.exec(path)?.[1];

		if (remainingHops !== undefined && Number(remainingHops) > 0) {
			response.writeHead(302, {
				location: `/hops/${Number(remainingHops) - 1}`,
			});
			response.end("redirecting");

			return;
		}

		if (path === "/redirect-to-blocked") {
			response.writeHead(302, { location: `${blockedOrigin}/secret` });
			response.end("redirecting");

			return;
		}

		if (path === "/redirect-to-file") {
			response.writeHead(302, { location: "file:///etc/passwd" });
			response.end("redirecting");

			return;
		}

		if (path === "/redirect-without-location") {
			response.writeHead(302);
			response.end("nowhere to go");

			return;
		}

		response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
		response.end("<html><head><title>Embedded page</title></head></html>");
	});

	await listen(blockedServer);
	await listen(originServer);

	// the origin server is addressed by name and the blocked one by literal, so
	// the resolver above can tell them apart even though both are loopback.
	originOrigin = `http://localhost:${portOf(originServer)}`;
	blockedOrigin = `http://127.0.0.1:${portOf(blockedServer)}`;
});

afterAll(async () => {
	await close(originServer);
	await close(blockedServer);
});

describe("fetchPermittedUrl()", () => {
	it("returns the response from a permitted destination", async () => {
		const result = await fetchPermittedUrl(`${originOrigin}/page`, {
			resolveHost,
		});

		expect(result.response.status).toBe(200);
		expect(await result.response.text()).toContain("Embedded page");
	});

	it("reports the requested URL and no redirect when nothing redirected", async () => {
		const result = await fetchPermittedUrl(`${originOrigin}/page`, {
			resolveHost,
		});

		expect(result.url).toBe(`${originOrigin}/page`);
		expect(result.isRedirected).toBe(false);
		await result.response.body?.cancel();
	});

	it("follows a permitted redirect and reports where the body came from", async () => {
		const result = await fetchPermittedUrl(`${originOrigin}/hops/1`, {
			resolveHost,
		});

		expect(result.url).toBe(`${originOrigin}/hops/0`);
		expect(result.isRedirected).toBe(true);
		expect(await result.response.text()).toContain("Embedded page");
	});

	it("follows a chain of exactly the hop bound", async () => {
		const result = await fetchPermittedUrl(
			`${originOrigin}/hops/${maxRedirectHops}`,
			{ resolveHost },
		);

		expect(result.url).toBe(`${originOrigin}/hops/0`);
		await result.response.body?.cancel();
	});

	it("refuses a chain one hop longer than the bound", async () => {
		await expect(
			fetchPermittedUrl(`${originOrigin}/hops/${maxRedirectHops + 1}`, {
				resolveHost,
			}),
		).rejects.toThrow(TooManyRedirectsError);
	});

	it("refuses a redirect into a reserved range without requesting it", async () => {
		blockedRequestCount = 0;

		await expect(
			fetchPermittedUrl(`${originOrigin}/redirect-to-blocked`, {
				resolveHost,
			}),
		).rejects.toThrow(BlockedHostError);
		expect(blockedRequestCount).toBe(0);
	});

	it("refuses a redirect to a scheme other than http(s)", async () => {
		await expect(
			fetchPermittedUrl(`${originOrigin}/redirect-to-file`, { resolveHost }),
		).rejects.toThrow(BlockedHostError);
	});

	it("refuses a destination that is not permitted in the first place", async () => {
		blockedRequestCount = 0;

		await expect(
			fetchPermittedUrl(`${blockedOrigin}/secret`, { resolveHost }),
		).rejects.toThrow(BlockedHostError);
		expect(blockedRequestCount).toBe(0);
	});

	it("treats a redirect status without a Location header as the final response", async () => {
		const result = await fetchPermittedUrl(
			`${originOrigin}/redirect-without-location`,
			{ resolveHost },
		);

		expect(result.response.status).toBe(302);
		expect(result.isRedirected).toBe(false);
		await result.response.body?.cancel();
	});
});
