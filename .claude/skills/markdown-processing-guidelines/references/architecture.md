# Architecture Overview

Blog post content is authored in Payload CMS using its Lexical rich-text editor and converted to a markdown string at render time via `@payloadcms/richtext-lexical`'s `convertLexicalToMarkdown`. The markdown string is then processed through a **unified** pipeline that parses it into an MDAST (Markdown Abstract Syntax Tree), transforms the tree, bridges it to HAST (HTML Abstract Syntax Tree), and finally converts it to React elements.

## Processing Pipeline

The pipeline is defined in `app/(app)/_/helpers/markdown.ts` and follows this order:

```
Markdown string
  → remarkParse          (markdown → MDAST)
  → remarkDirective      (enables directive syntax)
  → remarkPartialGfm     (GFM: strikethrough, tables)
  → remarkEmbeds         (link paragraphs → embed directives)
  → remarkLiteralizeUnhandledDirectives
                         (text/container directives → verbatim source text)
  → remarkRehype         (MDAST → HAST, with custom directive handler)
  → rehypeShiki           (syntax highlighting on code blocks)
  → rehypeUnnestPre      (flatten pre>code nesting)
  → rehypeReact          (HAST → React JSX elements)
```

**Guidelines:**

- MUST preserve this pipeline order unless the markdown behavior and tests are updated together.
- MUST update this overview when adding, removing, or reordering markdown pipeline plugins.

## MDAST→HAST Bridge

The `remarkRehype` step converts MDAST to HAST. It handles nodes in two ways:

- **Standard MDAST nodes** (e.g., `paragraph`, `heading`, `table`, `emphasis`) are converted automatically via built-in handlers in `mdast-util-to-hast`. No configuration needed.
- **Custom nodes** (e.g., `leafDirective`) must be explicitly registered with `passThrough` and a custom `handlers` entry. Without this, they are passed to `unknownHandler` which reports to Sentry.

See [custom-mdast-node-types.md](./custom-mdast-node-types.md) for details on custom node registration.

**Guidelines:**

- MUST register custom MDAST nodes with both `passThrough` and a handler before relying on them in the HAST-to-React layer.

## HAST→React Rendering

The `rehypeReact` step converts HAST elements to React components using a `components` map defined in `app/(app)/_/components/markdown.tsx`. Mapped tags render through their designated React component with CSS module class name injection. Unmapped tags fall back to native HTML elements without class names.

See [react-component-mapping.md](./react-component-mapping.md) for the mapping rules and fallback behavior.

**Guidelines:**

- MUST route custom HAST tags through the `defaultComponents` map when they need project styling or behavior.
- SHOULD leave standard unmapped tags as native HTML only when class-name injection is not needed.

## Key Files

| File | Responsibility |
|------|---------------|
| `app/(app)/_/helpers/markdown.ts` | Unified pipeline definition and custom plugins |
| `app/(app)/_/components/markdown.tsx` | `Markdown` React component that invokes the pipeline |
| `app/(app)/_/helpers/shiki.ts` | Singleton Shiki highlighter configuration |
| `app/(app)/_/repositories/get-blog-post-markdown.ts` | Fetches Lexical data and converts to markdown |
| `app/(app)/_/components/media.tsx` | Custom `img` renderer (Payload media with Next.js Image) |
| `app/(app)/_/components/snippet.tsx` | Custom `pre` renderer (code block wrapper) |
| `app/(app)/_/components/embed.tsx` | Custom embed renderer dispatching on `type` (webpage → rich link card with Suspense) |
| `payload/helpers/embed-block.ts` | Payload `embed` rich-text block whose `jsx` converter round-trips `::embed{…}` lines |

**Guidelines:**

- MUST check the relevant key files together when changing the markdown pipeline contract.
- SHOULD update this table when a markdown pipeline responsibility moves to a different file.
