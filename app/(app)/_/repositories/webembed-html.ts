// byte-order marks per the WHATWG Encoding standard; a BOM outranks every
// other encoding declaration when sniffing
// biome-ignore lint/style/noMagicNumbers: the BOM byte sequence is the constant's meaning
const utf8Bom = [0xef, 0xbb, 0xbf];
// biome-ignore lint/style/noMagicNumbers: the BOM byte sequence is the constant's meaning
const utf16BeBom = [0xfe, 0xff];
// biome-ignore lint/style/noMagicNumbers: the BOM byte sequence is the constant's meaning
const utf16LeBom = [0xff, 0xfe];

// the HTML standard's encoding-sniffing algorithm only inspects a bounded
// prefix of the document for <meta> declarations
const metaScanByteLength = 1024;

const contentTypeCharsetPattern =
	/charset\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s;]+))/i;

// matches both <meta charset="..."> and the charset parameter inside
// <meta http-equiv="Content-Type" content="text/html; charset=...">
const metaCharsetPattern = /<meta[^>]+charset\s*=\s*["']?([^"'\s;/>]+)/i;

interface DecodedHtml {
	html: string;
	encoding: string;
}

function startsWithBytes(bytes: Uint8Array, prefix: number[]): boolean {
	return prefix.every((byte, index) => bytes[index] === byte);
}

function sniffBomEncoding(bytes: Uint8Array): string | null {
	if (startsWithBytes(bytes, utf8Bom)) {
		return "utf-8";
	}

	if (startsWithBytes(bytes, utf16BeBom)) {
		return "utf-16be";
	}

	if (startsWithBytes(bytes, utf16LeBom)) {
		return "utf-16le";
	}

	return null;
}

function parseContentTypeCharset(contentType: string | null): string | null {
	if (contentType === null) {
		return null;
	}

	const match = contentType.match(contentTypeCharsetPattern);

	return match?.[1] ?? match?.[2] ?? match?.[3] ?? null;
}

function sniffMetaCharset(bytes: Uint8Array): string | null {
	// the scanned prefix is decoded as latin1 so every byte maps to a
	// character; the markup we look for is ASCII in any ASCII-compatible
	// encoding
	const head = new TextDecoder("latin1").decode(
		bytes.subarray(0, metaScanByteLength),
	);

	return head.match(metaCharsetPattern)?.[1] ?? null;
}

function createDecoder(label: string | null): TextDecoder | null {
	if (label === null) {
		return null;
	}

	try {
		return new TextDecoder(label);
	} catch {
		// TextDecoder throws a RangeError for labels the WHATWG Encoding
		// standard does not define; skip them and consult the next source
		return null;
	}
}

/**
 * Decodes a fetched HTML document from its raw bytes using the encoding the
 * document declares, instead of assuming UTF-8 the way `Response.text()`
 * does. The encoding is resolved in the HTML standard's sniffing precedence:
 * a byte-order mark, then the `Content-Type` header's `charset` parameter,
 * then a `<meta>` charset declaration within the first 1024 bytes, then
 * UTF-8. A declared label the WHATWG Encoding standard does not define is
 * skipped in favor of the next source. The returned `encoding` is the
 * canonical name of the encoding actually used.
 */
export function decodeHtml(
	body: ArrayBuffer,
	contentType: string | null,
): DecodedHtml {
	const bytes = new Uint8Array(body);
	const decoder =
		createDecoder(sniffBomEncoding(bytes)) ??
		createDecoder(parseContentTypeCharset(contentType)) ??
		createDecoder(sniffMetaCharset(bytes)) ??
		new TextDecoder();

	return { html: decoder.decode(body), encoding: decoder.encoding };
}
