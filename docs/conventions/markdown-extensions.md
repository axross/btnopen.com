# Markdown Extensions

Adding a construct to the markdown pipeline: a new directive, a new Payload
rich-text block, a new language for syntax highlighting, or a new HAST→React
mapping.

The chain itself and its ordering rules are in
[markdown-pipeline.md](./markdown-pipeline.md).

## Standard vs Custom MDAST Nodes

**Standard MDAST node types** (`paragraph`, `heading`, `table`, `tableRow`,
`tableCell`, `emphasis`, `strong`, …) have built-in handlers in `remarkRehype`
via `mdast-util-to-hast`. They are converted to the corresponding HAST elements
without any additional configuration, and those built-in handlers MUST be relied
on for a standard MDAST node unless the project needs custom rendering behaviour.

**Custom node types** — directive nodes created by `remark-directive` — are NOT
recognized by `remarkRehype` by default. They require explicit registration to
survive the MDAST→HAST bridge, and a custom MDAST node type MUST be registered
explicitly before it can be expected to reach the React rendering layer.

## The Two Existing Custom Nodes

### `leafDirective` name `"embed"`

Carries `attributes: { url: string; type: string; title?: string; options?: string }`
and `children: []`. `type` names the embed kind (only `"webpage"` renders today);
`options` is a JSON string of per-type embedding options, ignored for
`"webpage"`. It has two producers:

- the `remarkEmbeds` plugin converts a paragraph containing a single bare link
  into an `embed` directive with `type: "webpage"` and the link text as `title`;
- the Payload `embed` rich-text block serializes to a literal `::embed{…}`
  markdown line, which `remark-directive` parses into the same node.

Both render through the `Embed` component, which dispatches on `type`.

Two producers and one renderer have to agree on that shape, so the existing
`leafDirective` / `"embed"` node shape MUST be preserved unless the pipeline, the
Payload embed block's `jsx` converter, the React mapping, and tests are updated
together. The directive's attribute vocabulary (`url`, `type`, `title`,
`options`) MUST be kept aligned between `remarkEmbeds` and the embed block's
markdown export; a drift silently splits the two authoring paths.

### `containerDirective` name `"banner"`

Carries `attributes: { type: string }` (only `"note"` / `"warning"` today) and
**block-level children** — the callout body's flow content. It is the one
container directive the pipeline handles as a feature; every other container
directive is literalized. Its sole producer is the Payload `banner` rich-text
block, which serializes to a `:::banner{…}:::` container fence. It renders
through the `Banner` component, which dispatches on `type` (unknown type →
Sentry report + `note` fallback).

Because its children are real block content — unlike the leaf directive's empty
children — its `remarkRehype` handler MUST convert them with `state.all(node)`
rather than passing `node.children` through raw.

The `banner` container directive MUST also be kept exempt from
`remarkLiteralizeUnhandledDirectives` (the `node.name === "banner"` early
return) — without it the block renders as literal `:::banner{…}` text. The
`banner` directive's `type` vocabulary MUST be kept aligned between the banner
block's `jsx` converter and the `Banner` component.

## Text and Container Directives

`remark-directive` recognizes three directive kinds from author markdown, not
just the leaf directives the pipeline treats as a feature:

- `leafDirective` — `::name{…}` on its own line. Handled as a feature (`embed`).
- `textDirective` — an inline `:name`, which fires on any prose colon-word such
  as `TypeScript:strict` or a `:embed` mention.
- `containerDirective` — a `:::name … :::` fenced block. Handled as a feature
  only for `name === "banner"`; every other name is literalized.

Text and container directives other than the handled `banner` are almost always
incidental author prose, not intentional directives. If they reach `remarkRehype`
unregistered, they fall to `unknownHandler`, which drops the node — silently
erasing the author's text from the rendered post.

The `remarkLiteralizeUnhandledDirectives` plugin (in
`app/(app)/_/helpers/markdown.ts`, before `remarkRehype`) prevents this: it
visits every `textDirective` / `containerDirective` and replaces it with a plain
text node carrying the **verbatim source** — sliced from the original markdown via
the node's `position` offsets (`String(file.value)`), so name, attributes, and
fences render exactly as written. Because the conversion happens before
`remarkRehype`, these kinds never reach `unknownHandler`, so they emit no Sentry
event. The plugin early-returns for the handled `banner` container directive so
it survives to its `remarkRehype` handler instead of being literalized.

An unhandled `textDirective` / `containerDirective` node MUST therefore be
preserved as its literal source text rather than being allowed to reach
`unknownHandler` — content preservation over strictness. Text and container
directives MUST NOT be reported to Sentry; they are expected author input, not
pipeline anomalies. Genuinely unknown node *types* still report.

A `node.name`-based early return MUST be added to
`remarkLiteralizeUnhandledDirectives` for any *newly handled* container
directive, mirroring the `banner` carve-out, or the pipeline will literalize the
very directive you just registered.

## Adding a New Custom Directive

All of these steps MUST be followed:

1. **Register in the `remarkRehype` config** in
   `app/(app)/_/helpers/markdown.ts`: add the directive type to `passThrough` so
   it survives the MDAST→HAST bridge, and add a handler that converts it to an
   HAST element with `type: "element"`, a `tagName` matching the directive name,
   and `properties` from `node.attributes`. The existing generic `leafDirective`
   handler already does this for every leaf directive; the `containerDirective`
   handler additionally converts children via `state.all(node)`.
2. **Add a React component entry** in `defaultComponents` in
   `app/(app)/_/components/markdown.tsx`.
3. **Leave the unknown-node path intact** — the `unknownHandler` already
   configured in `remarkRehype` reports unrecognized MDAST node types to Sentry,
   and MUST NOT silently drop them.
4. **For a container directive**, also add a `node.name` early return to
   `remarkLiteralizeUnhandledDirectives`, and convert children with
   `state.all(node)` in the handler.

## Lexical Rich-Text Blocks

Blog post bodies are Payload Lexical documents rendered through
`convertLexicalToMarkdown`. Custom rich-text blocks — registered via
`BlocksFeature` in `payload/helpers/editor.ts` — are Lexical `block` nodes, and
the markdown conversion only knows how to serialize a block when its config
defines a **`jsx` converter**.

`convertLexicalToMarkdown` and `convertMarkdownToLexical` build their block
transformers from each block's `jsx` property (`export`, `import`, and optional
`customStartRegex` / `customEndRegex`). A block **without** a `jsx` converter is
**silently dropped** from markdown output — no error, no Sentry report. The
premade `CodeBlock` (fenced code), the project's `embed` block
(`payload/helpers/embed-block.ts`, leaf-directive form), and its `banner` block
(`payload/helpers/banner-block.ts`, container-directive form with a nested
rich-text body) are the in-repo examples.

Every custom block added to `BlocksFeature` MUST therefore define a `jsx`
converter (`export` + `import`); without one the block never reaches the public
site. The converter's export→import round trip MUST be unit-tested in a colocated
`*.spec.ts` (see `payload/helpers/embed-block.spec.ts`), including attribute edge
cases such as JSON values containing braces or quotes.

### Directive-Form Serialization

The default `jsx` serialization is a JSX tag (`<slug …/>`), but the public
renderer uses plain remark — not MDX — so raw JSX/HTML lines are dropped by
`remarkRehype`. This project's convention is therefore to serialize blocks to
**markdown leaf-directive lines** (`::embed{url="…" type="webpage"}`), which the
already-configured `remark-directive` parses into a `leafDirective` node the
pipeline renders.

`export` returns the directive line as a plain string; `customStartRegex` matches
the whole line (greedy across `{…}` so JSON attribute values containing `}` still
match) and `import` parses the captured attribute string back into block fields.
A single-quoted JSON attribute value MUST NOT contain a literal single quote; the
embed block re-escapes them as `&#39;`, which stays valid JSON.

A new block MUST therefore be serialized to a directive — or to another
plain-markdown form the pipeline already parses — never to a raw JSX/HTML tag the
remark pipeline would drop. The block's exported attribute vocabulary MUST be
kept identical to what the rendering pipeline's directive handler and React
component consume.

### Blocks with a Nested Rich-Text Field

A block that carries a nested `richText` field — the `banner` block's `body` —
serializes to a **container directive**, `:::banner{type="…"}` … `:::`, rather
than a single leaf-directive line. The `jsx.export` receives `lexicalToMarkdown`
and the `import` receives `markdownToLexical` (plus `children`, the fenced body);
use them to convert the nested editor state to and from markdown
(`lexicalToMarkdown({ editorState: fields.body })` and
`markdownToLexical({ markdown: children })`). The nested field MUST be given a
plain `lexicalEditor()` — default features only, **no `BlocksFeature`** — so its
body can never contain another block or `:::` fence that collides with the
container's own fences.

Two requirements here are non-obvious. **Blank lines are mandatory inside the
fences**: a nested-body container directive's body MUST be padded with blank
lines in `export` and in seed or authored markdown alike, because
`convertMarkdownToLexical` only recognizes the container when the opening and
closing fences are separated from the body by blank lines (`:::banner{…}` ⏎⏎ body
⏎⏎ `:::`), and adjacent fence/body lines get merged into a paragraph and the
block is silently lost.

A block's pure markdown-converter logic MUST also be kept free of
`@payloadcms/richtext-lexical` value imports so it stays unit-testable: keep the
pure converter functions and the block's start/end regexes in a module that does
**not** import `lexicalEditor` as a value, so the colocated `*.spec.ts` can
unit-test them without loading the ESM-only Lexical editor into the unit runner,
and put the `lexicalEditor()`-bearing `Block` config in a separate module. The
`banner` block splits `banner-directive.ts` (pure, tested) from `banner-block.ts`
(the `Block` config, which imports `lexicalEditor`).

### Admin Components and the Import Map

A block's custom admin UI (`admin.components.Block`) is a `"use client"`
component referenced by a path string. Payload resolves those paths through the
generated import map, and component paths starting with `/` resolve from the
repository root — no custom `importMap.baseDir` is configured.

Block admin components MUST therefore be placed under `payload/components/` and
referenced as `/payload/components/<file>#<Export>`.
`app/(payload)/admin/importMap.js` MUST be regenerated after an admin component
reference is added or renamed, and the regenerated file committed — see
[payload.md](./payload.md). Admin components SHOULD be styled in
`app/(payload)/custom.scss` using Payload's `--theme-*` variables rather than the
public site's design tokens; the admin does not load the app's token layer.

## Partial GFM

This pipeline supports **strikethrough and tables only**, through the
`remarkPartialGfm` plugin, rather than the whole of `remark-gfm`. Which syntax a
reader can therefore use is in
[../specs/markdown-rendering.md](../specs/markdown-rendering.md); what follows is
how a construct is registered.

GFM support is registered at **two levels**, and both are required for a
construct to work:

- **micromark** — the tokenizer extension, which teaches the parser to recognize
  the syntax.
- **mdast-util** — the from-markdown extension, which builds the MDAST nodes.

Once the MDAST nodes exist, the `remarkRehype` bridge converts them with the
built-in handlers from `mdast-util-to-hast`; there is no third registration level
for a standard GFM node.

A newly supported GFM construct MUST be registered at both levels; registering
only the micromark extension parses the syntax into nothing. The full
`remark-gfm` MUST NOT be pulled in to add one construct — the partial set is
deliberate.

## Syntax Highlighting

Shiki carries a WASM regex engine and one grammar per language, so the
highlighter is built once and shared. The singleton from
`app/(app)/_/helpers/shiki.ts` MUST be used, and a new highlighter instance
MUST NOT be created per render call.

Colour comes from the site's token layer rather than from Shiki: the
`css-variables` theme with prefix `--snippet-` MUST be used, and a hardcoded
colour theme MUST NOT be used. Adding support for a new language MUST add only
the `@shikijs/langs/<language>` import to the `langs` array in
`getSingletonHighlighter`; the full Shiki language bundle MUST NOT be imported,
which would ship every grammar to serve the handful the site actually uses.

## HAST→React Mapping

`app/(app)/_/components/markdown.tsx` maps HTML tag names — and custom directive
names — to React components via `defaultComponents`, which is passed to
`rehypeReact` as the `components` option.

`createComponents()` wraps each entry in a small component that injects a
`className` prop from the optional `classNames` override. Consumers such as
`BlogPostContent` pass a `classNames` record mapping tag names to CSS module
class names, allowing per-context styling. The wrappers close over `classNames`
and `locale`, so the map is built once per `<Markdown>` call rather than once per
module. None of them is memoized, and adding `memo` back would achieve nothing:
`<Markdown>` is a Server Component rendering inside a `"use cache"` scope, its
output is an RSC payload, and these wrapper types never reach client
reconciliation.

`defaultComponents` MUST therefore be kept as the source of truth for markdown
tag and directive component mapping, and the `classNames` override path MUST be
preserved when mapped components are added; each mapped component MUST accept
`className` as a prop so that override mechanism works. A mapped component
MUST NOT be wrapped in `memo`; the wrapper types are created per call and never
reconcile on the client.

`a` MUST be mapped to the `Link` component, `img` to `Media`, `pre` to `Snippet`,
`embed` to `Embed`, and `banner` to `Banner`. `a` MUST NOT be mapped back to the
native `"a"` tag. `Link` is what applies external-link isolation and the
URL-protocol allowlist to authored destinations — see
[../specs/markdown-rendering.md](../specs/markdown-rendering.md).
`dangerouslySetInnerHTML` MUST NOT be used in any markdown-rendered component.

Tags **not** in `defaultComponents` fall back to native HTML elements via
`hast-util-to-jsx-runtime`. They render as correct semantic HTML but receive no
CSS-module class names, so a scoped selector such as `.thead` will not match a
native `<thead>`.

### Table Family and Type-Only Sentinel Keys

The GFM table family is fully mapped: `table` renders through the `Table`
component (an outer non-scrolling `<div>` wrapper around an inner
`<div tabIndex={0}>` scroll area around the `<table>`), `th` renders through
`TableHeaderCell` (which forces `scope="col"` because GFM syntax only produces
column headers), and `thead` / `tbody` / `tr` / `td` map to their native tags so
the `classNames` mechanism can inject class names.

When a mapped component renders more than one nested element and each needs its
own independent class name, the **type-only sentinel key** pattern MUST be used.
It is N-channel by design — one sentinel per nested element that needs its own
channel; `Table` declares both `tableWrapper` and `tableScrollArea`:

- Add an extra key to `defaultComponents` per channel whose value is the native
  tag string (`tableWrapper: "div"`). These keys are never emitted as elements —
  they exist only so `keyof typeof defaultComponents` includes the sentinel names,
  which makes `classNames.<sentinel>` type-check on the consumer side.
- In the `createComponents()` loop that forwards class names, add a narrow special
  case for the parent tag so every sentinel's class is passed to the component as
  an extra prop (when `name === "table"`, forward both
  `wrapperClassName: classNames.tableWrapper` and
  `scrollAreaClassName: classNames.tableScrollArea`).
- The receiving component accepts each extra prop and applies it to the relevant
  nested element.

Type-only sentinel keys MUST be reserved for synthetic class-name channels, and
each sentinel MUST be documented inline in `defaultComponents`, since they look
like real tag mappings. A sentinel key MUST NOT be introduced for a tag that the
pipeline actually emits.
