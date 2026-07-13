# Authoring Artifacts

Apply this reference when writing, revising, or reviewing the two authoring-artifact fields on a `blog-posts` document — `outline` and `authoringNotes` — in any authoring workflow (the author skill's loops, ad-hoc CMS edits, or a review of either field's content).

The two fields are the authoring loop's durable state: they let a fresh agent session resume work on a post from CMS state alone. They only work as state when every writer agrees on what belongs where, so this reference is the single source of truth for their format contracts and content placement. The mechanics of reading and writing them through MCP belong to the Payload CMS MCP skill.

## The Two Fields

Both fields are textareas on the `blog-posts` collection's Agentic tab, and they share the same operational properties.

**Guidelines:**

- MUST treat both fields as authoring artifacts: they are never rendered in the published post body and are visible only on the noindex agentic view (`/posts/<slug>?agentic=true`, with `&draft=true` for drafts).
- MUST treat both fields as non-localized: they are shared across locales, so no `locale` targeting applies to writes.
- MUST write them through the Payload MCP server and verify each write by re-reading, per the Payload CMS MCP skill.
- MUST NOT copy artifact content into the published body, brief, or other reader-facing fields as a side effect of authoring.

## Format Contracts

The two fields carry different Markdown shapes on purpose: the outline stays scannable as a structure map, while notes have room for prose.

**Guidelines:**

- MUST write `outline` as a single Markdown bullet list — list items and inline elements (bold, links, inline code) only; no paragraphs, headings, tables, code blocks, or other block types.
- SHOULD lead each top-level `outline` bullet with a bold name matching the body section it maps (e.g. `- **はじめに** — …`).
- MAY write `authoringNotes` as free-form Markdown — headings, paragraphs, and lists are all allowed.
- MAY use inline links in either field; a load-bearing link for a section belongs in that section's `outline` bullet, and reference material belongs in `authoringNotes`.

## Content Placement

`outline` is a **direct mapping of the article body structure and nothing else** — what the sections are, in what order, and what each says. Everything *about* the writing — why, for whom, under what policy, and how far along — is meta content and lives in `authoringNotes`.

| Content | Field |
| ------- | ----- |
| Body section structure: one bullet per section, per-section content summary, load-bearing links | `outline` |
| ねらい (aims / why the post exists) | `authoringNotes` |
| 結論 (the post's conclusion or takeaway, stated as meta) | `authoringNotes` |
| 対象読者 (target reader) | `authoringNotes` |
| 編集方針 (editorial policy: reference budget, claim scoping, quote rules) | `authoringNotes` |
| 進行状態 (progress/state: phase, done work, artifact links) | `authoringNotes` |
| 公開前チェックリスト and remaining work | `authoringNotes` |
| Working notes, open questions, unverified points | `authoringNotes` |

**Guidelines:**

- MUST keep `outline` to the body-structure mapping: one top-level bullet per body section, in body order, with nested bullets only for sub-points of that section.
- MUST NOT put ねらい, 結論, 対象読者, 編集方針, 進行状態, 公開前チェックリスト, or any other meta content in `outline` — each of those belongs in `authoringNotes`.
- MUST move a meta item found in `outline` into `authoringNotes` when revising, rather than deleting it.
- SHOULD summarize each section's substance in its `outline` bullet — enough that drafting the section needs no other structural input.

## authoringNotes Anatomy

Notes are free-form, but a recognizable shape keeps them usable as resumable state. This section set has proven to cover the loop's needs.

**Example:**

> `## ねらい` / `## 結論` / `## 対象読者` / `## 編集方針` / `## 進行状態` / `## 公開前チェックリスト` — plus any free-form working notes below.

**Guidelines:**

- SHOULD organize `authoringNotes` under the recommended headings above, omitting sections that are genuinely empty.
- MUST keep one merged checklist: when a pre-publication checklist and a remaining-work list would coexist, merge them into a single 公開前チェックリスト rather than maintaining two overlapping lists.
- SHOULD record 進行状態 with the current phase, completed work, and links to any session artifacts, so a fresh session can resume without the prior conversation.
- MAY append free-form working notes (未確認 items, evidence memos, decisions) beyond the recommended sections.

## Sync Rules

The two fields change at different rhythms: the outline is a mirror of the body's structure, while notes are a running log.

**Guidelines:**

- MUST update `outline` when the body's section structure changes — a section added, removed, reordered, or its substance redefined — and MUST NOT churn it otherwise.
- MAY update `authoringNotes` freely on every authoring round.
- MUST put an item that could plausibly live in both fields into `authoringNotes` and keep `outline` structural.
- MUST verify both fields after a write by re-reading them through MCP, per the Payload CMS MCP skill.

## Worked Example

**Better (outline maps structure; notes carry the meta):**

> `outline`:
>
> ```markdown
> - **導入** — なぜ構文確認を記事の形で残すのか。想定する読み手と前提を示す
> - **本文** — 見出し・リスト・コード・表・引用を判断材料とともに提示する。基準は [Markdown Guide](https://www.markdownguide.org/) に合わせる
> - **まとめ** — 再利用する際の注意点
> ```
>
> `authoringNotes`:
>
> ```markdown
> ## ねらい
> Markdown の構文確認を、実装メモとして読める記事に組み直す。
>
> ## 対象読者
> あとで自分の記事に構文を流用したい開発者。
>
> ## 公開前チェックリスト
> - 表とコードブロックの表示をモバイル幅で確認する
> ```

**Risky (meta content mixed into the outline):**

> ```markdown
> - **ねらい**: Markdown の構文確認を記事に組み直す
> - **対象読者**: 構文を流用したい開発者
> - **構成案**
>   - 導入 — なぜ残すのか
> - **補強したい点**
>   - 表の横スクロール条件を説明する
> ```
>
> The structure is buried one level down, and the meta bullets will drift out of date the moment notes are kept elsewhere.
