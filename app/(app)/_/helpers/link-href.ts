/**
 * How an authored link destination may be rendered.
 *
 * - `internal` — a same-site path, anchor, or query (`/posts/x`, `#section`).
 * - `external` — an `http(s)` destination, or a protocol-relative one.
 * - `contact` — `mailto:` / `tel:`, which hand off to another app rather than
 *   opening a browsing context.
 * - `blocked` — everything else, including an empty destination. Nothing may
 *   render it as an `href`.
 */
export type LinkHrefKind = "internal" | "external" | "contact" | "blocked";

const browsableProtocols = ["http", "https"];
const contactProtocols = ["mailto", "tel"];

/**
 * Classifies a link destination so a renderer knows which anchor form to emit
 * and the markdown pipeline knows which `href` to drop.
 *
 * Nothing upstream restricts protocols: `mdast-util-to-hast`'s link handler
 * only percent-encodes the destination through `normalizeUri` and never reads
 * its scheme, so `javascript:` and `data:` arrive here intact. Payload does not
 * stop them either — its Lexical link field rejects only empty values and
 * values containing a space.
 */
export function classifyLinkHref(href: string): LinkHrefKind {
	// an empty destination navigates nowhere and would throw from Next's link
	// primitive, so it is unrenderable rather than merely relative.
	if (href === "") {
		return "blocked";
	}

	const protocol = readProtocol(href);

	if (protocol === null) {
		// a protocol-relative destination carries no scheme yet still leaves the
		// site, so it must never reach the internal-link primitive.
		return href.startsWith("//") ? "external" : "internal";
	}

	if (browsableProtocols.includes(protocol)) {
		return "external";
	}

	if (contactProtocols.includes(protocol)) {
		return "contact";
	}

	return "blocked";
}

// mirrors the scheme detection in `micromark-util-sanitize-uri`: the first `:`
// separates a scheme only when it precedes every `/`, `?`, and `#`. that
// package's own `sanitizeUri` is deliberately not reused — it also runs
// `encode()`, which turns `&` into `&amp;`. that is right for an HTML string
// compiler and wrong here, where React writes the value straight into an `href`
// and would corrupt every query string.
function readProtocol(href: string): string | null {
	const colonIndex = href.indexOf(":");

	if (colonIndex < 0) {
		return null;
	}

	for (const separator of ["/", "?", "#"]) {
		const separatorIndex = href.indexOf(separator);

		if (separatorIndex > -1 && separatorIndex < colonIndex) {
			return null;
		}
	}

	return href.slice(0, colonIndex).toLowerCase();
}
