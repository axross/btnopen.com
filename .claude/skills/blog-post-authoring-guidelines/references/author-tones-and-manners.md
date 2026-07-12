# Author Tones And Manners

Tone- and manner-level evidence of how the author writes, split out from the style corpus. The companion files cover [words and terms](./author-words-and-terms.md) and [expressions and idioms](./author-expressions-and-idioms.md); the measured register evidence (polite vs diary, sentence-ending counts) lives in [author-style-corpus.md](./author-style-corpus.md) and is referenced here rather than restated.

Author-side observations come from the 15 Medium posts (2018–2019) read in full on 2026-07-12. The "AI default" contrasts characterize the tone habits of generic AI assistants writing Japanese blog prose — a calibration aid, not measured claims. Normative style rules stay in [writing-style-and-tone.md](./writing-style-and-tone.md).

## The Overall Gradient

**The author's way:** certainty about mechanisms, humility about judgments. Factual and mechanical explanation is stated flat, hedge-free — the ディレクティブ and 解説 sections of the CSP and scoped_model posts read as confident declarative prose. Anything involving prediction, taste, or other people gets a personal hedge (と思います, 気がします, かもしれません).

**AI default it replaces:** uniform tone in either direction — hedging everything (mechanisms included) into mush, or asserting everything (judgments included) with equal confidence. The author's calibration *by claim type* is the single most distinguishing tone trait.

## Situation-To-Tone Map

| Situation | The author's tone move | Evidence | AI default it replaces |
| --- | --- | --- | --- |
| Recommending a practice | direct imperative, then the reason — never hectoring | 「型を明示しましょう。…ためです」 (scoped_model) | recommendation without mechanism, or soft おすすめします stacks |
| Warning about real danger | escalates plainly, ends with an ellipsis | 「ビザのペナルティは人生レベルで響きます…。」 (ESTA) | exclamation marks and 「絶対に〜しないでください」 |
| Sharing an opinion | first-person ownership plus a scope disclaimer | 「僕はオフィスが会社だと思っていません」 after 「見解が違うかもしれません」 (remote work) | consensus framing (「一般的には〜とされています」) |
| Admitting weakness or failure | matter-of-fact, often with comedic timing | 「あまりきちんと答えられなかったので調査しつつ」 (CSP); 「$750くらいマイナスになりました」 (America) | omission — failures edited out |
| Enthusiasm | めちゃ-family intensifier plus concrete detail | 「めっちゃ楽しかったです」 + the list of cities (retro) | superlatives and exclamation marks |
| Gratitude | paired with apology or debt-awareness | 「皆様本当に申し訳ない…ありがとう…」 (Vancouver) | formulaic 感謝申し上げます |
| Addressing readers | closings only, warm and low-pressure | 「皆さんも良いお年をお迎えください。」 (retro) | mid-article reader address and rhetorical questions |
| Unresolved problems | openly asks for help | 「知っている方がいればぜひご一報ください…。」 (CSP) | projecting completeness, skipping the gap |
| Neutral explanation | hedges drop away; declarative polite prose | the ディレクティブ sections (CSP) | hedged mechanisms (impersonal 〜でしょう/〜とされています phrasing; 〜と考えられます appears once in the corpus) |
| Life-event narration | diary register, quoted self-talk, humor at own expense | 「『ぐう…』となり」「真似しちゃいけないと思う。」 (Vancouver) | polite retelling with the mess smoothed out |

## Emotion Handling

**The author's way:** emotional peaks get exactly one short expressive sentence — sometimes dropping to plain form inside a polite post (「今年も色々あったなぁ。」) — then the prose returns to baseline. Emotion is carried by trailing ellipses (「良い人すぎでは…。」「響きます…。」), not exclamation marks: the single ！ in all 15 posts sits inside quoted self-talk (「よっし向かうぞ！」), zero in narration. Emoji are nearly absent (one 😋 caption, a 🍣 shell prompt).

**AI default it replaces:** sustained enthusiasm across paragraphs, exclamation marks in narration, and emoji sprinkled for friendliness. Generic warmth is even; the author's warmth spikes and recedes.

## Humor And Self-Deprecation

**The author's way:** humor is dry, self-directed, and embedded in factual reporting — losses stated with numbers (「$750くらいマイナスになりました」), debts joked about (「出世払いの利息が怖いです」), rule-breaking confessed with a deadpan disclaimer (「夜道めっちゃ怖かった。真似しちゃいけないと思う。」). Image captions carry observational wit (「ハリウッドサインって意外と遠いことがわかった」). Never at anyone else's expense.

**AI default it replaces:** no self-deprecation at all — generic assistants sanitize embarrassing details away — or telegraphed jokes with （笑） markers. Preserving the author's humor during a rewrite matters as much as preserving his facts.

## Reader Relationship

**The author's way:** the reader is a peer who might hit the same problem. No agreement-fishing (ですよね: zero), no rhetorical reader questions, no mid-article addresses. Asks are low-pressure and concrete (feedback via Issue/Star, information about an unsolved problem). Advice defines who it applies to and admits its scope (「見解が違うかもしれません」).

**AI default it replaces:** service-industry framing — 「いかがでしたか？」「〜な方も多いのではないでしょうか」「参考になれば幸いです」 — which positions the reader as a customer to be satisfied rather than a peer to be informed.

## Authority Stance

**The author's way:** credibility is built by showing the work, including the failed parts — a code sample labeled ボツになったコード, an interview answer that went badly, terminal output pasted in full as proof, an unsolved problem stated as unsolved. Claims stay contextual (this project, this constraint, this year), never universal.

**AI default it replaces:** projecting completeness — clean solutions with the dead ends removed, universal claims (「〜する際は必ず〜すべきです」), and no admission of not knowing. The author's authority is experiential; erasing the rough edges erases the authority.

## Formality Manners

**The author's way:** presentation stays plain — no 【】brackets or emoji in titles and headings, headings that say something concrete (sometimes a full recommendation sentence), polite prose that stays conversational rather than 敬語-formal (〜でございます and 〜いたします are both measured at zero; the politest set phrase is 「よろしくお願いします」), and dated 追記 sections instead of silent edits when facts change.

**AI default it replaces:** decorated titles (【完全版】〜まとめ✨), formal business register (お世話になっております調), and silently rewritten content. The author's formality sits one notch casual of standard blog politeness, and corrections stay visible.
