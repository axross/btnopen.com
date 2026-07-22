import type { JSX } from "react";
import { getActiveLocale } from "@/helpers/i18n";
import { getBlogPostMarkdown } from "@/repositories/get-blog-post-markdown";
import { MarkdownContent } from "./markdown-content";

export async function BlogPostContent({
	slug: slugPromise,
	draft: draftPromise,
}: {
	slug: Promise<string>;
	draft?: Promise<boolean>;
}): Promise<JSX.Element | null> {
	const [slug, draft, locale] = await Promise.all([
		slugPromise,
		draftPromise,
		getActiveLocale(),
	]);
	const markdown = await getBlogPostMarkdown({ slug, draft, locale });

	if (!markdown) {
		return null;
	}

	return <MarkdownContent markdown={markdown} />;
}
