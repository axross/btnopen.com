import type { Metadata } from "next";
import { cacheLife } from "next/cache";
import Image from "next/image";
import { Markdown } from "@/components/markdown";
import { urlOrigin } from "@/config";
import { BlogJsonLd } from "./_components/blog-json-jd";
import { BrushGrunge } from "./_components/brush-grunge";
import { PostList } from "./_components/post-list";
import { SocialLinkList } from "./_components/social-link-list";
import { getGlobalAuthor } from "./_fetcher/get-global-author";
import css from "./page.module.css";

async function IndexPage() {
	const globalAuthor = await getGlobalAuthor();

	return (
		<>
			<div className={css.indexPage}>
				<main className={css.main}>
					<section className={css.intro}>
						<div className={css.portrait}>
							<Image
								src="/images/bio.webp"
								alt={globalAuthor.name}
								width={1057}
								height={1080}
								className={css.portraitForeground}
							/>

							<BrushGrunge
								aria-label="Background"
								className={css.portraitGrunge}
							/>

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
								<Markdown markdown={globalAuthor.bioMarkdown} />
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

	const globalAuthor = await getGlobalAuthor();

	return {
		description: "",
		keywords: [
			"axross",
			"Kohei Asai",
			"ソフトウェアエンジニア",
			"バンクーバー",
			"ブログ",
		],
		authors: [
			{
				name: globalAuthor.name,
				url: urlOrigin,
			},
		],
		creator: globalAuthor.name,
		publisher: globalAuthor.name,
		openGraph: {
			title: "btnopen.com",
			description: "",
			siteName: "btnopen.com",
			type: "website",
			locale: "ja_JP",
		},
	};
}

export default IndexPage;
