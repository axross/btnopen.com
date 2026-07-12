---
name: blog-post-authoring-guidelines
description: The editorial rules for btnopen blog post content — Japanese-primary pragmatic authoring, natural syntax coverage, metadata (titles, briefs, tags) quality, translation/localization, and preserving the author's style. Apply Payload CMS MCP separately when writing authored changes back to existing CMS posts.
when_to_use: Apply when drafting, rewriting, refining, translating, or reviewing btnopen blog post content, titles, briefs, tags, structure, tone, grammar, or Markdown usage.
user-invocable: false
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

## Author Words And Terms

See [author-words-and-terms.md](./references/author-words-and-terms.md) for:

- measured word-level vocabulary: first-person split, intensifiers, hedges, connectives, playful coinages, katakana loans
- per-word evidence of where and when each term appears, contrasted with typical AI-assistant word choices
- the anti-lexicon summary mapping drift-signal wordings to the author's alternatives

## Author Expressions And Idioms

See [author-expressions-and-idioms.md](./references/author-expressions-and-idioms.md) for:

- recurring expression templates: openers, prohibit-then-alternative, hedged conclusions, cautions, approximations, closers
- verbatim examples with where/when each idiom appears, contrasted with typical AI-assistant phrasings

## Author Tones And Manners

See [author-tones-and-manners.md](./references/author-tones-and-manners.md) for:

- the overall tone gradient and the situation-to-tone map with per-situation evidence
- emotion handling, humor, reader relationship, authority stance, and formality manners
- per-manner contrasts with the tone habits of generic AI-assistant prose

## Post Structure

See [post-structure.md](./references/post-structure.md) for:

- shaping intros, sections, headings, conclusions, and transitions
- choosing article archetypes that match the author's older posts
- using lists, tables, quotes, code, images, and embeds for reader value
- making example-heavy posts read like real blog posts
- adapting blogging and technical-writing best practices without losing the author's voice

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
