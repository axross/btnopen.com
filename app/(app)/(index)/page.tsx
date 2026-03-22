import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { JSX } from "react";
import { Markdown } from "@/components/markdown";
import { getWebsite, type Website } from "@/repositories/get-website";
import { urlOrigin } from "@/runtime";
import { BlogJsonLd } from "./_components/blog-json-jd";
import { BrushGrunge } from "./_components/brush-grunge";
import { PostList } from "./_components/post-list";
import { SocialLinkList } from "./_components/social-link-list";
import css from "./page.module.css";

async function IndexPage() {
	const website = await getWebsite();

	if (!website) {
		notFound();
	}

	return (
		<>
			<div className={css.indexPage}>
				<IndexPageMain website={website} />
			</div>

			<BlogJsonLd website={website} />
		</>
	);
}

function IndexPageMain({ website }: { website: Website }): JSX.Element {
	return (
		<main className={css.main}>
			<section className={css.intro}>
				<div className={css.portrait}>
					<Image
						src="/images/bio.webp"
						alt={website.creator.name}
						width={1057}
						height={1080}
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
					<div className={css.bioContent}>
						<Markdown markdown={website.creator.bioMarkdown} />
					</div>

					<SocialLinkList />
				</div>
			</section>

			<section className={css.section}>
				<h1 className={css.sectionHeading}>{"Posts"}</h1>

				<PostList className={css.posts} />
			</section>
		</main>
	);
}

export async function generateMetadata(): Promise<Metadata> {
	const website = await getWebsite();

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
			title: website.name,
			description: website.description,
			siteName: website.name,
			type: "website",
			locale: "ja_JP",
		},
	};
}

export default IndexPage;
