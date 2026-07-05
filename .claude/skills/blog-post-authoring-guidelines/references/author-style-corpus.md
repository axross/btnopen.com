# Author Style Corpus

This corpus summarizes the author's older public posts for style calibration. It is not a raw archive of article text. Use it to avoid drifting into generic documentation prose when drafting or refining btnopen blog posts.

## Source Snapshot

This corpus snapshot was refreshed on 2026-06-03. Profile, feed, home, and sitemap URLs are discovery aids only. They MUST NOT be treated as source rows for style calibration; source evidence should come from individual article pages.

The following individual post pages were opened and read for this snapshot:

| Published | Individual article source | Article shape | Style evidence read |
| --- | --- | --- | --- |
| 2019-12-10 | [Content Security Policyを設定してウェブサイトをXSSから守る](https://medium.com/@axross/getting-started-with-content-security-policy-d096d54aad10) | Technical investigation | interview trigger, security configuration sections, screenshots, caveats, unresolved issue closing |
| 2019-11-30 | [Launched an app for Texas Hold'em Poker made of Flutter!](https://medium.com/@axross/first-flutter-app-launch-4cc502183f9) | English product launch | shipped-app announcement, download links, implementation notes, platform observations |
| 2019-11-29 | [Flutter製のテキサスホールデムポーカーの計算機をリリースしました](https://medium.com/@axross/first-flutter-app-launch-68b9aac44b6) | Japanese product launch | what shipped, store/source links, implementation sections, release lessons |
| 2019-11-29 | [Denoの始め方 / LeetCodeの解答数が100を超えました](https://medium.com/@axross/getting-started-on-deno-61eb23bf3a0a) | Technical experiment note | interview-prep trigger, code output, Deno overview, editor setup details |
| 2019-11-29 | [7 Tips of Next.js 9 with TypeScript](https://medium.com/@axross/7-tips-of-nextjs-9-with-typescript-da346eb9982f) | English technical evaluation | framework investigation trigger, list-style sections, code/config examples |
| 2019-11-28 | [TypeScriptでNext.js 9を触った感想](https://medium.com/@axross/7-tips-of-nextjs-9-with-typescript-cb5486cc8e5e) | Japanese technical evaluation | project investigation trigger, practical headings, blockquoted definitions, deployment caveats |
| 2019-01-01 | [Simple "javaenv" with Fish shell](https://medium.com/@axross/simple-javaenv-with-fish-shell-287ba4a84ba9) | English small utility note | command-oriented setup, concise caveats, practical shell workflow |
| 2021-03-21 | [USの会社で働き始めて1年が経ちました](https://www.btnopen.com/posts/working-at-an-american-company) | Work-experience retrospective | company background, English self-assessment, position/stack notes, Q&A follow-up |
| 2021-03-28 | [いつか海外を目指そうと思っているエンジニアへ](https://www.btnopen.com/posts/for-engineers-who-have-overseas-ambition) | Career/life guide | target reader assumptions, job-search phases, interview preparation, visa and English caveats |

The Medium profile exposed three additional older post URLs, but their individual pages were blocked by Medium/Cloudflare during this refresh in the current automation environment. They are known corpus candidates, but they are not used for measured claims until their individual pages are read manually or through a reliable page-level fetch:

- [scoped_modelやproviderでは型を明示しよう](https://medium.com/@axross/you-should-make-type-explicit-on-scoped-model-and-provider-12124830083b)
- [Fish shellで気軽にjavaenv](https://medium.com/@axross/easy-javaenv-with-fish-shell-866cbb686ffe)
- [2018年振り返り](https://medium.com/@axross/2018%E5%B9%B4%E6%8C%AF%E3%82%8A%E8%BF%94%E3%82%8A-de5133b89ed4)

## Observed Patterns

These observations are directional, not a hard style linter. They come from individually opened article pages and should be refreshed when the public corpus changes materially.

| Corpus slice | Japanese sentences | Sentence-ending tendency |
| --- | ---: | --- |
| Medium Japanese posts read from individual pages | qualitative sample | overwhelmingly `です/ます` polite form |
| btnopen posts read from individual pages | qualitative sample | overwhelmingly `です/ます` polite form with more first-person framing |
| Rewritten Markdown Example draft before this correction | qualitative comparison | mostly plain/assertive form, which was the main style mismatch |

The main mismatch was sentence endings. Older posts usually sound like public blog prose: `〜です`, `〜ます`, `〜ました`, `〜と思います`, `〜かもしれません`, and `〜という感じです`. The Markdown Example rewrite sounded like internal notes: `〜する`, `〜ある`, `〜使う`, `〜残す`, and `〜しない`.

## Sentence Ending Profile

Default Japanese body prose should use polite form. Plain form can still appear in headings, table cells, short bullet fragments, quoted notes, code comments, and intentionally terse checklist labels.

**Preferred body endings:**

- `〜です`
- `〜ます`
- `〜ました`
- `〜できます`
- `〜あります`
- `〜になります`
- `〜と思います`
- `〜かもしれません`
- `〜という感じです`

**Use sparingly in body prose:**

- `〜する`
- `〜ある`
- `〜使う`
- `〜残す`
- `〜見る必要がある`
- `〜しない`
- `〜だ`

Plain endings are not forbidden, but a paragraph dominated by them usually reads unlike the author's public posts.

## Voice And Grammar Patterns

Older posts tend to use an experience-led authority pattern:

1. Name a concrete trigger: interview question, framework investigation, app release, job search, overseas move, work experience, or a small tool experiment.
2. Explain what was tried or observed.
3. Share the practical conclusion with caveats.
4. Keep the tone candid rather than universal.

Common grammar and expression patterns include:

- first-person framing with `僕` and `自分` when personal experience matters
- candid uncertainty with `と思います`, `かもしれません`, `経験上`, and `基本的に`
- conversational technical transitions like `という感じです`, `ちなみに`, `ざっくり`, `めちゃくちゃ`, and `まあ`
- practical verbs such as `試してみました`, `書いておきます`, `共有します`, `挙げておきます`, and `見ていきます`
- contextual claims rather than universal claims, especially around hiring, language, platform behavior, and technical constraints

The grammar is not simply "casual Japanese." The posts often use long but controlled explanatory sentences joined by `ので`, `ですが`, `ただし`, `また`, and `という形です`, then reset the rhythm with short practical headings, lists, code blocks, or screenshots. Agents should preserve that pragmatic explanatory flow instead of flattening everything into short plain-form memo sentences.

Avoid copying old mistakes or dated facts. Preserve the useful cadence and humility, not every historical wording choice.

## Tone Profile

The author's older Japanese posts are:

- pragmatic and implementation-aware
- candid about personal limitations and uncertainty
- mildly conversational without becoming chatty
- direct about what worked, what failed, and what the reader should watch for
- comfortable mixing Japanese prose with exact English technical terms

They are not:

- sales copy
- detached documentation
- SEO-template articles
- generic tutorials with no personal or project trigger
- synthetic "I had a problem, dear reader" anecdotes

English posts in the corpus should calibrate structure and directness only. Do not imitate older English grammar errors or dated phrasing when writing current English fallback content.

## Section And Article Shapes

Common structures:

| Shape | Typical flow |
| --- | --- |
| Technical investigation | trigger, background, concrete sections, caveats, summary |
| Pitfall note | short reason for writing, symptom, fix, mechanism, edge cases |
| Product launch | what shipped, download/source links, implementation notes, platform observations |
| Career/life guide | author background, target reader, phases, resources, caveats, closing reflection |
| Retrospective | occasion, life/work categories, specific events, grounded closing |

Headings are usually descriptive and practical. They often name the topic directly rather than using abstract editorial labels:

- technical posts use concept or decision headings, such as a setting name, framework file, API route, runtime behavior, or deployment constraint
- product posts use launch workflow headings, such as download, implementation, platform-specific lessons, and feature behavior
- career posts use phase or question headings, such as background, English, position, job search, documents, interviews, visa, and reader Q&A

Longer career posts are more sectionized than older Medium notes. They often start by naming the author's exact situation, define the target reader or assumptions, then walk through phases with practical resources and caveats. This newer btnopen structure should influence current career/life posts more strongly than the shorter Medium technical notes.

## Style Regression Checks

Before finalizing a broad rewrite, inspect the draft against this checklist:

- Does the first paragraph explain the concrete trigger or reason for writing?
- Does the body mostly use `です/ます` endings when it is Japanese public prose?
- Does the post include the author's perspective when the topic is based on experience?
- Are caveats expressed naturally with `と思います`, `かもしれません`, `経験上`, or equivalent wording when the claim is contextual?
- Do headings describe reader-relevant topics rather than syntax elements or internal implementation chores?
- Would the post still make sense if syntax coverage, SEO, or fixture needs were ignored?
- Are tables, lists, code, images, and embeds carrying actual explanation instead of proving renderer support?

## Refresh Rules

When refreshing this corpus, discover candidate posts from indexes if necessary, then open and read each individual article page before changing style guidance.

**Guidelines:**

- MUST NOT list the Medium profile, Medium RSS feed, btnopen homepage, or btnopen sitemap as rows in the `Source Snapshot` source table.
- MUST list individual article URLs as source rows when their article bodies were read.
- MUST mark blocked or unreadable individual pages separately from source rows and exclude them from measured claims.
- MUST NOT use RSS summaries, index snippets, metadata descriptions, or sitemap entries as substitutes for article-body evidence.
- SHOULD record the date of the refresh and the article shape each source contributed.
