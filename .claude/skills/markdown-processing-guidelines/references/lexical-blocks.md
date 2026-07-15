# Lexical Rich-Text Blocks and Markdown Conversion

Blog post bodies are Payload Lexical documents rendered through `convertLexicalToMarkdown`. Custom rich-text blocks (registered via `BlocksFeature` in `payload/helpers/editor.ts`) are Lexical `block` nodes, and the markdown conversion only knows how to serialize a block when its config defines a **`jsx` converter**.

## The `jsx` Converter Requirement

`convertLexicalToMarkdown` and `convertMarkdownToLexical` build their block transformers from each block's `jsx` property (`export`, `import`, and optional `customStartRegex` / `customEndRegex`). A block **without** a `jsx` converter is **silently dropped** from markdown output — no error, no Sentry report. The premade `CodeBlock` (fenced code) and the project's `embed` block (`payload/helpers/embed-block.ts`) are the two in-repo examples.

**Guidelines:**

- MUST define a `jsx` converter (`export` + `import`) on every custom block added to `BlocksFeature`; without one the block never reaches the public site.
- MUST unit-test the converter's export→import round trip in a colocated `*.spec.ts` (see `payload/helpers/embed-block.spec.ts`), including attribute edge cases such as JSON values containing braces or quotes.

## Directive-Form Serialization Convention

The default `jsx` serialization is a JSX tag (`<slug …/>`), but the public renderer uses plain remark — not MDX — so raw JSX/HTML lines are dropped by `remarkRehype`. This project's convention is therefore to serialize blocks to **markdown leaf-directive lines** (e.g. `::embed{url="…" type="webpage"}`), which the already-configured `remark-directive` parses into a `leafDirective` node the pipeline renders (see [custom-mdast-node-types.md](./custom-mdast-node-types.md)).

- `export` returns the directive line as a plain string; `customStartRegex` matches the whole line (greedy across `{…}` so JSON attribute values containing `}` still match) and `import` parses the captured attribute string back into block fields.
- Single-quoted JSON attribute values must never contain a literal single quote; the embed block re-escapes them as `'`, which stays valid JSON.

**Guidelines:**

- MUST serialize a new block to a directive (or another plain-markdown form the pipeline already parses), never to a raw JSX/HTML tag the remark pipeline would drop.
- MUST keep the block's exported attribute vocabulary identical to what the rendering pipeline's directive handler and React component consume.

## Admin Components and the Import Map

A block's custom admin UI (e.g. `admin.components.Block`) is a `"use client"` component referenced by a path string. Payload resolves those paths through the generated import map, and component paths starting with `/` resolve from the repository root (no custom `importMap.baseDir` is configured).

**Guidelines:**

- MUST place block admin components under `payload/components/` (Payload-owned admin customization, per the project's project-structure skill) and reference them as `/payload/components/<file>#<Export>`.
- MUST regenerate `app/(payload)/admin/importMap.js` (`./node_modules/.bin/payload generate:importmap`) after adding or renaming an admin component reference, and commit the regenerated file.
- SHOULD style admin components in `app/(payload)/custom.scss` using Payload's `--theme-*` variables rather than the public site's design tokens; the admin does not load the app's token layer.
