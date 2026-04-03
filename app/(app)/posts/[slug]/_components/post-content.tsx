import type { JSX } from "react";
import { Markdown } from "@/components/markdown";
import { getPostMarkdown } from "@/repositories/get-post-markdown";
import css from "./post-content.module.css";

export async function PostContent({
	slug: slugPromise,
	draft: draftPromise,
}: {
	slug: Promise<string>;
	draft?: Promise<boolean>;
}): Promise<JSX.Element | null> {
	const [slug, draft] = await Promise.all([slugPromise, draftPromise]);
	const markdown = await getPostMarkdown({ slug, draft });

	if (!markdown) {
		return null;
	}

	return (
		<div className={css.postContent}>
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
	webembed: css.webembed,
};
