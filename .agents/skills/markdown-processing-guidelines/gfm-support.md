# GFM Support

- The project uses a **partial** GFM implementation via `remarkPartialGfm` — only strikethrough and tables are supported.
- MUST NOT replace `remarkPartialGfm` with the full `remark-gfm` plugin unless all GFM features (autolinks, footnotes, task lists, etc.) are explicitly needed and tested.

## Three-Level Registration

When adding new GFM features, MUST register them at all three levels in `remarkPartialGfm`:

1. **Micromark extension** (`data.micromarkExtensions`) — tokenizer that recognizes the syntax during parsing. Example: `gfmTable()` from `micromark-extension-gfm-table`.
2. **MDAST fromMarkdown extension** (`data.fromMarkdownExtensions`) — converts micromark tokens into MDAST nodes. Example: `gfmTableFromMarkdown()` from `mdast-util-gfm-table`.
3. **HTML extension** (`data.toMarkdownExtensions`) — serializes back to HTML (used for markdown-to-HTML output). Example: `gfmTableHtml()` from `micromark-extension-gfm-table`.

All three MUST be registered together via `combineExtensions` / `combineHtmlExtensions`. Missing any level will cause parsing failures or silent data loss.

## Standard MDAST Nodes vs Custom Nodes

GFM table nodes (`table`, `tableRow`, `tableCell`) are **standard MDAST node types** with built-in handlers in `remarkRehype` (via `mdast-util-to-hast`). They do NOT need `passThrough` or custom `handlers` registration — unlike custom directive nodes (e.g., `webembed`) which require explicit registration. See [custom-mdast-node-types.md](./custom-mdast-node-types.md) for the custom node registration process.

## Current Table Rendering Gaps

Table parsing is fully wired, but the rendering layer is incomplete:

- Table-related HTML elements (`table`, `thead`, `tbody`, `tr`, `th`, `td`) are **not mapped** in `defaultComponents` in `app/(app)/_/components/markdown.tsx`. They fall back to native HTML elements without CSS module class names (see [react-component-mapping.md](./react-component-mapping.md) for fallback behavior).
- No dedicated table CSS styling exists. Tables render with only browser default styling.
- Tables are not included in the first/last-child margin reset selectors in `blog-post-content.module.css`.
