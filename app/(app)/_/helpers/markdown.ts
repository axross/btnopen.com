import "server-only";

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
import { gfmStrikethrough } from "micromark-extension-gfm-strikethrough";
import { gfmTable } from "micromark-extension-gfm-table";
import { combineExtensions } from "micromark-util-combine-extensions";
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
import { classifyLinkHref } from "@/helpers/link-href";
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
		.use(remarkParse)
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
			// shiki decorates its root <pre> with an inline `background-color` /
			// `color` pair and `tabindex="0"`. `<Snippet>` roots its own wrapper and
			// styles it from its CSS Module, and its `...props` spread would now
			// apply both: the inline colors reference variables this theme never
			// defines (so they'd invalidate the module's own background) and the
			// tabindex would make a non-scrolling wrapper focusable. suppress them
			// here, at the source, rather than discarding them in the component.
			rootStyle: false,
			tabindex: false,
		})
		.use(rehypeUnnestPre)
		.use(rehypeAllowedLinkProtocols)
		.use(rehypeReact, rehypeReactOptions)
		.process(markdown);

	return file.result;
}

function remarkPartialGfm(this: Processor<MdastRoot>) {
	// biome-ignore lint/suspicious/noExplicitAny: there's no way to better type this
	const data = this.data() as any;

	data.micromarkExtensions ??= [];
	data.fromMarkdownExtensions ??= [];

	data.micromarkExtensions.push(
		combineExtensions([gfmStrikethrough(), gfmTable()]),
	);
	data.fromMarkdownExtensions.push([
		gfmStrikethroughFromMarkdown(),
		gfmTableFromMarkdown(),
	]);
	// only the parse and MDAST levels are registered. the packages' third level
	// (`gfmStrikethroughHtml()` / `gfmTableHtml()`) is a micromark HTML-compiler
	// extension, and there is no HTML compiler here: this pipeline hands MDAST to
	// `remarkRehype` and compiles the HAST to React through `rehypeReact`. it is
	// also not the shape `toMarkdownExtensions` takes — that reads
	// `mdast-util-to-markdown` extensions, and nothing serializes back to
	// markdown either. same reasoning as `remark-cjk-friendly/parseOnly` above.
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

// nothing upstream restricts a link's protocol: `mdast-util-to-hast`'s link
// handler percent-encodes the destination through `normalizeUri` and never
// reads its scheme, so `javascript:` and `data:` survive the entire remark half
// intact — and the CMS stores them, because Payload's Lexical link field
// rejects only empty values and values containing a space. React happens to
// refuse a `javascript:` href, but that covers one scheme and is an internal of
// somebody else's library, so the allowlist lives here instead.
//
// this runs on HAST rather than MDAST deliberately: by now character references
// are decoded and `normalizeUri` has run, so the value inspected is the exact
// string that would become the DOM attribute. only the `href` is dropped, never
// the element, so the author's link text still renders — the same
// preserve-content-over-strictness posture as
// `remarkLiteralizeUnhandledDirectives`.
function rehypeAllowedLinkProtocols() {
	return (tree: HastRoot) => {
		visit(tree, "element", (node) => {
			if (node.tagName !== "a") {
				return;
			}

			const href = node.properties.href;

			if (typeof href !== "string") {
				return;
			}

			if (classifyLinkHref(href) === "blocked") {
				// `hast-util-to-jsx-runtime` skips a property whose value is
				// `undefined`, so this emits an anchor with no `href` at all.
				node.properties.href = undefined;
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
