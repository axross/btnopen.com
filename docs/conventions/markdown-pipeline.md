# Markdown Pipeline

Read this when writing, reviewing, or modifying the code that parses, transforms,
or renders a blog post body — the unified chain, its remark and rehype plugins,
and the server components that drive them. Adding a new construct to the pipeline
is [markdown-extensions.md](./markdown-extensions.md). What a reader actually
gets out of it — which syntax renders, and what the pipeline guarantees about
CMS-authored content — is
[../specs/markdown-rendering.md](../specs/markdown-rendering.md).

## Architecture

Blog post content is authored in Payload CMS using its Lexical rich-text editor
and converted to a markdown string at render time via
`@payloadcms/richtext-lexical`'s `convertLexicalToMarkdown`. The markdown string
is then processed through a **unified** pipeline that parses it into an MDAST
(Markdown Abstract Syntax Tree), transforms the tree, bridges it to HAST (HTML
Abstract Syntax Tree), and finally converts it to React elements.

The pipeline is defined in `app/(app)/_/helpers/markdown.ts`:

```text
Markdown string
  → remarkParse          (markdown → MDAST)
  → remarkCjkFriendly    (CJK-aware emphasis boundaries)
  → remarkDirective      (enables directive syntax)
  → remarkPartialGfm     (GFM: strikethrough, tables)
  → remarkEmbeds         (link paragraphs → embed directives)
  → remarkLiteralizeUnhandledDirectives
                         (text/container directives → verbatim source text)
  → remarkRehype         (MDAST → HAST, with custom directive handler)
  → rehypeShiki          (syntax highlighting on code blocks)
  → rehypeUnnestPre      (flatten pre>code nesting)
  → rehypeAllowedLinkProtocols
                         (drop a link href outside the protocol allowlist)
  → rehypeReact          (HAST → React JSX elements)
```

**Rules:**

- MUST preserve this pipeline order unless the markdown behaviour and tests are
  updated together.
- MUST update this overview when adding, removing, or reordering pipeline
  plugins.

### Key Files

| File | Responsibility |
| --- | --- |
| `app/(app)/_/helpers/markdown.ts` | Unified pipeline definition and custom plugins |
| `app/(app)/_/components/markdown.tsx` | `Markdown` React component that invokes the pipeline |
| `app/(app)/_/helpers/shiki.ts` | Singleton Shiki highlighter configuration |
| `app/(app)/_/repositories/get-blog-post-markdown.ts` | Fetches Lexical data and converts to markdown |
| `app/(app)/_/components/media.tsx` | Custom `img` renderer (Payload media with Next.js Image) |
| `app/(app)/_/components/snippet.tsx` | Custom `pre` renderer (code block wrapper) |
| `app/(app)/_/components/embed.tsx` | Custom embed renderer dispatching on `type` (webpage → rich link card with Suspense) |
| `payload/helpers/embed-block.ts` | Payload `embed` rich-text block whose `jsx` converter round-trips `::embed{…}` lines |

**Rules:**

- MUST check the relevant key files together when changing the pipeline contract.
- SHOULD update this table when a pipeline responsibility moves to a different
  file.

## Pipeline Integrity

**Rules:**

- MUST keep the pipeline as a single `unified()` chain in
  `app/(app)/_/helpers/markdown.ts`.
- MUST NOT split the pipeline across multiple files or call intermediate
  `.run()` / `.parse()` steps outside `renderMarkdown`.
- MUST maintain the plugin ordering: remark plugins first (parse → directives →
  GFM → embeds), then the `remarkRehype` bridge, then rehype plugins, then
  `rehypeReact` last.
- MUST NOT add remark plugins after `remarkRehype` or rehype plugins before it.

## Custom Plugins

**Rules:**

- MUST define custom remark/rehype plugins in
  `app/(app)/_/helpers/markdown.ts` alongside the pipeline.
- MUST NOT create separate files for small, project-specific plugins.
- SHOULD follow the unified plugin signature: a function that returns a tree
  transformer `(tree: Root) => void`.
- MUST use `unist-util-visit` (or `unist-util-visit-parents` /
  `unist-util-visit-children`) for tree traversal — MUST NOT manually walk the
  tree with recursive functions.

## Server-Only Execution and Caching

`renderMarkdown` and `Markdown` both open with `import "server-only"`, which
fences them to the server without exposing them. `"use server"` would do the
opposite — it turns every export into a client-invocable endpoint, which a
read-only rendering module must never be. The `Markdown` component uses
`"use cache"` with `cacheLife("hours")`.

**Rules:**

- MUST NOT convert `Markdown` or `renderMarkdown` to client components — the
  entire markdown pipeline runs server-side.
- MUST fence server-side markdown modules with `import "server-only"`, never with
  `"use server"`; the two directives are opposites, and `"use server"` alongside
  `"use cache"` would let a cached public endpoint serve one caller's data to
  another.
- SHOULD preserve the `"use cache"` directive on the `Markdown` component.

## Content Source

Blog post markdown is obtained by calling `getBlogPostMarkdown`, which fetches
Lexical data from Payload CMS and converts it via `convertLexicalToMarkdown`.

**Rules:**

- MUST NOT load markdown from the filesystem **or from arbitrary HTTP** at
  runtime — all blog content comes from Payload CMS. A constrained input source is
  itself a control: content the pipeline cannot reach is content it never has to
  defend against.
- MUST NOT modify the Lexical-to-markdown conversion logic without understanding
  the `@payloadcms/richtext-lexical` API.

## Content Safety

What the pipeline guarantees about CMS-authored content, and which controls hold
each guarantee, is in
[../specs/markdown-rendering.md](../specs/markdown-rendering.md). Two rules bind
the code that implements them.

**Rules:**

- MUST extend `classifyLinkHref` (`app/(app)/_/helpers/link-href.ts`) itself —
  never one of its call sites — when a new URL scheme becomes legitimate. It is
  called from both `rehypeAllowedLinkProtocols` and the `Link` component, and
  those two exist as independent layers precisely so removing one does not open
  the surface; widening one call site instead of the shared helper is what lets
  them drift apart, which turns the redundancy into an inconsistency.
- MUST re-check a pipeline change against every control at once — the
  link-protocol allowlist, the `Embed` http(s) gate, the `unknownHandler`'s
  permissive behaviour, and the output encoding `rehypeReact` provides. They are
  arranged as layers, so a change is safe only against the set rather than against
  whichever one it happens to touch.

## Error Handling

**Rules:**

- MUST make the `remarkRehype` `unknownHandler` call `captureException` from
  `@sentry/nextjs` for any unrecognized MDAST node types.
- MUST NOT throw errors during markdown processing — unrecognized nodes are
  reported and gracefully skipped.
- MUST make the `Media` component return `null` with a logger warning for invalid
  `src` values rather than throwing.
