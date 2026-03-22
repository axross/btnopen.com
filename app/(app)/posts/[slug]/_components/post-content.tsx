import { clsx } from "clsx";
import { type ComponentProps, type JSX, memo } from "react";
import { createIntrinsicComponent, Markdown } from "@/components/markdown";
import { rootLogger } from "@/logger";
import { getPostMarkdown } from "@/repositories/get-post-markdown";
import { Media } from "./media";
import css from "./post-content.module.css";
import { Snippet } from "./snippet";
import { WebEmbed } from "./webembed";

const logger = rootLogger.child({ module: "🖼️" });

export async function PostContent({
	slug,
	draft,
}: {
	slug: string;
	draft?: boolean;
}): Promise<JSX.Element | null> {
	const markdown = await getPostMarkdown({ slug, draft });

	if (!markdown) {
		return null;
	}

	return (
		<div className={css.postContent}>
			<Markdown markdown={markdown} components={components} />
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
	img: memo(({ src, className, ...props }: ComponentProps<"img">) => {
		if (!src) {
			logger.warn(
				"<PostContent> renders null for image element due to missing src attribute.",
			);

			return null;
		}

		return (
			<Media src={src} className={clsx(className, css.media)} {...props} />
		);
	}),
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
