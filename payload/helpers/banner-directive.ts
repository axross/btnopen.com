/**
 * The banner block's markdown container-directive form, kept free of any
 * `@payloadcms/richtext-lexical` value imports so the converter logic stays
 * unit-testable without loading the (ESM-only) Lexical editor. The block config
 * that wires these into a Payload `Block` lives in `banner-block.ts`.
 */

/**
 * The banner type the block falls back to when the markdown directive omits a
 * `type` attribute. Also the select field's default for newly inserted blocks.
 */
export const defaultBannerType = "note";

/**
 * Matches the opening fence of a `:::banner{…}` container directive; the greedy
 * group captures the attribute string between the braces.
 */
export const bannerStartRegex = /^[ \t]*:::banner\{(.*)\}[ \t]*$/;

/** Matches the bare `:::` line that closes a banner container directive. */
export const bannerEndRegex = /^[ \t]*:::[ \t]*$/;

/**
 * Serializes banner block fields into a markdown container directive, e.g.
 *
 * ```
 * :::banner{type="note"}
 *
 * The body markdown…
 *
 * :::
 * ```
 *
 * The fenced content is the nested `body` rich text converted to markdown via
 * the parent editor's transformers (`lexicalToMarkdown`). The blank lines around
 * the body are required: `@payloadcms/richtext-lexical`'s markdown importer only
 * recognizes the container fences when the body is separated from them by blank
 * lines (adjacent lines get merged into a paragraph and the block is lost).
 * Returns `false` (no markdown output) when the block has no usable body.
 */
export function exportBannerDirective(
	fields: Record<string, unknown>,
	lexicalToMarkdown: (props: {
		editorState: Record<string, unknown>;
	}) => string,
): string | false {
	const body = fields.body;

	if (body === null || typeof body !== "object") {
		return false;
	}

	const bodyMarkdown = lexicalToMarkdown({
		editorState: body as Record<string, unknown>,
	}).trim();

	if (bodyMarkdown.length === 0) {
		return false;
	}

	// `type` is a constrained select value (no quotes or newlines), so it needs no
	// escaping inside the double-quoted attribute. An unknown future value is
	// preserved verbatim so the block stays forward-compatible.
	const type =
		typeof fields.type === "string" && fields.type.length > 0
			? fields.type
			: defaultBannerType;

	return `:::banner{type="${type}"}\n\n${bodyMarkdown}\n\n:::`;
}

/**
 * Parses a matched `:::banner{…}:::` markdown container directive back into
 * banner block fields: the `type` attribute from the opening line and the
 * `body` rich text from the fenced content (converted via the parent editor's
 * `markdownToLexical`). Returns `false` (leave the lines as plain text) when the
 * opening line carries no attribute string.
 */
export function importBannerDirective(
	openMatch: RegExpMatchArray | undefined,
	children: string,
	markdownToLexical: (props: { markdown: string }) => Record<string, unknown>,
): Record<string, unknown> | false {
	const attributeString = openMatch?.[1];

	if (typeof attributeString !== "string") {
		return false;
	}

	const attributes: Record<string, string> = {};

	for (const match of attributeString.matchAll(
		/([a-zA-Z][a-zA-Z0-9-]*)=(?:"([^"]*)"|'([^']*)')/g,
	)) {
		attributes[match[1]] = match[2] ?? match[3] ?? "";
	}

	return {
		type: attributes.type ?? defaultBannerType,
		body: markdownToLexical({ markdown: children }),
	};
}
