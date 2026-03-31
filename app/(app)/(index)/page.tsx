import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { JSX } from "react";
import { Markdown } from "@/components/markdown";
import { resolveUrlOrigin } from "@/helpers/request";
import { getWebsite, type Website } from "@/repositories/get-website";
import { BlogJsonLd } from "./_components/blog-json-jd";
import { BrushGrunge } from "./_components/brush-grunge";
import { PostList } from "./_components/post-list";
import { SocialLinkList } from "./_components/social-link-list";
import css from "./page.module.css";
import type { PageProps } from "./page-props";

async function IndexPage({ searchParams }: PageProps) {
	const { draft } = await searchParams;
	const isDraft = draft === "true";
	const website = await getWebsite({ draft: isDraft });

	if (!website) {
		notFound();
	}

	return (
		<>
			<div className={css.indexPage} data-testid="page">
				<IndexPageMain website={website} draft={isDraft} />
			</div>

			<BlogJsonLd website={website} />
		</>
	);
}

function IndexPageMain({
	website,
	draft,
}: {
	website: Website;
	draft: boolean;
}): JSX.Element {
	return (
		<main className={css.main}>
			<section className={css.intro} data-testid="intro">
				<div className={css.portrait}>
					<Image
						src="/images/bio.webp"
						alt={website.creator.name}
						width={1057}
						height={1080}
						loading="eager"
						className={css.portraitForeground}
					/>

					<BrushGrunge aria-label="Background" className={css.portraitGrunge} />

					<BrushGrunge
						shadowOffsetX={-2}
						aria-label="Background"
						className={css.portraitGrungeGlitchFirst}
					/>

					<BrushGrunge
						shadowOffsetX={2}
						aria-label="Background"
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

			<section className={css.section}>
				<h1 className={css.sectionHeading}>{"Posts"}</h1>

				<PostList
					draft={draft}
					className={css.posts}
					data-testid="blog-posts"
				/>
			</section>
		</main>
	);
}

export async function generateMetadata(): Promise<Metadata> {
	const [urlOrigin, website] = await Promise.all([
		resolveUrlOrigin(),
		getWebsite(),
	]);

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
			locale: "ja_JP",
		},
	};
}

export default IndexPage;
