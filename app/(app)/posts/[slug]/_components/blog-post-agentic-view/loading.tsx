import { clsx } from "clsx";
import type { ComponentProps, JSX } from "react";
import { LoadingPlaceholderText } from "@/components/loading-placeholder";
import css from "./loading.module.css";

/**
 * Mirrors the agentic view's structure (title, then the outline / authoring-notes
 * sections) so the streamed skeleton matches the content that replaces it, rather
 * than the blog post's own header skeleton. Every test id here carries a
 * `-loading` suffix, so an assertion that starts below the root can never match
 * the skeleton by accident.
 */
export function BlogPostAgenticViewLoading({
	className,
	...props
}: Omit<ComponentProps<"article">, "children">): JSX.Element {
	return (
		<article
			className={clsx(css.blogPostAgenticViewLoading, className)}
			{...props}
		>
			<header className={css.header} data-testid="header-loading">
				<h1 className={css.title}>
					<LoadingPlaceholderText
						sampleText="Lorem ipsum dolor sit amet"
						maxLines={2}
					/>
				</h1>
			</header>

			<main className={css.content} data-testid="content-loading">
				<section className={css.section} data-testid="outline-loading">
					<h2 className={css.sectionHeading}>
						<LoadingPlaceholderText sampleText="Outline" maxLines={1} />
					</h2>
					<p className={css.bodyText}>
						<LoadingPlaceholderText
							sampleText="Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt"
							maxLines={4}
						/>
					</p>
				</section>

				<section className={css.section} data-testid="authoring-notes-loading">
					<h2 className={css.sectionHeading}>
						<LoadingPlaceholderText sampleText="Authoring notes" maxLines={1} />
					</h2>
					<p className={css.bodyText}>
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
