# Custom MDAST Node Types

## Standard vs Custom MDAST Nodes

**Standard MDAST node types** (e.g., `paragraph`, `heading`, `table`, `tableRow`, `tableCell`, `emphasis`, `strong`) have built-in handlers in `remarkRehype` (via `mdast-util-to-hast`). They are automatically converted to the corresponding HAST elements without any additional configuration.

**Custom node types** (e.g., directive nodes created by `remark-directive`) are NOT recognized by `remarkRehype` by default. They require explicit registration to survive the MDAST→HAST bridge.

**Guidelines:**

- MUST rely on built-in handlers for standard MDAST nodes unless the project needs custom rendering behavior.
- MUST register custom MDAST node types explicitly before expecting them to reach the React rendering layer.

## Existing Custom Nodes

The project defines one custom node type: `leafDirective` with name `"embed"`.

- It carries `attributes: { url: string; type: string; title?: string; options?: string }` and `children: []`. `type` names the embed kind (only `"webpage"` renders today); `options` is a JSON string of per-type embedding options, ignored for `"webpage"`.
- It has two producers:
  - the `remarkEmbeds` plugin converts a paragraph containing a single bare link into an `embed` directive with `type: "webpage"` and the link text as `title`;
  - the Payload `embed` rich-text block serializes to a literal `::embed{…}` markdown line (see [lexical-blocks.md](./lexical-blocks.md)), which `remark-directive` parses into the same node.
- Both producers render through the `Embed` component, which dispatches on `type`.

**Guidelines:**

- MUST preserve the existing `leafDirective` / `"embed"` node shape unless the markdown pipeline, the Payload embed block's `jsx` converter, the React mapping, and tests are updated together.
- MUST keep the directive's attribute vocabulary (`url`, `type`, `title`, `options`) aligned between `remarkEmbeds` and the embed block's markdown export; a drift silently splits the two authoring paths.

## Adding a New Custom Directive

When adding a new custom directive, you MUST complete all three steps:

1. **Register in `remarkRehype` config** in `app/(app)/_/helpers/markdown.ts`:
   - Add the directive type to `passThrough` so it survives the MDAST→HAST bridge.
   - Add a handler that converts it to an HAST element with `type: "element"`, a `tagName` matching the directive name, and `properties` from `node.attributes`. (The existing generic `leafDirective` handler already does this for every leaf directive.)
2. **Add a React component entry** in `defaultComponents` in `app/(app)/_/components/markdown.tsx`.
3. **Handle unknown nodes** — the `unknownHandler` already configured in `remarkRehype` reports unrecognized MDAST node types to Sentry. MUST NOT silently drop them.

**Guidelines:**

- MUST complete the pass-through registration, HAST handler, React component mapping, and unknown-node handling path before adding a custom directive.
