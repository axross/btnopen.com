"use server";

import { captureException } from "@sentry/nextjs";
import rehypeShikiFromHighlighter from "@shikijs/rehype/core";
import type { ElementContent, Root as HastRoot } from "hast";
import type {
	Node as MdastNode,
	Paragraph as MdastParagraph,
	Root as MdastRoot,
	Text as MdastText,
} from "mdast";
import type {
	ContainerDirective,
	LeafDirective,
	TextDirective,
} from "mdast-util-directive";
import { gfmStrikethroughFromMarkdown } from "mdast-util-gfm-strikethrough";
import { gfmTableFromMarkdown } from "mdast-util-gfm-table";
import {
	gfmStrikethrough,
	gfmStrikethroughHtml,
} from "micromark-extension-gfm-strikethrough";
import { gfmTable, gfmTableHtml } from "micromark-extension-gfm-table";
import {
	combineExtensions,
	combineHtmlExtensions,
} from "micromark-util-combine-extensions";
import type { JSX } from "react";
import rehypeReact, { type Options as RehypeReactOptions } from "rehype-react";
// the `parseOnly` entry point adds only the micromark parse-side extension; this
// pipeline compiles to React via `rehypeReact` and never serializes back to
// markdown, so the package's serializer half would be dead weight.
import remarkCjkFriendly from "remark-cjk-friendly/parseOnly";
import remarkDirective from "remark-directive";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { type Processor, unified } from "unified";
import { SKIP, visit } from "unist-util-visit";
import { getSingletonHighlighter } from "@/helpers/shiki";

async function renderMarkdown({
	markdown,
	rehypeReactOptions,
}: {
	markdown: string;
	rehypeReactOptions: RehypeReactOptions;
}): Promise<JSX.Element> {
	const highlighter = await getSingletonHighlighter();
	const file = await unified()
		.use(remarkParse, { allowDangerousProtocol: true })
		// amends CommonMark emphasis flanking rules so `**bold**` still closes when
		// the delimiter neighbours CJK punctuation (e.g. `**…。**続き`), which the
		// Lexical→markdown serializer emits verbatim for Japanese prose. must run
		// after `remarkParse` (it extends the parser) and before `remarkRehype`.
		.use(remarkCjkFriendly)
		.use(remarkDirective)
		.use(remarkPartialGfm)
		.use(remarkEmbeds)
		.use(remarkLiteralizeUnhandledDirectives, markdown)
		.use(remarkRehype, {
			passThrough: ["leafDirective", "containerDirective"],
			handlers: {
				leafDirective: (_state: unknown, node: LeafDirective) => ({
					type: "element",
					tagName: node.name,
					properties: node.attributes,
					children: node.children,
				}),
				// a container directive (e.g. `:::banner{…}`) wraps block-level
				// content, so its children are real mdast nodes that must be
				// recursively converted to HAST via `state.all` — unlike the leaf
				// directive above, whose children are always empty.
				containerDirective: (
					state: { all: (node: ContainerDirective) => ElementContent[] },
					node: ContainerDirective,
				) => ({
					type: "element",
					tagName: node.name,
					properties: node.attributes ?? {},
					children: state.all(node),
				}),
			},
			unknownHandler: (_state: unknown, node: MdastNode) => {
				captureException(
					new Error(`Handled unknown mdast node (type: ${node.type}).`),
				);
			},
		})
		.use(rehypeShikiFromHighlighter, highlighter, {
			theme: "css-variables",
		})
		.use(rehypeUnnestPre)
		.use(rehypeReact, rehypeReactOptions)
		.process(markdown);

	return file.result;
}

function remarkPartialGfm(this: Processor<MdastRoot>) {
	// biome-ignore lint/suspicious/noExplicitAny: there's no way to better type this
	const data = this.data() as any;

	data.micromarkExtensions ??= [];
	data.fromMarkdownExtensions ??= [];
	data.toMarkdownExtensions ??= [];

	data.micromarkExtensions.push(
		combineExtensions([gfmStrikethrough(), gfmTable()]),
	);
	data.fromMarkdownExtensions.push([
		gfmStrikethroughFromMarkdown(),
		gfmTableFromMarkdown(),
	]);
	data.toMarkdownExtensions.push(
		combineHtmlExtensions([gfmStrikethroughHtml(), gfmTableHtml()]),
	);
}

function remarkEmbeds() {
	return (tree: MdastRoot) => {
		visit(tree, "paragraph", (node, index, parent) => {
			if (
				parent?.type !== "root" ||
				index === undefined ||
				node.children.length !== 1
			) {
				return;
			}

			const firstChild = node.children[0];

			if (firstChild.type !== "link" || firstChild.children.length !== 1) {
				return;
			}

			const firstGrandChild = firstChild.children[0];

			if (firstGrandChild.type !== "text") {
				return;
			}

			const href = firstChild.url;
			const title = firstGrandChild.value;

			if (!URL.canParse(href)) {
				return;
			}

			parent.children.splice(index, 1, {
				type: "leafDirective",
				name: "embed",
				attributes: { url: href, type: "webpage", title },
				children: [],
			});
		});
	};
}

// `remark-directive` parses any inline `:name` as a `textDirective` and any
// `:::name` fence as a `containerDirective`. The pipeline only treats
// `leafDirective` as a feature, so — without this plugin — those two kinds fall
// to `remarkRehype`'s `unknownHandler`, which drops them and reports to Sentry.
// That silently erases authorial prose whenever a post happens to contain a
// colon-word (`TypeScript:strict`) or a `:::` fence. To preserve content over
// strictness, replace each such node with its verbatim source characters
// (sliced from the original markdown via the node's position) so the text
// renders exactly as written and never reaches the unknown-node path. The
// original markdown is passed in as the plugin option: its offsets line up with
// the parser input, so the node positions index straight into it.
function remarkLiteralizeUnhandledDirectives(source: string) {
	return (tree: MdastRoot) => {
		visit(tree, "textDirective", (node, index, parent) => {
			if (parent === undefined || index === undefined) {
				return;
			}

			const raw = sliceDirectiveSource(node, source);

			if (raw === undefined) {
				return;
			}

			const text: MdastText = { type: "text", value: raw };
			parent.children[index] = text;

			return SKIP;
		});

		visit(tree, "containerDirective", (node, index, parent) => {
			if (parent === undefined || index === undefined) {
				return;
			}

			// `banner` is a handled container directive rendered downstream (see the
			// `containerDirective` handler in `renderMarkdown`); leave it intact
			// instead of literalizing it to plain text.
			if (node.name === "banner") {
				return;
			}

			const raw = sliceDirectiveSource(node, source);

			if (raw === undefined) {
				return;
			}

			// a container is block-level, so its literal text is wrapped in a
			// paragraph; the raw slice spans the whole `:::name … :::` fence.
			const paragraph: MdastParagraph = {
				type: "paragraph",
				children: [{ type: "text", value: raw }],
			};
			parent.children[index] = paragraph;

			return SKIP;
		});
	};
}

function sliceDirectiveSource(
	node: ContainerDirective | TextDirective,
	source: string,
): string | undefined {
	const start = node.position?.start.offset;
	const end = node.position?.end.offset;

	if (start === undefined || end === undefined) {
		return;
	}

	return source.slice(start, end);
}

function rehypeUnnestPre() {
	return (tree: HastRoot) => {
		visit(tree, "element", (node) => {
			if (
				node.tagName === "pre" &&
				node.children.length === 1 &&
				node.children[0].type === "element" &&
				node.children[0].tagName === "code"
			) {
				node.children = node.children[0].children;
			}
		});
	};
}

export { renderMarkdown };
