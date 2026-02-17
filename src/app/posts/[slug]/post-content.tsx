import { clsx } from "clsx";
import { type ComponentProps, memo } from "react";
import { createIntrinsicComponent, Markdown } from "@/components/markdown";
import css from "./post-content.module.css";
import { Snippet } from "./snippet";
import { WebEmbed } from "./webembed";

export async function PostContent({ markdown }: { markdown: string }) {
	return (
		<div className={css.postContent}>
			<Markdown
				markdown={markdown.replaceAll(/ align="(center|left|right)"/g, "")}
				components={components}
			/>
		</div>
	);
}

const components = {
	a: createIntrinsicComponent("a", css.a),
	h1: createIntrinsicComponent("h1", css.h1),
	h2: createIntrinsicComponent("h2", css.h2),
	h3: createIntrinsicComponent("h3", css.h3),
	h4: createIntrinsicComponent("h4", css.h4),
	h5: createIntrinsicComponent("h5", css.h5),
	h6: createIntrinsicComponent("h6", css.h6),
	p: createIntrinsicComponent("p", css.p),
	ul: createIntrinsicComponent("ul", css.ul),
	ol: createIntrinsicComponent("ol", css.ol),
	li: createIntrinsicComponent("li", css.li),
	blockquote: createIntrinsicComponent("blockquote", css.blockquote),
	hr: createIntrinsicComponent("hr", css.hr),
	img: createIntrinsicComponent("img", css.img),
	pre: memo(({ className, ...props }: ComponentProps<"pre">) => (
		<Snippet className={clsx(className, css.snippet)} {...props} />
	)),
	code: createIntrinsicComponent("code", css.code),
	strong: createIntrinsicComponent("strong", css.strong),
	em: createIntrinsicComponent("em", css.em),
	del: createIntrinsicComponent("del", css.del),
	webembed: memo(({ className, ...props }: ComponentProps<typeof WebEmbed>) => (
		<WebEmbed className={clsx(className, css.webembed)} {...props} />
	)),
};
