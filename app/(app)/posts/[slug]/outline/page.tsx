import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type { JSX } from "react";
import { Markdown } from "@/components/markdown";
import { getActiveLocale } from "@/helpers/i18n";
import { getBlogPostOutline } from "@/repositories/get-blog-post-outline";
import { markdownClassNames } from "../_components/blog-post-content";
import blogPostContentCss from "../_components/blog-post-content.module.css";
import css from "./page.module.css";
import type { PageProps } from "./page-props";

export default async function BlogPostOutlinePage({
	params,
	searchParams,
}: PageProps): Promise<JSX.Element> {
	const [{ slug }, { draft: draftParam }] = await Promise.all([
		params,
		searchParams,
	]);
	const draft = draftParam === "true";
	const locale = await getActiveLocale();
	const [post, t] = await Promise.all([
		getBlogPostOutline({ slug, draft, locale }),
		getTranslations("outline"),
	]);

	if (!post) {
		notFound();
	}

	const outline = post.outline?.trim();

	return (
		<article className={css.outlinePage} data-testid="page">
			<header className={css.header} data-testid="header">
				<p className={css.eyebrow}>{t("label")}</p>
				<h1 className={css.title} data-testid="title">
					{post.title}
				</h1>
			</header>

			<main className={css.content} data-testid="content">
				{outline ? (
					<div className={blogPostContentCss.blogPostContent}>
						<Markdown markdown={outline} classNames={markdownClassNames} />
					</div>
				) : (
					<p className={css.empty} data-testid="empty">
						{t("empty")}
					</p>
				)}
			</main>
		</article>
	);
}

export async function generateMetadata({
	params,
	searchParams,
}: PageProps): Promise<Metadata> {
	const [{ slug }, { draft: draftParam }] = await Promise.all([
		params,
		searchParams,
	]);
	const draft = draftParam === "true";
	const locale = await getActiveLocale();
	const [post, t] = await Promise.all([
		getBlogPostOutline({ slug, draft, locale }),
		getTranslations("outline"),
	]);

	if (!post) {
		notFound();
	}

	return {
		title: `${t("label")}: ${post.title}`,
		// the outline is an authoring artifact that is never meant for public
		// indexing (it is also absent from the sitemap), so this route opts out of
		// the layout's global `index: true`.
		robots: {
			index: false,
			follow: false,
		},
	};
}
