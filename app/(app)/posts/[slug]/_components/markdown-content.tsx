import type { JSX } from "react";
import { Markdown } from "@/components/markdown";
import css from "./markdown-content.module.css";

/**
 * The styled markdown container shared by the blog post body and the agentic
 * (LLM) view. It wraps the rendered markdown in the reading-column container and
 * maps every markdown element to this module's classes. Data fetching stays in
 * the callers; this component only presents a markdown string.
 */
export function MarkdownContent({
	markdown,
}: {
	markdown: string;
}): JSX.Element {
	return (
		<div className={css.markdownContent}>
			<Markdown markdown={markdown} classNames={markdownClassNames} />
		</div>
	);
}

const markdownClassNames = {
	a: css.a,
	h1: css.h1,
	h2: css.h2,
	h3: css.h3,
	h4: css.h4,
	h5: css.h5,
	h6: css.h6,
	p: css.p,
	ul: css.ul,
	ol: css.ol,
	li: css.li,
	blockquote: css.blockquote,
	hr: css.hr,
	img: css.media,
	pre: css.snippet,
	code: css.code,
	strong: css.strong,
	em: css.em,
	del: css.del,
	table: css.table,
	tableWrapper: css.tableWrapper,
	tableScrollArea: css.tableScrollArea,
	tableScrollbar: css.tableScrollbar,
	tableScrollbarThumb: css.tableScrollbarThumb,
	thead: css.thead,
	tbody: css.tbody,
	tr: css.tr,
	th: css.th,
	td: css.td,
	embed: css.embed,
	banner: css.banner,
};
