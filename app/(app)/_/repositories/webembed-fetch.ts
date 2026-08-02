// the embedded page is an arbitrary third-party host named in CMS-authored
// markdown, so its response is treated as hostile input: it may never stall a
// render nor buffer without limit.

/** How long the outbound HTML fetch may take before it is abandoned. */
export const fetchTimeoutMs = 5000;

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
