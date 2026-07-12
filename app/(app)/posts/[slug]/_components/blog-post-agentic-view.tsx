import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type { JSX } from "react";
import { Markdown } from "@/components/markdown";
import { getActiveLocale } from "@/helpers/i18n";
import { getBlogPostAgentic } from "@/repositories/get-blog-post-agentic";
import css from "./blog-post-agentic-view.module.css";
import { markdownClassNames } from "./blog-post-content";
import blogPostContentCss from "./blog-post-content.module.css";

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

	const summary = post.summary?.trim();
	const outline = post.outline?.trim();
	// pretty-print the arbitrary authoring-loop JSON for a faithful, copyable view
	// of any shape; `null` means the field is unset and the section is omitted.
	const status =
		post.agenticStatus == null
			? null
			: JSON.stringify(post.agenticStatus, null, 2);

	const isEmpty = !summary && !outline && !status;

	return (
		<article className={css.agenticView} data-testid="page">
			<header className={css.header} data-testid="header">
				<p className={css.eyebrow}>{t("label")}</p>
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
						{summary ? (
							<section className={css.section} data-testid="summary">
								<h2 className={css.sectionHeading}>{t("summary-heading")}</h2>
								<p className={css.summary}>{summary}</p>
							</section>
						) : null}

						{outline ? (
							<section className={css.section} data-testid="outline">
								<h2 className={css.sectionHeading}>{t("outline-heading")}</h2>
								<div className={blogPostContentCss.blogPostContent}>
									<Markdown
										markdown={outline}
										classNames={markdownClassNames}
									/>
								</div>
							</section>
						) : null}

						{status ? (
							<section className={css.section} data-testid="status">
								<h2 className={css.sectionHeading}>{t("status-heading")}</h2>
								<pre className={css.status}>{status}</pre>
							</section>
						) : null}
					</>
				)}
			</main>
		</article>
	);
}
