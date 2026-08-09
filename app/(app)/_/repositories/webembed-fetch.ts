// the embedded page is an arbitrary third-party host named in CMS-authored
// markdown, so its response is treated as hostile input: it may never stall a
// render nor buffer without limit, and it may never steer the request itself
// somewhere the server was not willing to go.

import { assertFetchableUrl, type FetchableUrlOptions } from "./webembed-host";

/** How long the outbound HTML fetch may take before it is abandoned. */
export const fetchTimeoutMs = 5000;

/** How many redirects one embed fetch may follow before it is abandoned. */
export const maxRedirectHops = 5;

/**
 * Upper bound on the HTML one embed may read into memory. Only the document's
 * head matters for metadata, so this is generous for any real page.
 */
// biome-ignore lint/style/noMagicNumbers: the byte arithmetic is the constant's meaning
export const maxHtmlByteLength = 2 * 1024 * 1024;

/** Thrown when a response exceeds {@link maxHtmlByteLength}. */
export class ResponseTooLargeError extends Error {
	constructor(byteLength: number, maxByteLength: number) {
		super(
			`Response body exceeded the ${maxByteLength}-byte limit (read at least ${byteLength} bytes).`,
		);

		this.name = "ResponseTooLargeError";
	}
}

/** Thrown when a redirect chain exceeds {@link maxRedirectHops}. */
export class TooManyRedirectsError extends Error {
	constructor(url: string, maxHops: number) {
		super(`Fetching ${url} exceeded the ${maxHops}-redirect limit.`);

		this.name = "TooManyRedirectsError";
	}
}

// biome-ignore lint/style/noMagicNumbers: an HTTP status code is its own name
const redirectStatuses = new Set([301, 302, 303, 307, 308]);

export interface PermittedFetchResult {
	response: Response;
	/**
	 * Where the response was actually read from. A shortener or a canonical
	 * redirect makes this differ from the authored URL, which is why the caller
	 * gets it rather than reading `response.url`: with manual redirects that
	 * property only ever reports the last request this function chose to make.
	 */
	url: string;
	/** Whether the chain passed through at least one redirect. */
	isRedirected: boolean;
}

/**
 * Fetches `url`, following redirects one hop at a time and re-checking every
 * destination through {@link assertFetchableUrl} before the request for it
 * leaves.
 *
 * Redirects are followed deliberately — an embedded link is often a shortener
 * or a canonical redirect, and the metadata wanted is the destination's — but
 * never by the platform: `redirect: "follow"` would issue the request to the
 * redirect target before anything could refuse it, and by the time
 * `response.url` could be read that request has already happened.
 *
 * @throws {BlockedHostError} when the URL, or any redirect target, names a
 * destination this server must not fetch.
 * @throws {TooManyRedirectsError} when the chain exceeds
 * {@link maxRedirectHops}.
 */
export async function fetchPermittedUrl(
	url: string,
	options: FetchableUrlOptions = {},
): Promise<PermittedFetchResult> {
	// one budget for the whole chain, not one per hop: a host that answers with a
	// redirect must not be able to buy itself another timeout by doing it again.
	// it stays attached to the final response, so reading that body is bounded by
	// the same deadline.
	const signal = AbortSignal.timeout(fetchTimeoutMs);
	let currentUrl = url;

	for (let hop = 0; hop <= maxRedirectHops; hop += 1) {
		// biome-ignore lint/performance/noAwaitInLoops: a redirect chain is inherently sequential — the next destination is only known once the previous hop has answered
		await assertFetchableUrl(currentUrl, options);

		const response = await fetch(currentUrl, { redirect: "manual", signal });
		const location = redirectStatuses.has(response.status)
			? response.headers.get("location")
			: null;

		if (location === null) {
			return { response, url: currentUrl, isRedirected: hop > 0 };
		}

		// nothing wants a redirect's own body, so release the connection here
		// rather than leaving it dangling for the rest of the chain.
		await response.body?.cancel();

		currentUrl = new URL(location, currentUrl).toString();
	}

	throw new TooManyRedirectsError(url, maxRedirectHops);
}

function parseContentLength(header: string | null): number | null {
	if (header === null) {
		return null;
	}

	const parsed = Number(header);

	return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : null;
}

/**
 * Reads a response body into an `ArrayBuffer`, refusing to buffer more than
 * `maxByteLength` bytes. A `Content-Length` above the bound is rejected before
 * anything is read; a body that overruns the bound while streaming (or that
 * understated its length) is abandoned as soon as it does.
 *
 * @throws {ResponseTooLargeError} when the body exceeds `maxByteLength`.
 */
export async function readBoundedArrayBuffer(
	response: Response,
	maxByteLength: number = maxHtmlByteLength,
): Promise<ArrayBuffer> {
	const declaredLength = parseContentLength(
		response.headers.get("content-length"),
	);

	if (declaredLength !== null && declaredLength > maxByteLength) {
		// nothing has been read yet, so release the connection rather than
		// leaving the body dangling.
		await response.body?.cancel();

		throw new ResponseTooLargeError(declaredLength, maxByteLength);
	}

	if (!response.body) {
		return new ArrayBuffer(0);
	}

	const reader = response.body.getReader();
	const chunks: Uint8Array[] = [];
	let byteLength = 0;

	try {
		while (true) {
			// biome-ignore lint/performance/noAwaitInLoops: reading a stream is inherently sequential — the point is to stop before the whole body is buffered
			const { done, value } = await reader.read();

			if (done) {
				break;
			}

			byteLength += value.byteLength;

			if (byteLength > maxByteLength) {
				throw new ResponseTooLargeError(byteLength, maxByteLength);
			}

			chunks.push(value);
		}
	} finally {
		// cancel() on an already-drained stream is a no-op, so this covers both
		// the overrun and the normal completion path.
		await reader.cancel().catch(() => {
			// the body is already gone; there is nothing left to release.
		});
	}

	const body = new Uint8Array(byteLength);
	let offset = 0;

	for (const chunk of chunks) {
		body.set(chunk, offset);

		offset += chunk.byteLength;
	}

	return body.buffer;
}
