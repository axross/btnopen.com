# Custom MDAST Node Types

## Standard vs Custom MDAST Nodes

**Standard MDAST node types** (e.g., `paragraph`, `heading`, `table`, `tableRow`, `tableCell`, `emphasis`, `strong`) have built-in handlers in `remarkRehype` (via `mdast-util-to-hast`). They are automatically converted to the corresponding HAST elements without any additional configuration.

**Custom node types** (e.g., directive nodes created by `remark-directive`) are NOT recognized by `remarkRehype` by default. They require explicit registration to survive the MDAST→HAST bridge.

**Guidelines:**

- MUST rely on built-in handlers for standard MDAST nodes unless the project needs custom rendering behavior.
- MUST register custom MDAST node types explicitly before expecting them to reach the React rendering layer.

## Existing Custom Nodes

The project defines two custom directive node types: `leafDirective` name `"embed"` and `containerDirective` name `"banner"`.

### `leafDirective` name `"embed"`

- It carries `attributes: { url: string; type: string; title?: string; options?: string }` and `children: []`. `type` names the embed kind (only `"webpage"` renders today); `options` is a JSON string of per-type embedding options, ignored for `"webpage"`.
- It has two producers:
  - the `remarkEmbeds` plugin converts a paragraph containing a single bare link into an `embed` directive with `type: "webpage"` and the link text as `title`;
  - the Payload `embed` rich-text block serializes to a literal `::embed{…}` markdown line (see [lexical-blocks.md](./lexical-blocks.md)), which `remark-directive` parses into the same node.
- Both producers render through the `Embed` component, which dispatches on `type`.

**Guidelines:**

- MUST preserve the existing `leafDirective` / `"embed"` node shape unless the markdown pipeline, the Payload embed block's `jsx` converter, the React mapping, and tests are updated together.
- MUST keep the directive's attribute vocabulary (`url`, `type`, `title`, `options`) aligned between `remarkEmbeds` and the embed block's markdown export; a drift silently splits the two authoring paths.

### `containerDirective` name `"banner"`

- It carries `attributes: { type: string }` (only `"note"` / `"warning"` today) and **block-level children** (the callout body's flow content). It is the one container directive the pipeline handles as a feature; every other container directive is literalized (see [Text and Container Directives](#text-and-container-directives)).
- Its sole producer is the Payload `banner` rich-text block, which serializes to a `:::banner{…}:::` container fence (see [lexical-blocks.md](./lexical-blocks.md)); `remark-directive` parses it into this node.
- It renders through the `Banner` component, which dispatches on `type` (unknown type → Sentry report + `note` fallback).
- Because its children are real block content (unlike the leaf directive's empty children), its `remarkRehype` handler MUST convert them with `state.all(node)` rather than passing `node.children` through raw.

**Guidelines:**

- MUST keep the `banner` container directive exempt from `remarkLiteralizeUnhandledDirectives` (the `node.name === "banner"` early return) — without it the block renders as literal `:::banner{…}` text.
- MUST keep the `banner` directive's `type` vocabulary aligned between the banner block's `jsx` converter and the `Banner` component.

## Text and Container Directives

`remark-directive` recognizes three directive kinds from author markdown, not just the leaf directives the pipeline treats as a feature:

- `leafDirective` — `::name{…}` on its own line. Handled as a feature (see `embed` above).
- `textDirective` — an inline `:name`, which fires on any prose colon-word such as `TypeScript:strict` or a `:embed` mention.
- `containerDirective` — a `:::name … :::` fenced block. Handled as a feature only for `name === "banner"` (see `banner` above); every other name is literalized.

Text and container directives (other than the handled `banner`) are almost always incidental author prose, not intentional directives. If they reach `remarkRehype` unregistered, they fall to `unknownHandler`, which drops the node — silently erasing the author's text from the rendered post.

The `remarkLiteralizeUnhandledDirectives` plugin (in `app/(app)/_/helpers/markdown.ts`, before `remarkRehype`) prevents this: it visits every `textDirective` / `containerDirective` and replaces it with a plain text node carrying the **verbatim source** — sliced from the original markdown via the node's `position` offsets (`String(file.value)`), so name, attributes, and fences render exactly as written. Because the conversion happens before `remarkRehype`, these kinds never reach `unknownHandler`, so they emit no Sentry event. The plugin early-returns for the handled `banner` container directive so it survives to its `remarkRehype` handler instead of being literalized.

**Guidelines:**

- MUST preserve unhandled `textDirective` / `containerDirective` nodes as their literal source text rather than letting them reach `unknownHandler` — content preservation over strictness.
- MUST NOT report text or container directives to Sentry; they are expected author input, not pipeline anomalies. Genuinely unknown node *types* still report.
- MUST add a `node.name`-based early return to `remarkLiteralizeUnhandledDirectives` for any *newly handled* container directive, mirroring the `banner` carve-out, or the pipeline will literalize the very directive you just registered.

## Adding a New Custom Directive

When adding a new custom directive, you MUST complete all three steps:

1. **Register in `remarkRehype` config** in `app/(app)/_/helpers/markdown.ts`:
   - Add the directive type to `passThrough` so it survives the MDAST→HAST bridge.
   - Add a handler that converts it to an HAST element with `type: "element"`, a `tagName` matching the directive name, and `properties` from `node.attributes`. (The existing generic `leafDirective` handler already does this for every leaf directive; the `containerDirective` handler additionally converts children via `state.all(node)`.)
2. **Add a React component entry** in `defaultComponents` in `app/(app)/_/components/markdown.tsx`.
3. **Handle unknown nodes** — the `unknownHandler` already configured in `remarkRehype` reports unrecognized MDAST node types to Sentry. MUST NOT silently drop them.
4. **For a container directive**, also add a `node.name` early return to `remarkLiteralizeUnhandledDirectives` (see [Text and Container Directives](#text-and-container-directives)), and convert children with `state.all(node)` in the handler.

**Guidelines:**

- MUST complete the pass-through registration, HAST handler, React component mapping, and unknown-node handling path before adding a custom directive.
- MUST, for a container directive, also add the literalizer carve-out and use `state.all(node)` for its children.
