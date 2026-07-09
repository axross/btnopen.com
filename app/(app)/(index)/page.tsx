import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { type JSX, Suspense } from "react";
import { Markdown } from "@/components/markdown";
import {
	alternateOpenGraphLocales,
	openGraphLocaleByLocale,
} from "@/i18n/config";
import { getActiveLocale } from "@/i18n/get-active-locale";
import { getWebsite, type Website } from "@/repositories/get-website";
import { urlOrigin } from "@/runtime";
import { BlogJsonLd } from "./_components/blog-json-jd";
import { BlogPostList } from "./_components/blog-post-list";
import { BrushGrunge } from "./_components/brush-grunge";
import { SocialLinkList } from "./_components/social-link-list";
import css from "./page.module.css";
import type { PageProps } from "./page-props";

async function IndexPage({ searchParams }: PageProps): Promise<JSX.Element> {
	const draft = searchParams.then((params) => params.draft === "true");
	// resolve the locale inside the promise callback (not as an eagerly
	// evaluated argument) so the dynamic cookie read happens within the Suspense
	// boundaries that await `website`.
	const website = draft.then(async (isDraft) =>
		getWebsite({ draft: isDraft, locale: await getActiveLocale() }),
	);

	return (
		<>
			<div className={css.indexPage} data-testid="page">
				<Suspense>
					<IndexPageMain website={website} draft={draft} />
				</Suspense>
			</div>

			<Suspense>
				<BlogJsonLd website={website} />
			</Suspense>
		</>
	);
}

async function IndexPageMain({
	website: websitePromise,
	draft,
}: {
	website: Promise<Website | null>;
	draft?: Promise<boolean>;
}): Promise<JSX.Element> {
	const [website, t] = await Promise.all([
		websitePromise,
		getTranslations("index"),
	]);

	if (!website) {
		notFound();
	}

	return (
		<main className={css.main}>
			<h1 className={css.pageHeading}>{website.creator.name}</h1>

			<section
				className={css.intro}
				aria-label={t("introductionLabel")}
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

					<BrushGrunge className={css.portraitGrunge} />

					<BrushGrunge
						shadowOffsetX={-2}
						className={css.portraitGrungeGlitchFirst}
					/>

					<BrushGrunge
						shadowOffsetX={2}
						className={css.portraitGrungeGlitchSecond}
					/>
				</div>

				<div className={css.bio}>
					<div className={css.bioContent} data-testid="bio">
						<Markdown markdown={website.creator.bioMarkdown} />
					</div>

					<SocialLinkList data-testid="social-links" />
				</div>
			</section>

			<section className={css.section} aria-labelledby="posts-heading">
				{/* biome-ignore lint/correctness/useUniqueElementIds: stable anchor for this section's aria-labelledby; IndexPageMain renders once per page (and is an async server component where useId is unavailable), so there is no duplicate-id risk */}
				<h2 id="posts-heading" className={css.sectionHeading}>
					{t("postsHeading")}
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

export async function generateMetadata(): Promise<Metadata> {
	const locale = await getActiveLocale();
	const website = await getWebsite({ locale });

	if (!website) {
		notFound();
	}

	return {
		description: website.description,
		keywords: website.keywords,
		authors: [
			{
				name: website.creator.name,
				url: `${urlOrigin}/`,
			},
		],
		creator: website.creator.name,
		publisher: website.creator.name,
		openGraph: {
			url: urlOrigin,
			title: website.name,
			description: website.description,
			images: [
				{
					url: `${urlOrigin}/thumbnail.png`,
					width: 1200,
					height: 630,
				},
			],
			siteName: website.name,
			type: "website",
			locale: openGraphLocaleByLocale[locale],
			alternateLocale: alternateOpenGraphLocales(locale),
		},
	};
}

export default IndexPage;
