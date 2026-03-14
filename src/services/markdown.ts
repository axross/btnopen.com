import rehypeShikiFromHighlighter from "@shikijs/rehype/core";
import type { Root as HastRoot } from "hast";
import type { Node as MdastNode, Root as MdastRoot } from "mdast";
import type { LeafDirective } from "mdast-util-directive";
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
import remarkDirective from "remark-directive";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { type Processor, unified } from "unified";
import { visit } from "unist-util-visit";
import { getSingletonHighlighter } from "@/services/shiki";
import { trackError } from "./error";

async function renderMarkdown({
	markdown,
	rehypeReactOptions,
}: {
	markdown: string;
	rehypeReactOptions: RehypeReactOptions;
}): Promise<JSX.Element> {
	const highlighter = await getSingletonHighlighter();
	const file = await unified()
		.use(remarkParse)
		.use(remarkDirective)
		.use(remarkPartialGfm)
		.use(remarkMedia)
		.use(remarkHashnodeEmbeds)
		.use(remarkRehype, {
			passThrough: ["leafDirective"],
			handlers: {
				leafDirective: (_state: unknown, node: LeafDirective) => ({
					type: "element",
					tagName: node.name,
					properties: node.attributes,
					children: node.children,
				}),
			},
			unknownHandler: (_state: unknown, node: MdastNode) => {
				trackError(
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

function remarkMedia() {
	return (tree: MdastRoot) => {
		visit(tree, "image", (node) => {
			console.log(node);
		});
	};
}

const embedRegex = /^%\[(.*)\]$/;

function remarkHashnodeEmbeds() {
	return (tree: MdastRoot) => {
		visit(tree, "paragraph", (node, index, parent) => {
			if (node.children.length === 1 && node.children[0].type === "text") {
				const match = node.children[0].value.match(embedRegex);

				if (!parent || index === undefined) {
					return;
				}

				if (match === null || !URL.canParse(match[1])) {
					return;
				}

				parent.children.splice(index, 1, {
					type: "leafDirective",
					name: "webembed",
					attributes: {
						href: match[1],
					},
					children: [],
				});
			}
		});
	};
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
