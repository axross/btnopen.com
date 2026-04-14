---
name: markdown-processing-guidelines
description: Guidelines for markdown processing with unified, remark, rehype, and mdast in this project.
user-invocable: false
---

# Markdown Processing Guidelines

Apply these rules when writing, reviewing, or modifying code related to markdown parsing, transformation, or rendering.

## Architecture Overview

The unified pipeline converts Payload CMS Lexical content to React elements through MDAST and HAST.

See [architecture.md](./architecture.md) for:

- Processing pipeline stages and ordering
- MDAST→HAST bridge: standard vs custom node handling
- HAST→React rendering and component mapping fallback
- Key files and their responsibilities

## Pipeline Integrity

Keep the pipeline as a single unified chain with correct plugin ordering.

See [pipeline-integrity.md](./pipeline-integrity.md) for:

- Single-chain requirement
- Plugin ordering rules (remark → remarkRehype → rehype → rehypeReact)

## Custom Plugins

Rules for writing project-specific remark and rehype plugins.

See [custom-plugins.md](./custom-plugins.md) for:

- Plugin location and colocation rules
- Plugin signature conventions
- Tree traversal with `unist-util-visit`

## Custom MDAST Node Types

How custom directive nodes (e.g., `webembed`) are defined and registered.

See [custom-mdast-node-types.md](./custom-mdast-node-types.md) for:

- Standard MDAST nodes (built-in handlers) vs custom nodes (need explicit registration)
- Existing `leafDirective` / `webembed` node type
- Three-step process to add a new custom directive (passThrough, handler, React component)
- Unknown node type handling via Sentry

## GFM Support

Partial GitHub Flavored Markdown support (strikethrough and tables only).

See [gfm-support.md](./gfm-support.md) for:

- Why full `remark-gfm` is not used
- Three-level registration explained (micromark, mdast-util, HTML)
- Standard MDAST nodes vs custom nodes in the remarkRehype bridge
- Current table rendering gaps (unmapped components, no CSS)

## Syntax Highlighting

Shiki-based syntax highlighting with CSS variables theming.

See [syntax-highlighting.md](./syntax-highlighting.md) for:

- Singleton highlighter pattern
- CSS variables theme with `--snippet-` prefix
- Adding new language support

## React Component Mapping

Mapping HTML tags and custom directives to React components.

See [react-component-mapping.md](./react-component-mapping.md) for:

- `defaultComponents` mapping and `classNames` override mechanism
- Required component mappings (`img` → Media, `pre` → Snippet, `webembed` → WebEmbed)
- Fallback behavior for unmapped tags (native HTML, no class names)
- Currently unmapped elements (table family)
- `className` prop requirement for new components

## Server Components and Caching

The markdown pipeline runs entirely server-side with caching.

See [server-components-and-caching.md](./server-components-and-caching.md) for:

- `"use server"` and `"use cache"` directives
- Prohibition on client-side markdown rendering

## Content Source

Blog post content comes exclusively from Payload CMS.

See [content-source.md](./content-source.md) for:

- Lexical-to-markdown conversion via `@payloadcms/richtext-lexical`
- Prohibition on filesystem-based markdown at runtime

## Error Handling

Graceful error handling during markdown processing.

See [error-handling.md](./error-handling.md) for:

- Sentry reporting for unknown MDAST nodes
- No-throw policy during processing
- Media component null-return behavior
