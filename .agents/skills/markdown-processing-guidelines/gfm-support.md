# GFM Support

GFM Support is a project prohibition: do not replace `remarkPartialGfm` with the full `remark-gfm` plugin unless all GFM features (autolinks, footnotes, task lists, etc.) are explicitly needed and tested.

- The project uses a **partial** GFM implementation via `remarkPartialGfm` — only strikethrough and tables are supported.

**Guidelines:**

- MUST NOT replace `remarkPartialGfm` with the full `remark-gfm` plugin unless all GFM features (autolinks, footnotes, task lists, etc.) are explicitly needed and tested.

## Three-Level Registration

GFM features are only safe when parsing, MDAST conversion, and serialization are wired together in `remarkPartialGfm`:

1. **Micromark extension** (`data.micromarkExtensions`) — tokenizer that recognizes the syntax during parsing. Example: `gfmTable()` from `micromark-extension-gfm-table`.
2. **MDAST fromMarkdown extension** (`data.fromMarkdownExtensions`) — converts micromark tokens into MDAST nodes. Example: `gfmTableFromMarkdown()` from `mdast-util-gfm-table`.
3. **HTML extension** (`data.toMarkdownExtensions`) — serializes back to HTML (used for markdown-to-HTML output). Example: `gfmTableHtml()` from `micromark-extension-gfm-table`.

Missing any level causes parsing failures or silent data loss.

**Guidelines:**

- MUST register new GFM features at all three levels in `remarkPartialGfm`: micromark extension, MDAST fromMarkdown extension, and HTML extension.
- MUST register the three levels together via `combineExtensions` / `combineHtmlExtensions`.

## Standard MDAST Nodes vs Custom Nodes

GFM table nodes (`table`, `tableRow`, `tableCell`) are **standard MDAST node types** with built-in handlers in `remarkRehype` (via `mdast-util-to-hast`). They do NOT need `passThrough` or custom `handlers` registration — unlike custom directive nodes (e.g., `webembed`) which require explicit registration. See [custom-mdast-node-types.md](./custom-mdast-node-types.md) for the custom node registration process.

**Guidelines:**

- MUST NOT register `passThrough` or custom `handlers` for standard GFM table nodes.
- SHOULD follow [custom-mdast-node-types.md](./custom-mdast-node-types.md) only for custom directive nodes such as `webembed`.

## Table Rendering

Tables are fully rendered end-to-end. The table family (`table`, `thead`, `tbody`, `tr`, `th`, `td`) is mapped in `defaultComponents` in `app/(app)/_/components/markdown.tsx`; `table` and `th` have dedicated React components (horizontal-scroll wrapper, forced `scope="col"`) and the rest map to their native tags with CSS-module class injection. See [react-component-mapping.md › Table Family and the `tableWrapper` Sentinel](./react-component-mapping.md#table-family-and-the-tablewrapper-sentinel) for the mapping mechanics and the sentinel-key pattern.

**Guidelines:**

- MUST keep GFM table rendering wired through `defaultComponents` in `app/(app)/_/components/markdown.tsx`.
- SHOULD route table-family mapping changes through [react-component-mapping.md](./react-component-mapping.md).

## Column Alignment Propagation

GFM column alignment (`:---` / `:---:` / `---:`) is surfaced on the rendered DOM **as inline styles**, not as HTML attributes:

- `mdast-util-to-hast` emits the (deprecated) `align` attribute on `<th>` / `<td>`.
- `hast-util-to-jsx-runtime` (used internally by `rehypeReact`) converts `align` into an inline `style="text-align: left|center|right"` prop via its default `tableCellAlignToStyle: true` option.
- CSS in `blog-post-content.module.css` declares `text-align: start` as the default; the inline value wins by specificity whenever alignment is authored.

**Guidelines:**

- MUST NOT add a rehype plugin or CSS attribute selector to translate GFM table alignment.
- MUST rely on the existing `hast-util-to-jsx-runtime` alignment-to-style conversion.

## Lexical-Side Caveats

The admin-authoring path goes through Payload Lexical's `EXPERIMENTAL_TableFeature()` (enabled explicitly in `payload/helpers/editor.ts` — it is NOT part of `defaultFeatures`). The feature self-registers a `TableMarkdownTransformer`, so `convertLexicalToMarkdown` emits GFM pipe syntax without extra wiring in `get-blog-post-markdown.ts`, and enabling it does NOT require a database migration (tables persist as Lexical node types inside the existing `body` JSON column). The following limitations apply only to content authored through the Lexical admin; hand-authored GFM markdown upstream of the pipeline is unaffected:

- **Column alignment is not authorable.** Lexical always emits `| --- |` dividers. Alignment rendering still works for any raw GFM that reaches the pipeline from other sources.
- **Merged cells (`colspan` / `rowspan`) are silently dropped** by the Lexical-to-markdown exporter. GFM has no standard for spans.

**Guidelines:**

- MUST treat the `EXPERIMENTAL_` prefix as upstream API naming, not a project-level style choice.
- MUST pin Payload and retest the table path when upgrading Payload 3.x because `EXPERIMENTAL_TableFeature()` signals API instability across minor releases.
