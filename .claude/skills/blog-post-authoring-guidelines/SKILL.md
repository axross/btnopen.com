---
name: blog-post-authoring-guidelines
description: Apply this skill when drafting, rewriting, refining, translating, or reviewing btnopen blog post content, titles, briefs, tags, structure, tone, grammar, references/citations, quotes, or Markdown usage. Covers Japanese-primary pragmatic authoring, natural syntax coverage, sparse evidence-first referencing, quote and attribution verification, metadata quality, translation/localization, and preserving the author's style. Use Payload CMS MCP separately when applying authored changes to existing CMS posts.
---

# Blog Post Authoring Guidelines

Use this skill for editorial decisions about what a btnopen blog post should say and how it should read. This skill owns content quality, structure, tone, metadata wording, and natural use of rich Markdown.

This skill does not operate Payload MCP tools. When authored content needs to be applied to an existing CMS post, consult the project's Payload CMS MCP skill for discovery, mutation, draft/published targeting, locale handling, and verification.

**Guidelines:**

- MUST separate editorial decisions from CMS mutation mechanics.
- MUST consult the project's Payload CMS MCP skill when applying authored changes to an existing Payload document.
- MUST inspect the target post before rewriting it when a current CMS version is available.
- MUST preserve the author's intent, technical specificity, and level of certainty unless the user asks for a stronger rewrite.
- MUST write Japanese as the primary language unless the user requests English or another locale.
- MUST avoid turning a post into a feature demonstration; supported syntax should appear because it helps the article.
- SHOULD consult the project's markdown-processing guidelines when exact supported syntax, rendering behavior, or custom markdown directives matter.

## Writing Style And Tone

See [writing-style-and-tone.md](./references/writing-style-and-tone.md) for:

- Japanese-primary prose, English fallback, and translation stance
- corpus-derived grammar, tone, caveat, and expression patterns
- preserving the author's voice while removing demo-like filler

## Author Style Corpus

See [author-style-corpus.md](./references/author-style-corpus.md) for:

- public Medium and btnopen source snapshot used for author-style calibration
- measured sentence-ending tendencies and recurring expression patterns
- common article shapes, tone profile, and broad-rewrite style regression checks

## Post Structure

See [post-structure.md](./references/post-structure.md) for:

- shaping intros, sections, headings, conclusions, and transitions
- choosing article archetypes that match the author's older posts
- using lists, tables, quotes, code, images, and embeds for reader value
- making example-heavy posts read like real blog posts
- adapting blogging and technical-writing best practices without losing the author's voice

## References And Evidence

See [references-and-evidence.md](./references/references-and-evidence.md) for:

- choosing which inline links, citations, quotes, and numbers stay in a post
- scoping strong or contested claims and pairing them with a single best source
- verbatim-quote verification, paraphrase attribution, and origin claims
- dating and re-verifying time-sensitive facts before publication

## Metadata And Taxonomy

See [metadata-and-taxonomy.md](./references/metadata-and-taxonomy.md) for:

- titles, briefs, descriptions, tags, cover images, and publication metadata
- combining personal context with reader value in metadata
- localized metadata expectations and fallback handling
- deciding when a metadata change needs Payload MCP capability

## Markdown Coverage

See [markdown-coverage.md](./references/markdown-coverage.md) for:

- covering supported Markdown syntax naturally in author-facing content
- deciding when to research the exact renderer and Payload editor behavior
- avoiding unsupported syntax and demo-checklist prose

## Editorial Workflow

See [editorial-workflow.md](./references/editorial-workflow.md) for:

- reading the current post before rewriting
- planning targeted refinements versus large rewrites
- verifying authored content after CMS application
