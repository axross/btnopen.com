import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { type JSX, Suspense } from "react";
import {
	alternateOpenGraphLocales,
	getActiveLocale,
	openGraphLocaleByLocale,
} from "@/helpers/i18n";
import { thumbnailHeight, thumbnailWidth } from "@/helpers/thumbnail";
import { getWebsite } from "@/repositories/get-website";
import { urlOrigin } from "@/runtime";
import { BlogJsonLd } from "./_components/blog-json-ld";
import { IndexPageMain } from "./_components/index-page-main";
import { IndexPageMainLoading } from "./_components/index-page-main-loading";
import css from "./page.module.css";
import type { PageProps } from "./page-props";

async function IndexPage({ searchParams }: PageProps): Promise<JSX.Element> {
	const draft = searchParams.then((params) => params.draft === "true");
	// chain off `getActiveLocale()` rather than awaiting it here (it does nothing
	// before its own first `await`) so the dynamic cookie read happens within the
	// Suspense boundaries that await `website`.
	const website = getActiveLocale().then((locale) => getWebsite({ locale }));

	return (
		<>
			<div className={css.indexPage} data-testid="page">
				<Suspense fallback={<IndexPageMainLoading />}>
					<IndexPageMain website={website} draft={draft} />
				</Suspense>
			</div>

			{/* no fallback: a JSON-LD injector renders a <script> and no visible
			    content, so there is nothing for a skeleton to stand in for. */}
			<Suspense>
				<BlogJsonLd website={website} />
			</Suspense>
		</>
	);
}

export async function generateMetadata({
	searchParams,
}: PageProps): Promise<Metadata> {
	const [{ draft }, locale] = await Promise.all([
		searchParams,
		getActiveLocale(),
	]);
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
		// a draft render is never indexable, on this route as on the post page.
		// the list itself resolves from the session alone, so a crawler already
		// sees only published posts here and the residual risk is nil — but the
		// rule is "every `?draft=true` render carries noindex", and a rule with one
		// route quietly exempt is the kind that stops holding when the exemption's
		// reason changes. no `?draft=true` URL is in the sitemap, so this costs
		// nothing.
		//
		// spread rather than `robots: isDraft ? … : undefined`: Next.js treats a
		// present key holding `undefined` as an explicit reset and drops the
		// layout's `index, follow` tag entirely. Omitting the key is what leaves a
		// published render's metadata identical to what it is today.
		...(draft === "true" ? { robots: { index: false, follow: false } } : {}),
		openGraph: {
			url: urlOrigin,
			title: website.name,
			description: website.description,
			images: [
				{
					url: `${urlOrigin}/thumbnail.png`,
					width: thumbnailWidth,
					height: thumbnailHeight,
					alt: website.name,
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
