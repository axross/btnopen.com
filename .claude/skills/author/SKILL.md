---
name: author
description: The btnopen blog-post authoring workflow — an outline-first loop that researches and strengthens a post's outline to an explicit go sign, then drafts the body through the Payload MCP server and iterates on the draft preview URL until the author is satisfied. Publishing stays in the Payload admin.
when_to_use: Invoke when the human wants to write or develop a btnopen blog post from an idea, a slug, or an outline — "write a post about X", "draft this article", "work on the <slug> post". Do not invoke for one-off edits to already-published content, or for non-post copy.
argument-hint: <post slug or URL, or an idea summary>
user-invocable: true
---

You are the `/author` driver. Take a btnopen blog post from an idea or an outline to a reviewed **draft** through two human-gated loops: **research rounds** that audit and strengthen the post's outline until the author gives an explicit go sign, then **drafting rounds** that write the body through the Payload MCP server and hand back the draft preview URL until the author has no more requests. Publishing is never part of this skill — the author publishes in the Payload admin.

Target: `$ARGUMENTS`

This skill orchestrates existing project skills; it does not restate their rules. Own the editorial decisions with [Blog Post Authoring Guidelines](../blog-post-authoring-guidelines/SKILL.md), the review lens with [Code Review Guideline](../code-review-guideline/SKILL.md), the exact supported syntax with [Markdown Processing Guidelines](../markdown-processing-guidelines/SKILL.md), and every CMS read/write with [Payload CMS MCP](../payload-cms-mcp/SKILL.md). Follow [Development Guidelines](../development-guidelines/SKILL.md) and the [Response Approach](../../../AGENTS.md) throughout.

## The authoring-artifact fields

The `blog-posts` collection carries two non-localized authoring artifacts that are never rendered on the public site. Together they are the loop's durable state: the author seeds them in the Payload admin (or asks you to), and you write every revision back, so a fresh session can resume the loop from CMS state alone.

- `outline` — a single Markdown bullet list mapping the article body structure, and nothing else.
- `authoringNotes` — free-form Markdown for everything meta about the writing; meta content never goes into `outline`.

Before writing either field, follow the placement, format, and sync rules owned by the project's blog-post authoring guidelines (its authoring-artifacts reference).

## Argument resolution

| Argument | Meaning | Entry |
| -------- | ------- | ----- |
| `<post slug or URL>` | An existing post — a `slug`, or the `slug` parsed from a `/posts/<slug>` URL. | By CMS state, below |
| `<idea summary>` | A new post from a described idea. | Condense the idea into a structure-only outline plus starting meta notes, create a minimal **draft** post through MCP to hold them, write the `outline` and `authoringNotes` fields per the authoring guidelines' placement rules, and enter the research loop. |

For an existing post, choose the entry from its current state:

- **Outline present** — ask via `AskUserQuestion` whether to continue the research loop (default), treat the outline as approved and enter drafting (this counts as the go sign), or set the outline aside and refine the existing body directly. The go sign is not persisted, so on re-entry this question is how the author places the loop.
- **Outline empty** — ask via `AskUserQuestion` whether to refine the existing body directly through drafting rounds, or derive an outline first (from the existing body or the author's stated intent) and run the research loop.

## Preconditions

- MUST validate MCP access first: call `tools/list` per [Payload CMS MCP](../payload-cms-mcp/SKILL.md) and use only the exact tool names it returns. If no MCP key or callable connector is available, ask the author for an MCP API key rather than falling back to seed fixtures, direct database writes, or local REST calls.
- MUST confirm the tools an entry needs are present (`findBlogPosts` always; `createBlogPosts` for a new post; `updateBlogPosts` for outline write-back and metadata; the body-node tools for body edits) before promising the work. If one is absent for the current key, stop and report the missing capability precisely.
- MUST re-inspect the post through MCP at the start of every round — never act on memory of a prior turn's outline or body tree.

## Phase 1 — Outline research loop (repeat until the go sign)

Each round:

1. Re-read the `outline` and `authoringNotes` fields (`draft: true` for draft posts).
2. **Audit every item**: mistakes, misunderstandings, misleading or confusing points. Investigate rather than assume; ask the author via `AskUserQuestion` when an item is genuinely interpretable in multiple ways.
3. **Strengthen the structure**: propose new item candidates, and find study articles, evidence, or resources that prove or support the items (with links). When web research is unavailable or fails, report which items lack sourced evidence instead of blocking the round.
4. **Take the reader's perspective**: note what a developer or tech-minded reader would additionally want covered.
5. Share the audited outline with per-item findings in-session, then write the revisions back — structural changes to `outline`, meta findings to `authoringNotes`, split per the authoring guidelines' placement rules — verify both writes by re-reading, and hand back the agentic view URL per the authoring guidelines' authoring-artifacts reference (the only surface that renders these fields).
6. **Go-sign gate**: ask via `AskUserQuestion` — go to drafting, run another research round, or apply specific direction. MUST NOT enter Phase 2 without the author's explicit go.

## Phase 2 — Drafting loop (repeat until the author is satisfied)

Each round:

1. Write or update the **draft** body from the approved outline per [Blog Post Authoring Guidelines](../blog-post-authoring-guidelines/SKILL.md) — Japanese-primary (`ja-JP`), covering supported Markdown naturally per [Markdown Processing Guidelines](../markdown-processing-guidelines/SKILL.md). Body writes use the serialized-Lexical conventions in [Payload CMS MCP](../payload-cms-mcp/SKILL.md); prefer local block-level edits for targeted feedback, and suggest-then-apply for anything destructive.
2. For a new post, resolve the required relationships as part of the first round: the site's single author resolved from existing data (never an invented ID), tags matched through `findTags` (report unmatched candidates rather than inventing), and the cover image chosen by the author via `AskUserQuestion` from `findCoverImages` options — **ask on every run**, never guess.
3. Verify every mutation by re-reading the affected fields through MCP.
4. Hand back the preview(s) matching what changed this round, then summarize the change: a body or reader-facing edit hands back the rendered draft (optionally the Payload live preview) per the Payload CMS MCP skill's safety-and-verification reference; an artifact-only round hands back the agentic view per the authoring guidelines' authoring-artifacts reference.
5. Take the author's questions and requests into the next round; clarify ambiguous feedback via `AskUserQuestion` rather than guessing.

## Guardrails

- MUST keep all writes draft-scoped: never publish, unpublish, or set `publishedAt`/`_status`, and never mutate a published document directly.
- MUST get explicit confirmation via `AskUserQuestion` before wholesale replacement of an existing non-empty body — even when it follows an approved outline.
- MUST NOT write anything besides the `outline` and `authoringNotes` fields during Phase 1 (the new-post entry's minimal draft creation happens once, before the loop starts); body and metadata writes belong to Phase 2, behind the go sign.
- MUST keep content Japanese-primary; English is an on-request follow-up, never automatic.
- MUST verify every mutation by re-reading through MCP, and MUST NOT edit seed markdown files as a substitute for CMS writes.
- MUST ask via `AskUserQuestion` for genuine gaps instead of guessing; when the question UI is unavailable, present the question in text, end the turn, and wait — never proceed on an assumed answer.
