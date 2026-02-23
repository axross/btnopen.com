import type { Metadata } from "next";
import { cacheLife } from "next/cache";
import Image from "next/image";
import { Markdown } from "@/components/markdown";
import { urlOrigin } from "@/config";
import { BlogJsonLd } from "./_components/blog-json-jd";
import {
	BrushGrunge,
	BrushGrungeLeftOutline,
	BrushGrungeRightOutline,
} from "./_components/brush-grunge";
import { PostList } from "./_components/post-list";
import { SocialLinkList } from "./_components/social-link-list";
import { getPublication } from "./_fetcher/get-publication";
import css from "./page.module.css";

async function IndexPage() {
	const publication = await getPublication();

	return (
		<>
			<div className={css.indexPage}>
				<main className={css.main}>
					<section className={css.intro}>
						<div className={css.portrait}>
							<Image
								src="/images/bio.webp"
								alt={publication.author.name}
								width={1057}
								height={1080}
								className={css.portraitForeground}
							/>

							<BrushGrunge
								aria-label="Background"
								className={css.portraitGrunge}
							/>

							<BrushGrungeLeftOutline
								aria-label="Background"
								className={css.portraitGrungeGlitchFirst}
							/>

							<BrushGrungeRightOutline
								aria-label="Background"
								className={css.portraitGrungeGlitchSecond}
							/>
						</div>

						<div className={css.bio}>
							<div className={css.bioContent}>
								<Markdown markdown={publication.about.markdown} />
							</div>

							<SocialLinkList />
						</div>
					</section>

					<section className={css.section}>
						<h1 className={css.sectionHeading}>{"Posts"}</h1>

						<PostList className={css.posts} />
					</section>
				</main>
			</div>

			<BlogJsonLd />
		</>
	);
}

export async function generateMetadata(): Promise<Metadata> {
	"use cache";

	cacheLife("hours");

	const publication = await getPublication();

	return {
		description: publication.descriptionSEO ?? undefined,
		keywords: [
			"axross",
			"Kohei Asai",
			"ソフトウェアエンジニア",
			"バンクーバー",
			"ブログ",
		],
		authors: [
			{
				name: publication.author.name,
				url:
					publication.author.socialMediaLinks?.website ??
					publication.author.socialMediaLinks?.github ??
					urlOrigin,
			},
		],
		creator: publication.author.name,
		publisher: publication.author.name,
		openGraph: {
			title: publication.title,
			description: publication.descriptionSEO ?? undefined,
			siteName: publication.title,
			type: "website",
			locale: "ja_JP",
		},
	};
}

export default IndexPage;
