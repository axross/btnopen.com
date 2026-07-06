---
description: Turn a short content summary into a draft blog post created through Payload MCP, then return the draft preview URL for review
argument-hint: <summary of the blog post content>
---

You are the `/author` driver. Turn a short content summary into a **draft** btnopen blog post created through the Payload MCP server, then hand back the draft preview URL so the author reviews the result in the real site rendering.

Target: `$ARGUMENTS`

This command orchestrates existing project skills; it does not restate their rules. Own the editorial decisions with [Blog Post Authoring Guidelines](../skills/blog-post-authoring-guidelines/SKILL.md), the exact supported syntax with [Markdown Processing Guidelines](../skills/markdown-processing-guidelines/SKILL.md), and every CMS read/write with [Payload CMS MCP](../skills/payload-cms-mcp/SKILL.md). Follow [Development Guidelines](../skills/development-guidelines/SKILL.md) and the [Response Approach](../../AGENTS.md) throughout.

## Preconditions

- MUST validate MCP access first: call `tools/list` per [Payload CMS MCP](../skills/payload-cms-mcp/SKILL.md) and use only the exact tool names it returns. If no MCP key or callable connector is available, ask the author for an MCP API key rather than falling back to seed fixtures, direct database writes, or local REST calls.
- MUST confirm a blog-post create tool (e.g. `createBlogPosts`) is present in `tools/list` before promising a draft. If it is absent for the current key, stop and report the missing capability precisely instead of editing seed files as a substitute.
- MUST treat the summary as author intent, not as content to paste verbatim; expand it into a real post.

## Workflow

1. **Draft the content.** From the summary, compose the post per [Blog Post Authoring Guidelines](../skills/blog-post-authoring-guidelines/SKILL.md): a **Japanese-primary** (`ja-JP`) `title`, a `brief`, a unique ASCII kebab-case `slug`, a candidate `tags` set, and the full `body` prose. Cover supported Markdown naturally per [Markdown Processing Guidelines](../skills/markdown-processing-guidelines/SKILL.md) — never turn the post into a syntax demo. English is an optional follow-up; do not produce it unless the author asks.
2. **Resolve the required relationships** (the `blog-posts` collection requires `coverImage` and `author`):
   - **Author** — default to the site's single author. Resolve its real ID from existing data (e.g. `findBlogPosts` selecting `author` at `depth: 1`); never invent an ID.
   - **Tags** — resolve candidates with `findTags` and reuse existing IDs. Create a missing tag only if `tools/list` exposes a tag create tool and the taxonomy choice is clear; otherwise report the unmatched tag rather than inventing one.
   - **Cover image** — **ask on every run.** List existing options with `findCoverImages`, present them through `AskUserQuestion`, and use the author's choice (or a cover image the author supplies). `coverImage` is required; MUST NOT guess or silently pick one. When the question UI is unavailable, post the options and end the turn for the author's choice.
3. **Create the draft.** Call the create tool with `title`, `slug`, `brief`, resolved `tags`, resolved `author`, chosen `coverImage`, and a `body`, targeting `locale: "ja-JP"` and **draft state** (`_status: "draft"` / `draft: true`). Leave `publishedAt` unset. MUST NOT publish.
   - **Body is serialized Lexical editor state, not Markdown.** Build it per the body-editing conventions in [Payload CMS MCP](../skills/payload-cms-mcp/SKILL.md): serialized Lexical nodes with their structural fields, upload nodes carrying `relationTo: "media"` and an ID `value`. If assembling the whole body inside one create payload is impractical, create the draft with a minimal body and then build it block-by-block with `appendNodeInBlogPostBody`, verifying after each block.
4. **Verify.** Re-read the created draft with `findBlogPosts` (`draft: true`, `locale: "ja-JP"`, a tight `select`) and confirm the metadata and body persisted as intended.
5. **Hand back the draft URL.** Report the draft preview URL — `<site origin>/posts/<slug>?draft=true` (rendered draft) — and mention `<site origin>/posts/<slug>?preview=true&draft=true` for Payload live preview. The origin is whichever site the connected MCP server targets. Summarize the title, brief, tags, chosen cover image, and note anything left for the author (e.g. English translation, a better cover image, tag additions blocked by tool availability).

## Guardrails

- MUST keep content Japanese-primary and create drafts only; never publish or set `publishedAt`.
- MUST ask via `AskUserQuestion` for genuine gaps (cover image every run, ambiguous scope, unclear taxonomy) instead of guessing; end the turn for the author when the question UI is unavailable.
- MUST verify every mutation by re-reading through MCP, and MUST NOT edit seed markdown files as a substitute for CMS writes.
- MUST report precisely when a needed tool (create, tag create) is missing from `tools/list`, and keep the draft recoverable rather than leaving a half-built post unreported.
