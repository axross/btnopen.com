# Content Authoring

The author-facing half of the product: the surfaces the site's author and their
agents use to write, review, and publish. What a post is made of is
[blog-posts.md](./blog-posts.md); how to connect an agent is
[../operations/payload-mcp.md](../operations/payload-mcp.md).

## The Collections

All content lives in Payload collections and one global.

| Collection | Holds |
| --- | --- |
| `blog-posts` | The primary content type |
| `tags` | Shared tag records posts point at |
| `cover-images` | Post hero and list-item cover uploads |
| `media` | Images embedded inside post bodies |
| `avatar-images` | Author avatar uploads |
| `comments` | Reader comments — see [comments.md](./comments.md) |
| `users` | Authors, and the admin login |
| `payload-mcp-api-keys` | Scoped keys for the MCP server |
| `website` (global) | The site profile: name, description, keywords, and the creator |

`media`, `cover-images`, and `avatar-images` are publicly readable, as static
assets. Everything else is gated.

The `website` global is what the reader-facing metadata comes from — description,
keywords, authors, and Open Graph fields are sourced from the CMS rather than
hard-coded at the route level.

## The Admin

The Payload admin at `/admin` is the primary editing surface. A post's fields are
split across three tabs — **Body**, **Metadata**, and **Agentic** — and the
editor is Lexical rich text with the site's own blocks registered: fenced code, an
embed, and a banner callout.

**Live preview** renders the post as the author types, at three declared
breakpoints — phone (440×956), tablet (1024×1366), and desktop (1920×1080). It
opens the post's own route with preview and draft both requested, so what the
author sees is the real page rather than an editor approximation.

The admin login locks out after five failed attempts, for five minutes.

## The Agentic View

A post can be read at `/posts/<slug>?agentic=true` — adding `&draft=true` for a
draft. This is a `noindex` surface that shows the post's **authoring artifacts**
rather than the published rendering, and it is the surface to hand back after
writing either of them.

Two fields carry those artifacts, both on the collection's **Agentic** tab. Both
are **never rendered** in the published post body, and both are **non-localized**,
so they are shared across locales and no locale targeting applies when writing
them.

**`outline`** is a direct map of the article body's structure and nothing else: a
single nested Markdown bullet list, one top-level bullet per body section in
order, with each section's substance as nested child bullets. It carries no meta
content.

**`authoringNotes`** is everything *about* the writing, as free-form Markdown.

| Content | Field |
| --- | --- |
| Body section structure, and each section's substance | `outline` |
| ねらい / 結論 / 対象読者 / 編集方針 / 進行状態 / 公開前チェックリスト, and working notes | `authoringNotes` |

`authoringNotes` has a recommended structure so it stays usable as resumable
state: organized under `## ねらい`, `## 結論`, `## 対象読者`, `## 編集方針`,
`## 進行状態`, and `## 公開前チェックリスト` headings, omitting any that are
genuinely empty, with free-form working notes allowed to follow. It keeps a
**single merged `公開前チェックリスト`** rather than two overlapping checklists,
and `進行状態` records the current phase, completed work, and links to any session
artifacts.

Together they are the durable state of a post's authoring workflow: they are what
lets a fresh agent session resume work on a post from CMS state alone, which is
why every tool that writes them has to agree on what belongs where.

## The MCP Server

Payload exposes a [Model Context Protocol](https://modelcontextprotocol.io)
server, so any MCP-capable agent can inspect and edit CMS content through a single
authenticated endpoint. This is what powers AI-assisted blogging on the site: a
separate agent-skills library uses these tools to write and edit content, and any
MCP-capable agent can connect to the same endpoint.

Each API key is **scoped to a specific set of tools**, so what an agent can do is
a property of its key rather than of the server. Because of that, an agent lists
the available tools before anything else — the answer differs per key.

Depending on the key, the tools cover:

- **find** operations across `blog-posts`, `tags`, `cover-images`, `media`, and
  the `website` global;
- **create, update, and delete** for CMS content;
- two **body-editing** tools, `appendNodeInBlogPostBody` and
  `deleteNodeInBlogPostBody`, for controlled edits to a post's rich-text body
  rather than wholesale replacement.

Responses are sanitized before they leave the server, so a tool result carries the
fields the content model exposes rather than the raw stored document.

A key authenticates against **its own environment's database**: a local key does
not work against production, and vice versa. A production key writes to the live
CMS, so a draft-scoped key is preferred — the authoring workflow operates on
drafts reviewed at `/posts/<slug>?draft=true` before publishing.

## What This Repository Does Not Own

The editorial craft for shaping these fields — the outline's nested-tree
discipline and the author's writing voice — and the end-to-end writing workflow
live in a separate agent-skills library that drives authoring through the MCP
server. This repository is the source of truth for the content model above.
