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

The two fields carry different Markdown shapes on purpose: the outline is a nested tree that stays scannable as a structure map, while notes have room for prose.

**Guidelines:**

- MUST write `outline` as a single Markdown bullet list — list items and inline elements (bold, links, inline code) only; no paragraphs, headings, tables, code blocks, or other block types.
- MUST shape `outline` as a nested tree, never a flat list: one top-level bullet per body section, that section's points as nested children in body order, and sub-points nested deeper — as deep as the content needs (four levels is normal).
- MUST nest a body subsection's (h3) bullet as a child of its h2 section's top-level bullet, never as its own top-level bullet.
- SHOULD lead each top-level `outline` bullet with a bold name matching the body section it maps (e.g. `- **はじめに**`).
- MAY write `authoringNotes` as free-form Markdown — headings, paragraphs, and lists are all allowed.
- MAY use inline links in either field; a load-bearing link belongs inside a labeled evidence child bullet under the claim it supports (see Content Placement), and reference material belongs in `authoringNotes`.

## Content Placement

`outline` is a **direct mapping of the article body structure and nothing else** — what the sections are, in what order, and what each says. Everything *about* the writing — why, for whom, under what policy, and how far along — is meta content and lives in `authoringNotes`.

| Content | Field |
| ------- | ----- |
| Body section structure: one top-level bullet per section, per-section substance as nested children, labeled evidence children carrying load-bearing links | `outline` |
| ねらい (aims / why the post exists) | `authoringNotes` |
| 結論 (the post's conclusion or takeaway, stated as meta) | `authoringNotes` |
| 対象読者 (target reader) | `authoringNotes` |
| 編集方針 (editorial policy: reference budget, claim scoping, quote rules) | `authoringNotes` |
| 進行状態 (progress/state: phase, done work, artifact links) | `authoringNotes` |
| 公開前チェックリスト and remaining work | `authoringNotes` |
| Working notes, open questions, unverified points | `authoringNotes` |

**Guidelines:**

- MUST keep `outline` to the body-structure mapping: one top-level bullet per body section, in body order, with the section's substance nested beneath it as child bullets.
- MUST NOT put ねらい, 結論, 対象読者, 編集方針, 進行状態, 公開前チェックリスト, or any other meta content in `outline` — each of those belongs in `authoringNotes`.
- MUST move a meta item found in `outline` into `authoringNotes` when revising, rather than deleting it.
- SHOULD spread each section's substance across its top-level bullet's nested children — enough that drafting the section needs no other structural input.
- MUST NOT cram a section's whole substance into a single top-level bullet line.
- SHOULD nest developments of a point — elaborations, follow-on conclusions, concrete detail — as child bullets of that point rather than appending them inline to the parent sentence.
- MUST prefix an evidence or supporting-reference child bullet with its role label — 根拠: (evidence), 裏付け: (corroboration), 参考: (reference), 批判: (criticism) — keeping the claim itself in the parent bullet.
- MUST place a load-bearing link inside the labeled child bullet that carries its evidence or reference, not inline in the claim.
- SHOULD expand multi-item content — a table's row mapping, a multi-step provenance chain — into one child bullet per item instead of an inline chain.
- MUST honor the tree granularity of an author-provided outline across research and drafting rounds — deepen it when new substance lands, never flatten it.

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

The Better pair below is the target shape end to end: a hypothetical post's body heading skeleton, the `outline` tree that maps it, and the `authoringNotes` that carry the meta. Use it as the template when writing the artifacts from scratch. Each Risky variant after it isolates one failure mode to avoid. (The links to `example.com` are placeholders standing in for real sources.)

**Better (outline maps the body's heading tree; notes carry the meta):**

> Body heading skeleton being mapped:
>
> ```markdown
> ## 導入
> ## 本文
> ### 表の使いどころ
> ### コードの示し方
> ## まとめ
> ```
>
> `outline`:
>
> ```markdown
> - **導入**
>     - なぜ構文確認を記事の形で残すのか
>     - 想定する読み手と前提を1段落で示す
> - **本文**
>     - 見出し・リスト・コード・表・引用を、採用判断の材料とともに提示する
>         - 裏付け: 構文の基準は [Markdown Guide](https://www.markdownguide.org/) の一覧に合わせる
>     - 表の使いどころ
>         - 表の型ごとに列の並べ方を変える
>             - 対応表は「変換前 → 変換後」の2列に絞る
>             - 比較表は判断軸を左端の列に置く
>             - 数値表は右揃えで桁をそろえる
>         - 横に長い表はモバイル幅で横スクロールになる、という注意も添える
>     - コードの示し方
>         - 実際の境界を写した最小の断片にする
>             - 根拠: 長い断片は読み飛ばされやすいという [計測記事](https://example.com/code-length-study)
>             - 批判: 断片化は文脈を失うという [反論](https://example.com/against-snippets) には、直前の段落で前提を書いて応える
> - **まとめ**
>     - 再利用する際の注意点
>     - 確認しきれていない構文の扱い
>         - 参考: 未確認分の洗い出しには [GFM Spec](https://github.github.com/gfm/) の目次を使う
> ```
>
> What the outline demonstrates:
>
> - One top-level bullet per h2, bold-led, in body order; the h3 subsections (表の使いどころ / コードの示し方) nest under 本文 instead of surfacing as top-level bullets.
> - Each point's developments — cautions, follow-on conclusions, concrete detail — are child bullets rather than sentences appended to the parent line.
> - Every piece of support is a labeled child (裏付け: / 根拠: / 批判: / 参考:) holding its load-bearing link; the claims themselves stay in the parent bullets.
> - The three table types expand into one child bullet each instead of an inline 「・」 chain.
> - Depth goes exactly as deep as the content needs (four levels here) — and no deeper.
>
> `authoringNotes`:
>
> ```markdown
> ## ねらい
> Markdown の構文確認を、実装メモとして読める記事に組み直す。
>
> ## 結論
> 構文は網羅するのではなく、採用判断の材料とともに残してこそ再利用できる。
>
> ## 対象読者
> あとで自分の記事に構文を流用したい開発者。
>
> ## 編集方針
> - 構文ごとに「使う・使わない」の判断を必ず添える
> - リンクは判断の根拠になるものだけを置き、装飾的なリンクは張らない
>
> ## 進行状態
> - 研究ラウンド完了、ドラフト2ラウンド目
> - 表のセクションまで本文化済み。コードの節から未着手
>
> ## 公開前チェックリスト
> - 表とコードブロックの表示をモバイル幅で確認する
> - コードブロックの言語指定が抜けていないか確認する
> ```
>
> The notes use the full recommended section set because this post has content for every section; a section with nothing to say is omitted, not left as an empty heading.

**Risky (each section crammed into one line):**

> ```markdown
> - **導入** — なぜ構文確認を記事の形で残すのか。想定する読み手と前提を1段落で示す
> - **本文** — 見出し・リスト・コード・表・引用を判断材料とともに提示する。基準は [Markdown Guide](https://www.markdownguide.org/) の構文一覧に合わせる
> - **まとめ** — 再利用する際の注意点と、確認しきれていない構文の扱い
> ```
>
> Every top-level bullet carries its whole section in a single line, and the load-bearing link is buried mid-sentence instead of living in a labeled evidence child bullet.

**Risky (nested, but evidence and enumerations still crammed inline):**

> ```markdown
> - **本文**
>     - コードは実際の境界を写した最小の断片にする(根拠: [計測記事](https://example.com/code-length-study)。ただし [反論](https://example.com/against-snippets) もある)
>     - 表は対応表・比較表・数値表を使い分け、型ごとに列の並べ方を変える
> ```
>
> The tree exists, but the evidence hides inside a parenthesis instead of standing as 根拠: and 批判: children, and the three table types ride one line as an inline chain instead of one child bullet each. Nesting is about where substance lives, not just indentation.

**Risky (subsections promoted to top level):**

> ```markdown
> - **本文** — 見出し・リスト・コード・表・引用を提示する
> - **表の使いどころ** — 型ごとに列の並べ方を変える
> - **コードの示し方** — 実際の境界を写した最小の断片にする
> ```
>
> 表の使いどころ and コードの示し方 are h3 subsections of 本文, so their bullets belong nested under 本文's top-level bullet; promoting them to top level breaks the one-top-level-bullet-per-h2 mapping that makes the outline a faithful structure map.

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
