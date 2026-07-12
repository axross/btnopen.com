# Writing Style And Tone

btnopen blog posts should read like practical technical writing from the site author, not like generated marketing copy or a syntax fixture. Prefer concrete observations, trade-offs, implementation details, and examples that explain why a choice matters.

The site is Japanese-primary. English may be used when the user asks for an English locale, when preserving a technical phrase is clearer, or when translating for fallback content.

This guidance is based on the author's older public Medium posts and btnopen posts. Use [author-style-corpus.md](./author-style-corpus.md) as the local calibration asset for voice, structure, sentence endings, and recurring expressions; do not preserve old mistakes or stale facts merely because they appeared in the corpus.

**Guidelines:**

- MUST use Japanese as the default authoring language for body content, titles, and briefs unless the user requests another locale.
- MUST preserve technical terms, library names, code identifiers, URLs, command names, and product names exactly unless the user asks for localization.
- MUST keep the voice pragmatic, direct, and grounded in real implementation details.
- MUST NOT use sales copy, generic motivational phrasing, or filler transitions that do not add technical value.
- MUST NOT invent personal history, production incidents, benchmarks, or opinions that are not supported by the current post or user request.
- SHOULD write in a natural first-person or author-observational voice when the existing post uses it.
- SHOULD prefer concise paragraphs that each make one point.
- SHOULD keep uncertainty explicit with phrases equivalent to "in this case", "at least for this project", or "when the constraint is ..." when the claim is contextual.

## Corpus-Derived Voice

The author's older posts most often start from a concrete trigger: an interview question, framework investigation, app release, job search, overseas move, or work experience. The post then turns that personal context into practical notes for readers who might hit the same constraint.

**Guidelines:**

- MUST preserve a concrete personal or project trigger when the source material has one.
- MUST turn the trigger into reader value early: what the post helps the reader decide, understand, avoid, or try.
- MUST keep the authority pattern experience-led: "I encountered this, investigated or tried this, and here is what changed."
- MUST NOT replace firsthand context with generic industry framing such as broad market trends or motivational openings.
- SHOULD open with one or two short trigger sentences plus an explicit intent declaration (`書いてみます`, `書いておきます`, `共有します`, `まとめてみます`) when it fits the post, matching the corpus's opening move.
- SHOULD keep the author's candid self-assessment, especially around language skill, job search, interviews, platform behavior, and technical uncertainty.
- SHOULD use memorable comparisons only when they clarify a real decision or constraint.

## Japanese Prose

Japanese prose should read like public blog prose from the author, not like detached internal documentation. It can be casual, but it should not become chatty at the expense of clarity.

**Guidelines:**

- MUST avoid literal translations that preserve English word order unnaturally.
- MUST NOT over-normalize the author's Japanese into detached documentation prose.
- MUST use `です/ます` as the default sentence-ending style for Japanese body prose in ordinary btnopen posts.
- MUST reserve plain-form endings such as `〜する`, `〜ある`, `〜使う`, `〜残す`, and `〜しない` mostly for headings, table cells, short bullet fragments, quoted notes, code comments, or intentionally terse checklist labels.
- MAY write an entire post in the corpus's plain-form diary register only when the user explicitly asks for a personal diary-style life log; see the register boundary in [author-style-corpus.md](./author-style-corpus.md).
- MUST keep the chosen register consistent from title to closing; a mid-post register mix is a style regression in either direction.
- MUST run a sentence-ending style pass after broad rewrites; audience-facing paragraphs dominated by plain-form endings usually need to be converted toward `です/ます`.
- SHOULD keep long technical sentences split when a list, table, or code block would make the idea easier to scan.

## Japanese Voice Details

The author's Japanese has light conversational texture where it helps: first-person context, scoped claims, and casual connective phrases. Those details should appear because the article needs them, not because the agent is trying to imitate surface quirks.

**Guidelines:**

- SHOULD use `僕` naturally when personal experience matters and the current post is not intentionally impersonal.
- SHOULD use reader-facing `あなた` or `皆さん` only when the post is directly advisory or closing with a broad reader address.
- SHOULD preserve meaningful softeners such as `と思います`, `かもしれません`, `経験上`, `基本的に`, and `今のところ` when they express honest scope.
- SHOULD use light casual expressions such as `ざっくり`, `めちゃくちゃ`, `まあまあ`, `という感じ`, or `なんにせよ` only when they fit the surrounding evidence and do not weaken clarity.
- SHOULD keep reflective elongations (`〜なぁ`, `〜なー`) and quoted inline dialogue with `って` when retelling personal events, matching the corpus rather than normalizing them away.
- SHOULD append a dated `追記` section for post-publication updates instead of silently rewriting, when the user wants an existing post amended.
- SHOULD preserve the author's self-deprecating humor and playful coinages where the source has them; sanitizing them into neutral prose is a voice regression.
- SHOULD use English technical terms inline when they are the natural names used by the target reader.

## Sentence-Ending Calibration

The strongest signal from the public corpus is that ordinary Japanese posts use polite endings. A post can still be pragmatic and technically specific without sounding like a spec.

**Examples:**

> Better: `この記事では、調べた範囲と判断材料をまとめておきます。`

> Risky as default prose: `この記事では、調べた範囲と判断材料をまとめる。`

**Guidelines:**

- MUST compare broad rewrites against the sentence-ending profile in [author-style-corpus.md](./author-style-corpus.md).
- MUST NOT let "implementation memo", "pragmatic", or "technical" goals override the author's usual public `です/ます` cadence.
- SHOULD vary polite endings with `〜と思います`, `〜かもしれません`, `〜という感じです`, and `〜しておきます` when they match the claim.
- SHOULD keep direct plain fragments in lists or tables when full polite sentences would make the artifact harder to scan.
- SHOULD treat an all-plain-form draft as a style regression unless the user explicitly requested that voice.

## Technical Expression Pattern

The strongest technical posts do more than state an answer. They show the symptom, give the immediate practical move, then explain the mechanism that makes the answer durable.

**Guidelines:**

- MUST connect important recommendations to their operational reason.
- MUST keep exact examples, commands, identifiers, and links when they are part of the evidence.
- SHOULD prefer "what failed / what fixed it / why that works / where it breaks" over generic tutorial flow for pitfall posts.
- SHOULD include edge cases, platform constraints, or failure modes when they change the reader's decision.
- SHOULD trim stacked caveats when they obscure the point, but keep caveats that prevent overclaiming.

## English Fallback

English fallback content should communicate the same practical point, not mirror the Japanese sentence by sentence.

**Guidelines:**

- MUST preserve the same facts, caveats, and calls to action across locales.
- MUST write current English in natural grammar and idiom.
- MUST NOT imitate older non-native English errors as an author-style feature.
- SHOULD adapt idioms and transitions so the English version reads naturally.
- SHOULD preserve the older English posts' useful directness, plain headings, and technical specificity.
- SHOULD keep code identifiers, snippets, URLs, and product names consistent between locales.

## Agent Failure Modes

**Guidelines:**

- MUST NOT add fake anecdotes, fake reader questions, fake benchmarks, fake incidents, or fake personal opinions to make a post feel more realistic.
- MUST NOT turn a personal career or life post into a universal prescription.
- MUST NOT replace the author's candid caveats with stronger claims unless the user asks for that stronger stance and evidence supports it.
- MUST NOT add dramatic hooks, clickbait curiosity gaps, sales copy, or "ultimate guide" framing.
- SHOULD remove machine-like transitions and generic summary sentences when they do not add technical value.
