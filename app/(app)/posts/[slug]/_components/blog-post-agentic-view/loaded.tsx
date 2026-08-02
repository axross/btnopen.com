import { clsx } from "clsx";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type { ComponentProps, JSX } from "react";
import { getActiveLocale } from "@/helpers/i18n";
import { getBlogPostAgentic } from "@/repositories/get-blog-post-agentic";
import { MarkdownContent } from "../markdown-content";
import css from "./loaded.module.css";

export async function BlogPostAgenticViewLoaded({
	slug: slugPromise,
	draft: draftPromise,
	className,
	...props
}: Omit<ComponentProps<"article">, "children"> & {
	slug: Promise<string>;
	draft: Promise<boolean>;
}): Promise<JSX.Element> {
	const [slug, draft, locale] = await Promise.all([
		slugPromise,
		draftPromise,
		getActiveLocale(),
	]);
	const [post, t] = await Promise.all([
		getBlogPostAgentic({ slug, draft, locale }),
		getTranslations("agentic"),
	]);

	if (!post) {
		notFound();
	}

	const outline = post.outline?.trim();
	const authoringNotes = post.authoringNotes?.trim();

	const isEmpty = !outline && !authoringNotes;

	return (
		<article
			className={clsx(css.blogPostAgenticViewLoaded, className)}
			{...props}
		>
			<header className={css.header} data-testid="header">
				<h1 className={css.title} data-testid="title">
					{post.title}
				</h1>
			</header>

			<main className={css.content} data-testid="content">
				{isEmpty ? (
					<p className={css.bodyText} data-testid="empty">
						{t("empty")}
					</p>
				) : (
					<>
						{outline ? (
							<section className={css.section} data-testid="outline">
								<h2 className={css.sectionHeading}>{t("outline-heading")}</h2>
								<MarkdownContent markdown={outline} />
							</section>
						) : null}

						{authoringNotes ? (
							<section className={css.section} data-testid="authoring-notes">
								<h2 className={css.sectionHeading}>
									{t("authoring-notes-heading")}
								</h2>
								<MarkdownContent markdown={authoringNotes} />
							</section>
						) : null}
					</>
				)}
			</main>
		</article>
	);
}
