# Markdown Example: 実装メモを記事として残す

Markdown の確認用記事は、構文を並べるだけだとすぐ読まれなくなる。この記事では、このブログの Markdown レンダラーを点検しながら、実装メモとしても使える形に整える。

前提は単純で、Payload CMS の Lexical エディターに保存した本文を Markdown に戻し、Next.js 側で `remark` / `rehype` のパイプラインに通して表示する。つまり、**書けること**と*表示で意味を持つこと*を分けて見る必要がある。

> サンプル記事でも、読者にとって意味のある制約と判断材料を残す。構文の網羅は目的ではなく、記事の副産物として満たす。

## まず確認する範囲

このブログで特に見たいのは、次のような実運用の材料だ。

- 見出しで話題を分ける
- 箇条書きで確認手順を残す
    - 子項目は 4 スペースでインデントする
    - 2 スペースだと Payload の Markdown 変換で平坦化されやすい
- テーブルで比較や判断を横に並べる
- コードブロックで再現できる最小例を残す
- 画像と Web 埋め込みで、文章だけでは伝わりにくい状態を補う

作業順はこのくらいに絞る。

1. Payload の `editor` 設定で有効な Feature を確認する
2. Markdown から Lexical へ変換したときの落ち方を見る
3. Lexical から Markdown に戻した出力をレンダラーで読む
4. 見た目の都合だけでなく、本文として自然かを見直す

### 変換で落としやすいもの

Payload の既定 Feature にはチェックリストや整列などもある。ただし、このサイトの表示パイプラインでは GFM 全体ではなく、表と `~~取り消し線~~` を中心に扱っている。だから、この記事では「エディターで編集できる」だけのものを無理に本文へ入れない。

#### 本文側で優先する判断

本文では `Payload`, `Lexical`, `remarkRehype` のような識別子をそのまま出す。**太字**は重要な判断に、*斜体*は補足的なニュアンスに、~~あとで消す予定の断言~~は撤回済みの選択肢に使う。`inline code` は短いファイル名やコマンドだけに限定する。

##### 細かい見出しを使う場面

深い見出しは多用しない。付録や細かい条件を分けたいときだけ使う。ここでは、構文としての深い見出しが壊れないかを見るために一段だけ残している。

## 外部情報は本文から離しすぎない

Payload 側の Rich Text Feature は公式ドキュメントで確認する。たとえば [Payload の Official Features](https://payloadcms.com/docs/rich-text/official-features) では、見出し、リンク、引用、アップロード、テーブルなどの Feature がどう扱われるかを追える。

記事の中であとから読み返す価値がある外部記事は、段落内リンクではなく埋め込みにしておくと探しやすい。

::webembed{href=https://zenn.dev/uma002/articles/architecture-abstraction-patterns}

埋め込みは便利だが、本文の主張そのものを外部ページに預けない。リンク先が消えても、この記事だけで最低限の判断ができるようにする。

## スクリーンショットを置く位置

UI やレンダリングの話では、文章だけより画像が早いことがある。ここではシード用のメディアを置いて、アップロードノードが本文の途中で崩れないことも確認する。

![media:019d1223-94d4-754c-8f57-47337be15c9e]()

画像の前後には、何を見ればよいかを書いておく。代替テキストも、装飾か説明かを分けて考える。

## コードは小さく、実際の境界を写す

このブログの表示側は、本文を Markdown に戻してから React コンポーネントへ変換している。実装メモとして残すなら、全体を貼るより境界だけを示したほうが読みやすい。

```ts
type MarkdownRenderInput = {
	markdown: string;
	classNames?: Partial<Record<string, string>>;
};

export async function renderPostBody({
	markdown,
	classNames = {},
}: MarkdownRenderInput) {
	const normalized = markdown.trim();

	if (normalized.length === 0) {
		return null;
	}

	return renderMarkdown({
		markdown: normalized,
		rehypeReactOptions: await getRehypeReactOptions({ classNames }),
	});
}
```

`trim()` のような小さな処理でも、空本文をどう扱うかという判断が入る。コードブロックには、そういう判断が読み取れる部分だけを載せる。

## 表は判断を圧縮するために使う

表は「列で比べると早い」情報だけに使う。ここでは実装確認でよく見る七つの形を、本文の流れに沿って置いている。

### 小さな対応表

| 確認したい観点 | 使う材料 | 見る場所 |
| --- | --- | --- |
| 変換 | Markdown と Lexical の往復 | `payload/helpers/editor.ts` |
| 表示 | React コンポーネントへの割り当て | `app/(app)/_/components/markdown.tsx` |
| 見た目 | 余白、横スクロール、コードの色 | `blog-post-content.module.css` |

### 横に長い比較

| 機能 | Markdown 入力 | Payload Lexical | Markdown 出力 | React 表示 | 注意点 | この記事での使い方 |
| --- | --- | --- | --- | --- | --- | --- |
| 見出し | `## 見出し` | heading node | `## 見出し` | `h2` | 階層を飛ばさない | セクション分割 |
| リスト | `- item` | list node | `- item` | `ul` / `ol` | 子リストは 4 スペース | 手順と判断材料 |
| 画像 | `[media:id]()` | upload node | `![alt](/api/media/file/...)` | `Media` | 先頭の `!` で upload node になる | スクリーンショット |
| コード | fenced block | code block | fenced block | `Snippet` | 言語名は Shiki に渡る | 最小コード例 |
| 表 | pipe table | table node | pipe table | `Table` | alignment は往復で落ちる | 比較と棚卸し |
| 埋め込み | directive | paragraph text | directive | `WebEmbed` | 外部取得に失敗する可能性 | 参考リンク |

### 数値を見るための表

| 指標 | 判定 | 値 |
| --- | --- | --- |
| First Contentful Paint | Good | 1200 |
| Largest Contentful Paint | Needs work | 3450 |
| Interaction to Next Paint | Poor | 812 |
| Cumulative Layout Shift | Good | 0.04 |

表の位置揃えは Markdown では書けるが、Payload の往復では保持されない。見た目を揃えたい場合は、本文データではなく表示コンポーネント側の責務に寄せる。

### セル内のインライン要素

| API | 判断 | 参照 | 例 |
| --- | --- | --- | --- |
| `Array.prototype.map` | **安定**していて、配列変換の第一候補にしやすい | [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map) | `items.map((item) => item.id)` |
| `Array.prototype.flatMap` | *一段だけ* flatten したいときに読みやすい | [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/flatMap) | `rows.flatMap((row) => row.cells)` |
| `Array.prototype.group` | ~~今すぐ使う~~ ではなく、環境と仕様を確認する | [TC39](https://github.com/tc39/proposal-array-grouping) | `Object.groupBy(items, getKind)` |
| `String.prototype.at` | 負のインデックスを使う意図が明確なら便利 | [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/at) | `"こんにちは".at(-1)` |

### まだ値を入れない表

| 未確認の観点 | 担当 | メモ |
| --- | --- | --- |

この形は、あとで埋める前提のテンプレートとして使う。本文中に置くなら、空である理由も一緒に書く。

### 一列だけで足りる表

| 対象ランタイム |
| --- |
| Node.js |
| Bun |
| Deno |

横に比べるものがないなら、無理に列を増やさない。

### 空セルを含む表

| 項目 | 値 |
| --- | --- |
| タイトル | Markdown Example |
| 目的 | 実装メモとして読める構文確認 |
| 未定の担当 |  |

空セルは「未入力」を表すためにだけ使う。読み手が欠落か意図か迷うなら、本文で補足する。

## 最後に見るチェックポイント

記事として読めるかは、次の順番で見る。

1. 最初の段落だけで、何を確認する記事か分かるか
2. 見出しが構文名ではなく、判断の単位になっているか
3. 表やコードが本文の説明を短くしているか
4. リンクと埋め込みが、主張の代わりではなく補助になっているか
5. 画像が装飾ではなく、確認したい状態を示しているか

---

構文確認用の記事でも、実装の制約、落とし穴、判断の理由を書けば、あとから読み返せるメモになる。Markdown の機能をすべて目立たせるより、必要な場所で自然に使うほうが、結果としてレンダラーの確認にもなる。
