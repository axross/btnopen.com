---
description: Review an existing blog post through Payload MCP, suggest editorial refinements, and apply the approved changes to the draft
argument-hint: <post slug or URL> [apply]
---

You are the `/polish` driver. Review an existing btnopen blog post and **suggest** editorial refinements first; on the author's explicit go-ahead, **apply** the approved changes to the draft through Payload MCP and return the draft URL.

Target: `$ARGUMENTS`

This command orchestrates existing project skills; it does not restate their rules. Own the editorial judgment with [Blog Post Authoring Guidelines](../skills/blog-post-authoring-guidelines/SKILL.md), the review lens with [Code Review Guideline](../skills/code-review-guideline/SKILL.md), the supported syntax with [Markdown Processing Guidelines](../skills/markdown-processing-guidelines/SKILL.md), and every CMS read/write with [Payload CMS MCP](../skills/payload-cms-mcp/SKILL.md). Follow [Development Guidelines](../skills/development-guidelines/SKILL.md) and the [Response Approach](../../AGENTS.md) throughout.

## Argument resolution

`$ARGUMENTS` carries a target and an optional resume keyword. Resolve them before acting:

| Argument | Meaning | Entry |
| -------- | ------- | ----- |
| `<post slug or URL>` | The post to review — a `slug`, or the `slug` parsed from a `/posts/<slug>` URL. Defaults to the latest **draft**. | Phase 1 (review and suggest) |
| `apply` (after the target, e.g. `/polish <post> apply`) | Resume keyword: the author has approved a prior `/polish` run's suggestions for this post; skip straight to applying them. Still re-inspect the post first. | Phase 2 (apply) |

- MUST detect a trailing `apply` token as the resume keyword and treat the rest of the argument as the target; without it, start at Phase 1.
- MUST re-inspect the post through MCP even on an `apply` resume — never apply from memory of a prior turn's body tree.

## Preconditions

- MUST validate MCP access first: call `tools/list` per [Payload CMS MCP](../skills/payload-cms-mcp/SKILL.md) and use only the exact tool names it returns. If no MCP key or callable connector is available, ask the author for an MCP API key rather than falling back to seed fixtures or local reads.
- MUST resolve the target post from the argument: a `slug`, or the `slug` parsed from a `/posts/<slug>` URL. If the target is ambiguous or missing, ask via `AskUserQuestion`.
- MUST default to the latest **draft** (`draft: true`, `locale: "ja-JP"`). Treat a **published** post as high-impact: do not mutate published content without explicit author confirmation.

## Phase 1 — Review and suggest (no writes)

1. Inspect the target with `findBlogPosts` (`draft: true`, `locale: "ja-JP"`, `depth: 0` for any body subtree that may become a write payload) so suggestions rest on the real current content, not memory.
2. Produce a concrete editorial review report per [Blog Post Authoring Guidelines](../skills/blog-post-authoring-guidelines/SKILL.md) and [Code Review Guideline](../skills/code-review-guideline/SKILL.md). Each proposed change MUST name its location (heading, paragraph, list, metadata field), the current text, the proposed text, and a one-line rationale. Preserve the author's voice, technical specificity, and level of certainty.
3. MUST NOT mutate anything in Phase 1 — this phase is suggest-only.

## Human gate

- Present the proposals and ask through `AskUserQuestion` which to apply — all, a selected subset, or none — and clarify any ambiguous direction with `AskUserQuestion` rather than guessing.
- When the question UI is unavailable, post the report, end the turn, and wait for the author's go-ahead (e.g. re-running `/polish <post> apply` or naming the accepted items). MUST NOT apply any change before explicit approval.

## Phase 2 — Apply the approved changes (on the author's call)

1. Apply only the approved edits to the **draft**. Body edits use the custom body-node tools per [Payload CMS MCP](../skills/payload-cms-mcp/SKILL.md): `appendNodeInBlogPostBody` / `deleteNodeInBlogPostBody`, insert-then-delete for replacements, serialized Lexical nodes (never Markdown), and populated upload nodes normalized to ID `value`s. Keep each edit local — replace only the block that changed.
2. Metadata edits (`title`, `brief`, `tags`, etc.) require a generic update tool (e.g. `updateBlogPosts`) in `tools/list`; if it is absent, apply the body edits and report the metadata changes as a blocked follow-up rather than simulating them with body-node tools. MUST confirm intent before any `slug`, `publishedAt`, or `_status` change.
3. Verify after each mutation by re-reading the affected fields through MCP; confirm the intended node changed and adjacent content stayed intact.
4. Report what was applied, what was skipped, and hand back the draft URL — `<site origin>/posts/<slug>?draft=true` (and `?preview=true&draft=true` for Payload live preview) — for the author to review in the real rendering.

## Guardrails

- MUST suggest before applying and apply only approved items; never write in Phase 1.
- MUST default to the draft and refuse published-post mutation without explicit confirmation; never publish or unpublish unless the author explicitly asks.
- MUST keep content Japanese-primary, edits local and minimal, and verify every mutation through MCP.
- MUST NOT edit seed markdown files as a substitute for CMS writes, and MUST report missing tools precisely instead of guessing alternate names.
