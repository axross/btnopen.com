import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type { JSX } from "react";
import { LoadingPlaceholderText } from "@/components/loading-placeholder";
import { getActiveLocale } from "@/helpers/i18n";
import { getBlogPostAgentic } from "@/repositories/get-blog-post-agentic";
import css from "./blog-post-agentic-view.module.css";
import { MarkdownContent } from "./markdown-content";

export async function BlogPostAgenticView({
	slug: slugPromise,
	draft: draftPromise,
}: {
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
		<article className={css.agenticView} data-testid="page">
			<header className={css.header} data-testid="header">
				<h1 className={css.title} data-testid="title">
					{post.title}
				</h1>
			</header>

			<main className={css.content} data-testid="content">
				{isEmpty ? (
					<p className={css.empty} data-testid="empty">
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

// Loading placeholder that mirrors the agentic view's structure (title, then the
// outline / authoring-notes sections) so the streamed skeleton matches the
// content that replaces it, rather than the blog post's own header skeleton.
export function BlogPostAgenticViewLoading(): JSX.Element {
	return (
		<article className={css.agenticView} data-testid="page-loading">
			<header className={css.header} data-testid="header-loading">
				<h1 className={css.title}>
					<LoadingPlaceholderText
						sampleText="Lorem ipsum dolor sit amet"
						maxLines={2}
					/>
				</h1>
			</header>

			<main className={css.content} data-testid="content">
				<section className={css.section} data-testid="outline">
					<h2 className={css.sectionHeading}>
						<LoadingPlaceholderText sampleText="Outline" maxLines={1} />
					</h2>
					<p className={css.placeholderText}>
						<LoadingPlaceholderText
							sampleText="Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt"
							maxLines={4}
						/>
					</p>
				</section>

				<section className={css.section} data-testid="authoring-notes">
					<h2 className={css.sectionHeading}>
						<LoadingPlaceholderText sampleText="Authoring notes" maxLines={1} />
					</h2>
					<p className={css.placeholderText}>
						<LoadingPlaceholderText
							sampleText="Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore"
							maxLines={4}
						/>
					</p>
				</section>
			</main>
		</article>
	);
}
