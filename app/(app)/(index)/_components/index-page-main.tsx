import { clsx } from "clsx";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type { ComponentProps, JSX } from "react";
import { Markdown } from "@/components/markdown";
import { getActiveLocale } from "@/helpers/i18n";
import type { Website } from "@/repositories/get-website";
import { BlogPostList } from "./blog-post-list";
import css from "./index-page-main.module.css";
import { SocialLinkList } from "./social-link-list";

/**
 * The index page's main region: the portrait and its brush-mark backdrop, the
 * CMS-authored bio, the social links, and the posts section.
 *
 * Its pending state is owned by the route-level `<Suspense>` in `page.tsx`
 * rather than by this component, so the skeleton that stands in for it is
 * `<IndexPageMainLoading>` beside this file rather than a `loading` sibling.
 */
export async function IndexPageMain({
	website: websitePromise,
	draft,
	className,
	...props
}: Omit<ComponentProps<"main">, "children"> & {
	website: Promise<Website | null>;
	draft?: Promise<boolean>;
}): Promise<JSX.Element> {
	const [website, t, locale] = await Promise.all([
		websitePromise,
		getTranslations("index"),
		// the bio is CMS-authored markdown, so it can grow an embed that formats a
		// date in the active locale. `<Markdown>` renders that inside a cache scope
		// and cannot resolve the locale itself, so it is resolved here — inside the
		// Suspense boundary this component already sits behind.
		getActiveLocale(),
	]);

	if (!website) {
		notFound();
	}

	return (
		<main className={clsx(css.indexPageMain, className)} {...props}>
			<h1 className={css.pageHeading}>{website.creator.name}</h1>

			<section
				className={css.intro}
				aria-label={t("introduction-label")}
				data-testid="intro"
			>
				<div className={css.portrait}>
					<Image
						src="/images/bio.webp"
						alt={website.creator.name}
						width={1057}
						height={1080}
						loading="eager"
						className={css.portraitForeground}
					/>

					{/* the brush-mark backdrop behind the portrait: a base layer plus
					    two offset glitch copies. the artwork is a CSS mask over
					    /images/brush-grunge.svg rather than markup, so these carry no
					    content of their own — see index-page-main.module.css. */}
					<div className={css.portraitGrunge} />

					<div className={css.portraitGrungeGlitchFirst} />

					<div className={css.portraitGrungeGlitchSecond} />
				</div>

				<div className={css.bio}>
					<div className={css.bioContent} data-testid="bio">
						<Markdown markdown={website.creator.bioMarkdown} locale={locale} />
					</div>

					<SocialLinkList data-testid="social-links" />
				</div>
			</section>

			<section className={css.section} aria-labelledby="posts-heading">
				{/* biome-ignore lint/correctness/useUniqueElementIds: stable anchor for this section's aria-labelledby; IndexPageMain renders once per page (and is an async server component where useId is unavailable), so there is no duplicate-id risk */}
				<h2 id="posts-heading" className={css.sectionHeading}>
					{t("posts-heading")}
				</h2>

				<BlogPostList
					draft={draft}
					className={css.blogPosts}
					data-testid="blog-posts"
				/>
			</section>
		</main>
	);
}
