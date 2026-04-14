# Custom MDAST Node Types

## Standard vs Custom MDAST Nodes

**Standard MDAST node types** (e.g., `paragraph`, `heading`, `table`, `tableRow`, `tableCell`, `emphasis`, `strong`) have built-in handlers in `remarkRehype` (via `mdast-util-to-hast`). They are automatically converted to the corresponding HAST elements without any additional configuration.

**Custom node types** (e.g., directive nodes created by `remark-directive`) are NOT recognized by `remarkRehype` by default. They require explicit registration to survive the MDAST→HAST bridge.

## Existing Custom Nodes

The project defines one custom node type: `leafDirective` with name `"webembed"`.

- It carries `attributes: { href: string; title?: string }` and `children: []`.
- It is created by the `remarkEmbeds` plugin from paragraphs that contain a single link whose text matches its URL.

## Adding a New Custom Directive

When adding a new custom directive, you MUST complete all three steps:

1. **Register in `remarkRehype` config** in `app/(app)/_/helpers/markdown.ts`:
   - Add the directive type to `passThrough` so it survives the MDAST→HAST bridge.
   - Add a handler that converts it to an HAST element with `type: "element"`, a `tagName` matching the directive name, and `properties` from `node.attributes`.
2. **Add a React component entry** in `defaultComponents` in `app/(app)/_/components/markdown.tsx`.
3. **Handle unknown nodes** — the `unknownHandler` already configured in `remarkRehype` reports unrecognized MDAST node types to Sentry. MUST NOT silently drop them.
