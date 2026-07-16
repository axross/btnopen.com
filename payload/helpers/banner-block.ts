import { lexicalEditor } from "@payloadcms/richtext-lexical";
import type { Block } from "payload";
import {
	bannerEndRegex,
	bannerStartRegex,
	defaultBannerType,
	exportBannerDirective,
	importBannerDirective,
} from "./banner-directive";

/**
 * The `banner` rich-text block for blog post bodies: an admonition-style callout
 * carrying a `type` (only "note" / "warning" today) and a nested `body` rich
 * text. The `jsx` converter round-trips the block through markdown as a
 * `:::banner{…}:::` container directive (see `banner-directive.ts`) — without
 * it, `convertLexicalToMarkdown` would silently drop the block. The `body` uses
 * a plain `lexicalEditor()` (default features only, no `BlocksFeature`) so the
 * container fence never wraps another block/`:::` fence.
 */
export const bannerBlock: Block = {
	slug: "banner",
	labels: {
		singular: "Banner",
		plural: "Banners",
	},
	fields: [
		{
			name: "type",
			type: "select",
			required: true,
			defaultValue: defaultBannerType,
			options: [
				{ label: "Note", value: "note" },
				{ label: "Warning", value: "warning" },
			],
		},
		{
			name: "body",
			type: "richText",
			required: true,
			editor: lexicalEditor(),
		},
	],
	jsx: {
		customStartRegex: bannerStartRegex,
		customEndRegex: bannerEndRegex,
		export: ({ fields, lexicalToMarkdown }) =>
			exportBannerDirective(fields, lexicalToMarkdown),
		import: ({ openMatch, children, markdownToLexical }) =>
			importBannerDirective(openMatch, children, markdownToLexical),
	},
};
