# Author Expressions And Idioms

Expression- and idiom-level evidence of how the author writes, split out from the style corpus. The companion files cover [words and terms](./author-words-and-terms.md) and [tones and manners](./author-tones-and-manners.md); article shapes and register evidence live in [author-style-corpus.md](./author-style-corpus.md).

Author-side counts come from the 15 Medium posts (2018–2019) read in full on 2026-07-12. The "AI default" contrasts characterize phrasings that generic AI assistants habitually produce in Japanese blog prose — a calibration aid, not measured claims. Normative style rules stay in [writing-style-and-tone.md](./writing-style-and-tone.md).

## Openers

**The author's way:** one or two short sentences naming the trigger, then an intent-declaration verb — 書いてみます, 書いておきます, 共有します, まとめてみます, 振り返ってみます. Appears in the first paragraph of nearly every post.

> 「自分の認識が違ったので備忘録として書いておこうかなと。」
> 「この2つのパッケージにおけるハマりポイントなので書いておきます。」
> 「もう今年も終わりですね。ということで振り返ってみます。」

**AI default it replaces:** 「本記事では〜について解説します」「〜の方法をご紹介します」 — topic-announcement openers with no personal trigger. The author never announces the article; he explains why he is writing.

## Prohibit, Then Offer The Alternative

**The author's way:** a "don't" is almost always followed by a "do instead" — 代わりに appears 10 times across 6 posts, typically right after advising against something. Appears in advice and technical posts.

> 「'unsafe-inline' を…利用するのは避けましょう。代わりに、…SHA256ハッシュ値を…ソースとして利用できます。」 (CSP)
> 「バリバリ働いているエンジニアは基本的にあまり求人広告を見ません。…代わりに、『自分の会社のどういった点に対して興味を持ったのか』…をヒアリングしながら…」 (hiring)

**AI default it replaces:** a bare prohibition plus an abstract caution (「〜には注意が必要です」) with no concrete replacement action.

## Hedged Conclusions

**The author's way:** conclusions about judgment, prediction, or other people carry a personal hedge — 〜と思います (14, densest in the hiring post), 〜気がします, 〜かもしれません; plain-form 〜と思った in diaries. Mechanism explanations stay hedge-free (see [tones and manners](./author-tones-and-manners.md)).

> 「アピールしていく方が採用に繋がりやすい気がします。」
> 「皆さんも遊んでみると楽しいかもしれません。」

**AI default it replaces:** 「〜と言えるでしょう」「〜ではないでしょうか」 — impersonal or rhetorical hedges that put distance between the writer and the claim. The author's hedges keep the claim owned: *I* think, *I* might be wrong.

## Undesired-Consequence Cautions

**The author's way:** 〜てしまいます (7) marks what goes wrong if the reader ignores the advice, embedded in an explanatory sentence.

> 「オフィスに居ない者がメンバーではなくなってしまいます。」
> 「HTTPで配信されるJSファイルのサイズも肥大化してしまいます。」

**AI default it replaces:** 「〜する可能性があります」「〜に注意してください」 — probability statements or imperative warnings detached from the mechanism.

## Arrangements And Outcomes

**The author's way:** life events land as 〜ことになりました / 〜ことになった — the outcome-of-circumstances idiom. Appears in life logs and milestone notes.

> 「とりあえずは…クラスにTemporaryに入ることになって」
> 「料金そのままにリロケートしてくれることになった。」

## Try-And-See てみる

**The author's way:** investigation is narrated as attempts — the てみる family (including でみる conjugations like 遊んでみる) appears 12 times: five opener intent verbs (書いてみます, 振り返ってみます, まとめてみます) and seven mid-post try-and-see moves (「試してみました」「窓口で聞いてみたら…わかり」「使ってみたくて」「皆さんも遊んでみると楽しいかもしれません」). Actions are framed as experiments whose outcome was not known in advance, in both diaries and technical posts.

**AI default it replaces:** definite-sounding procedure narration (検証しました and 確認しました are measured at zero — the author's four 確認 uses are all reader-facing capability, 確認できます, never a narrated procedure step) that erases the tentative, lived texture of finding something out.

## Approximation Idioms

**The author's way:** fuzziness is marked honestly with 〜っぽい (4), 〜みたいな (3), 〜という感じ / 〜って感じ (3), and quantities take くらい (17): 「所謂『ハッカーズハウス』っぽい感じ」「車で9時間くらい」. Precise numbers appear only where precision matters (86日間, sha256 hashes).

**AI default it replaces:** formally hedged quantities (およそ〜, measured at zero in the corpus) and exact-sounding prose for impressions — generic assistants state approximations formally or not at all.

## Capability Statements

**The author's way:** feature introductions use 〜ことができます (9) — one per capability, followed by what it means for the reader. Not stacked; the surrounding prose carries the consequences.

## Definitional ものです And Emphatic のです

**The author's way:** the のです family totals 15 and decomposes cleanly: five concessive のですが, five 〜ものです, five emphatic のです. "What is X" introductions land on definitional 〜(できる/する)ものです (scoped_model, CSP, Flutter launch — one per technology; the Next.js post uses it for its verdict, 「充分に便利なものです」, and the essay for a provenance note):

> 「データを…飛び越えて受け渡すことができる仕組みを提供するものです。」 (scoped_model)
> 「リソースの読み込みをポリシーの宣言によって制限できるものです。」 (CSP)

And emphatic のです appears at argument peaks only — three times in the remote-work essay (「それらは些細な問題にすぎないのです。」), twice in the hiring post (「簡単に言うと『お金で解決できない』のです。」) — never sprinkled through neutral explanation.

**AI default it replaces:** flat 〜です definitions with no framing, or the opposite failure — のです/んです scattered as filler emphasis on ordinary sentences, which dilutes the peaks the author saves it for.

## Advisory Imperatives

**The author's way:** direct imperatives appear only in advice and technical posts — しましょう (6), 〜ようにしましょう, 〜てはいけません, 避けましょう — always paired with the reason (see the recommend-then-explain manner in [tones and manners](./author-tones-and-manners.md)). Never in life logs. べき belongs to this register too, always audience-scoped rather than universal: するべきです (2), 「知っておくべきだと思います」, and 「〜べきなのは言うまでもないです」 in the hiring post, plus the essay's 「防ぐべきなのはリモートワークに限った話ではありません」 — five べき in the corpus, none in the 必ず〜すべき absolute form.

> 「Providerウィジェット側で型を明示しましょう。」
> 「なんとなく『良い人が欲しいなぁ』と考えるだけで済ませてはいけません。」

**AI default it replaces:** softened recommendation stacks (「〜することをおすすめします」「〜するとよいでしょう」) that avoid committing to an imperative.

## Resilience And Aspiration

**The author's way:** なんとか〜 (3) opens or summarizes survival through difficulty (「なんとか生きてます」「なんとかなった」), and posts close with a concrete forward-looking 〜ていきたい(です) (「このまま200問、300問と続けていきたいです」「慢心せずに頑張っていきたい」).

**AI default it replaces:** generic resolve formulas (「今後も頑張ります」「引き続き精進してまいります」) with no concrete next thing.

## Closers

**The author's way:** five evidenced closing moves, chosen by post type —

- reader well-wish or invitation, only at the very end: 「皆さんも良いお年をお迎えください。」「皆さんも遊んでみると楽しいかもしれません。」
- low-pressure feedback ask: 「IssueやStarなどでのフィードバックは励みになるので是非よろしくお願いします。」
- open unresolved question: 「これは僕も解決法を見つけていないので、知っている方がいればぜひご一報ください…。」
- reporting-style sign-off joke: 「現場からは以上です。」
- verdict under a まとめ heading, once, in the Next.js evaluation post — it delivers the overall judgment plus when-to-use guidance (「妥協なく快適に作れてすごくいい感じです」「Nowが使えるなら…」), not a recap of the sections

**AI default it replaces:** 「いかがでしたか？」「参考になれば幸いです。」 (both zero), and a まとめ that merely restates the article. The author never summarizes for the sake of closing; the ending does something — wishes, asks, admits, jokes, or renders the verdict.

## Loose Enumeration

**The author's way:** 〜たり〜たりする strings loosely related activities or possibilities in every register — roughly 21 occurrences across 8 posts once あたり lookalikes are excluded. Retrospectives use it for the year's events (「アルゴリズムの勉強を始めたり…Flutterの再入門をしたりしていました。」), but the heaviest user is the hiring advice post (6), where it enumerates cautionary behaviors: 「採用面接をセッティングしてしまったり、無理に勧めたりしてしまったり」.

**AI default it replaces:** bulleted lists or 「まず〜、次に〜、最後に〜」 sequencing for material that is not actually sequential.
