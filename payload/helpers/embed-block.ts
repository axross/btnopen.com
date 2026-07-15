import type { Block } from "payload";

/**
 * The embed type the block falls back to when the markdown directive omits a
 * `type` attribute. Also the select field's default for newly inserted blocks.
 */
export const defaultEmbedType = "webpage";

/**
 * Validates that an embed URL is a well-formed `http:`/`https:` URL. Runs
 * isomorphically as the `url` field's Payload validation, so it must stay free
 * of server-only APIs.
 */
export function validateEmbedUrl(
	value: null | string | undefined,
): string | true {
	if (typeof value !== "string" || value.length === 0) {
		return "URL is required.";
	}

	if (!URL.canParse(value)) {
		return "Must be a valid http:// or https:// URL.";
	}

	const { protocol } = new URL(value);

	if (protocol !== "http:" && protocol !== "https:") {
		return "Must be a valid http:// or https:// URL.";
	}

	return true;
}

/**
 * Serializes embed block fields into a single markdown leaf-directive line,
 * e.g. `::embed{url="https://example.com" type="webpage"}`. The `options`
 * attribute is emitted only when options are set. Returns `false` (no markdown
 * output) when the block has no usable URL.
 */
export function exportEmbedDirective(
	fields: Record<string, unknown>,
): string | false {
	const url = typeof fields.url === "string" ? fields.url : "";

	if (url.length === 0) {
		return false;
	}

	const type =
		typeof fields.type === "string" && fields.type.length > 0
			? fields.type
			: defaultEmbedType;

	const attributes = [
		// URLs never legitimately contain a raw double quote; percent-encoding a
		// stray one keeps the double-quoted attribute well-formed.
		`url="${url.replaceAll('"', "%22")}"`,
		`type="${type}"`,
	];

	if (fields.options !== null && fields.options !== undefined) {
		// JSON.stringify only ever emits double quotes; re-escaping single quotes
		// as ' keeps the value valid JSON while never colliding with the
		// single-quoted attribute delimiters.
		const serializedOptions = JSON.stringify(fields.options).replaceAll(
			"'",
			"\\u0027",
		);

		attributes.push(`options='${serializedOptions}'`);
	}

	return `::embed{${attributes.join(" ")}}`;
}

/**
 * Parses the attribute string captured from an `::embed{…}` markdown directive
 * line back into embed block fields (JSON-parsing `options`). Returns `false`
 * (leave the line as plain text) when the directive carries no URL.
 */
export function importEmbedDirective(
	openMatch: RegExpMatchArray | undefined,
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

	const url = attributes.url ?? "";

	if (url.length === 0) {
		return false;
	}

	let options: unknown = null;

	if (attributes.options !== undefined) {
		try {
			options = JSON.parse(attributes.options);
		} catch {
			// a malformed options payload degrades to null rather than aborting the
			// whole markdown import.
			options = null;
		}
	}

	return {
		url,
		type: attributes.type ?? defaultEmbedType,
		options,
	};
}

/**
 * The `embed` rich-text block for blog post bodies: an explicit, typed web
 * embed with a URL, an embed type (only "webpage" today), and per-type JSON
 * options. The `jsx` converter round-trips the block through markdown as a
 * `::embed{…}` leaf-directive line — without it, `convertLexicalToMarkdown`
 * would silently drop the block.
 */
export const embedBlock: Block = {
	slug: "embed",
	labels: {
		singular: "Embed",
		plural: "Embeds",
	},
	admin: {
		components: {
			// biome-ignore lint/style/useNamingConvention: follow the API of Payload block admin components
			Block: "/payload/components/embed-block-card#EmbedBlockCard",
		},
	},
	fields: [
		{
			name: "url",
			type: "text",
			required: true,
			validate: validateEmbedUrl,
		},
		{
			name: "type",
			type: "select",
			required: true,
			defaultValue: defaultEmbedType,
			options: [{ label: "Web Page", value: "webpage" }],
		},
		{
			name: "options",
			type: "json",
			admin: {
				description:
					"Embedding options for the selected type. Ignored for Web Page; reserved for future embed types.",
			},
		},
	],
	jsx: {
		// the whole leaf directive lives on one line; the greedy group captures
		// everything between the outermost braces so JSON option values containing
		// "}" still match.
		customStartRegex: /^[ \t]*::embed\{(.*)\}[ \t]*$/,
		customEndRegex: {
			optional: true,
			regExp: /\}[ \t]*$/,
		},
		export: ({ fields }) => exportEmbedDirective(fields),
		import: ({ openMatch }) => importEmbedDirective(openMatch),
	},
};
