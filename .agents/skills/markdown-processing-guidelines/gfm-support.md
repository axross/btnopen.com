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

## Table Rendering

Tables are fully rendered end-to-end. The table family (`table`, `thead`, `tbody`, `tr`, `th`, `td`) is mapped in `defaultComponents` in `app/(app)/_/components/markdown.tsx`; `table` and `th` have dedicated React components (horizontal-scroll wrapper, forced `scope="col"`) and the rest map to their native tags with CSS-module class injection. See [react-component-mapping.md › Table Family and the `tableWrapper` Sentinel](./react-component-mapping.md#table-family-and-the-tablewrapper-sentinel) for the mapping mechanics and the sentinel-key pattern.

## Column Alignment Propagation

GFM column alignment (`:---` / `:---:` / `---:`) is surfaced on the rendered DOM **as inline styles**, not as HTML attributes. MUST NOT add a rehype plugin or CSS attribute selector to translate alignment:

- `mdast-util-to-hast` emits the (deprecated) `align` attribute on `<th>` / `<td>`.
- `hast-util-to-jsx-runtime` (used internally by `rehypeReact`) converts `align` into an inline `style="text-align: left|center|right"` prop via its default `tableCellAlignToStyle: true` option.
- CSS in `blog-post-content.module.css` declares `text-align: start` as the default; the inline value wins by specificity whenever alignment is authored.

## Lexical-Side Caveats

The admin-authoring path goes through Payload Lexical's `EXPERIMENTAL_TableFeature()` (enabled explicitly in `payload/helpers/editor.ts` — it is NOT part of `defaultFeatures`). The feature self-registers a `TableMarkdownTransformer`, so `convertLexicalToMarkdown` emits GFM pipe syntax without extra wiring in `get-blog-post-markdown.ts`, and enabling it does NOT require a database migration (tables persist as Lexical node types inside the existing `body` JSON column). The following limitations apply only to content authored through the Lexical admin; hand-authored GFM markdown upstream of the pipeline is unaffected:

- **Column alignment is not authorable.** Lexical always emits `| --- |` dividers. Alignment rendering still works for any raw GFM that reaches the pipeline from other sources.
- **Merged cells (`colspan` / `rowspan`) are silently dropped** by the Lexical-to-markdown exporter. GFM has no standard for spans.
- **The `EXPERIMENTAL_` prefix is upstream API naming** (SCREAMING_SNAKE_CASE is Lexical's convention, not a project-level stylistic choice) and signals API instability across Payload 3.x minor releases. MUST pin Payload and retest the table path on upgrade.
