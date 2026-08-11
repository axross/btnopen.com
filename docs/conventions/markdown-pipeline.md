# Markdown Pipeline

The unified chain that turns a blog post body into React elements: its remark and
rehype plugins, their ordering, and the server components that drive them.

Adding a new construct to the pipeline is
[markdown-extensions.md](./markdown-extensions.md). What a reader actually gets
out of it — which syntax renders, and what the pipeline guarantees about
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

This order is the pipeline's contract rather than an incidental arrangement, and
it MUST be preserved unless the markdown behaviour and tests are updated
together. This overview MUST be updated when a pipeline plugin is added, removed,
or reordered; a chain diagram that no longer matches the code misleads every
reader who trusts it.

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

The pipeline contract spans these files at once — a directive handler, its React
component, and the Payload block that emits it are one change in three places —
so the relevant key files MUST be checked together when that contract changes.
This table SHOULD be updated when a pipeline responsibility moves to a different
file.

## Pipeline Integrity

The pipeline MUST be kept as a single `unified()` chain in
`app/(app)/_/helpers/markdown.ts`. It MUST NOT be split across multiple files,
and intermediate `.run()` / `.parse()` steps MUST NOT be called outside
`renderMarkdown`; one chain in one place is what makes its order readable at a
glance and checkable in review.

The plugin ordering MUST be maintained: remark plugins first (parse →
directives → GFM → embeds), then the `remarkRehype` bridge, then rehype plugins,
then `rehypeReact` last. Remark plugins MUST NOT be added after `remarkRehype`,
and rehype plugins MUST NOT be added before it — the bridge is where MDAST stops
and HAST begins, so a plugin on the wrong side of it is handed a tree of the
wrong shape.

## Custom Plugins

Custom remark and rehype plugins MUST be defined in
`app/(app)/_/helpers/markdown.ts` alongside the pipeline, and a separate file
MUST NOT be created for a small, project-specific plugin: a plugin read next to
the chain that uses it is a plugin whose place in that chain is obvious.

A custom plugin SHOULD follow the unified plugin signature: a function that
returns a tree transformer `(tree: Root) => void`. Tree traversal MUST use
`unist-util-visit` (or `unist-util-visit-parents` /
`unist-util-visit-children`); the tree MUST NOT be walked manually with recursive
functions, which re-implement the child-order and skip semantics those utilities
already get right.

## Server-Only Execution and Caching

`renderMarkdown` and `Markdown` both open with `import "server-only"`, which
fences them to the server without exposing them. A server-side markdown module
MUST be fenced that way and never with `"use server"`; the two directives are
opposites — `"use server"` turns every export into a client-invocable endpoint,
which a read-only rendering module must never be, and alongside `"use cache"` it
would let a cached public endpoint serve one caller's data to another.

`Markdown` and `renderMarkdown` MUST NOT be converted to client components — the
entire markdown pipeline runs server-side. The `Markdown` component uses
`"use cache"` with `cacheLife("hours")`, and that `"use cache"` directive SHOULD
be preserved.

## Content Source

Blog post markdown is obtained by calling `getBlogPostMarkdown`, which fetches
Lexical data from Payload CMS and converts it via `convertLexicalToMarkdown`.

Markdown MUST NOT be loaded from the filesystem **or from arbitrary HTTP** at
runtime — all blog content comes from Payload CMS. A constrained input source is
itself a control: content the pipeline cannot reach is content it never has to
defend against.

The Lexical-to-markdown conversion logic MUST NOT be modified without
understanding the `@payloadcms/richtext-lexical` API.

## Content Safety

What the pipeline guarantees about CMS-authored content, and which controls hold
each guarantee, is in
[../specs/markdown-rendering.md](../specs/markdown-rendering.md). Two rules bind
the code that implements them.

`classifyLinkHref` (`app/(app)/_/helpers/link-href.ts`) itself MUST be extended —
never one of its call sites — when a new URL scheme becomes legitimate. It is
called from both `rehypeAllowedLinkProtocols` and the `Link` component, and those
two exist as independent layers precisely so removing one does not open the
surface; widening one call site instead of the shared helper is what lets them
drift apart, which turns the redundancy into an inconsistency.

A pipeline change MUST be re-checked against every control at once — the
link-protocol allowlist, the `Embed` http(s) gate, the `unknownHandler`'s
permissive behaviour, and the output encoding `rehypeReact` provides. They are
arranged as layers, so a change is safe only against the set rather than against
whichever one it happens to touch.

## Error Handling

A node the pipeline does not recognize is a content problem rather than a reason
to fail a whole page, so the pipeline reports instead of raising. The
`remarkRehype` `unknownHandler` MUST call `captureException` from
`@sentry/nextjs` for any unrecognized MDAST node types. Errors MUST NOT be thrown
during markdown processing — unrecognized nodes are reported and gracefully
skipped. The `Media` component MUST return `null` with a logger warning for
invalid `src` values rather than throwing.
