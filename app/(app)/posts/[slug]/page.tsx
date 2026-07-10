import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { JSX } from "react";
import { Suspense } from "react";
import {
	alternateOpenGraphLocales,
	getActiveLocale,
	openGraphLocaleByLocale,
} from "@/helpers/i18n";
import { getBlogPost } from "@/repositories/get-blog-post";
import { getWebsite } from "@/repositories/get-website";
import { urlOrigin } from "@/runtime";
import { BlogPostContent } from "./_components/blog-post-content";
import { BlogPostHeader } from "./_components/blog-post-header";
import { BlogPostingJsonLd } from "./_components/blog-posting-json-ld";
import { PayloadLivePreview } from "./_components/payload-live-preview";
import css from "./page.module.css";
import type { PageProps } from "./page-props";

export default async function BlogPostPage({
	params,
	searchParams,
}: PageProps): Promise<JSX.Element> {
	const slug = params.then((p) => p.slug);
	const draft = searchParams.then((p) => p.draft === "true");
	const preview = searchParams.then((p) => p.preview === "true");
	// resolve the locale inside the promise callback (not as an eagerly
	// evaluated argument) so the dynamic cookie read happens within the Suspense
	// boundaries that await `blogPost`, not at the top of the route.
	const blogPost = Promise.all([slug, draft]).then(async ([s, d]) =>
		getBlogPost({ slug: s, draft: d, locale: await getActiveLocale() }),
	);

	return (
		<>
			<article className={css.blogPostPage} data-testid="page">
				<BlogPostHeader
					blogPost={blogPost}
					className={css.header}
					data-testid="header"
				/>

				<main className={css.content} data-testid="content">
					<Suspense>
						<BlogPostContent slug={slug} draft={draft} />
					</Suspense>
				</main>
			</article>

			<Suspense>
				<BlogPostingJsonLd blogPost={blogPost} draft={draft} />
			</Suspense>

			<Suspense>
				<MaybePayloadLivePreview slug={slug} preview={preview} />
			</Suspense>
		</>
	);
}

async function MaybePayloadLivePreview({
	slug: slugPromise,
	preview: previewPromise,
}: {
	slug: Promise<string>;
	preview?: Promise<boolean>;
}): Promise<JSX.Element | null> {
	const [slug, preview] = await Promise.all([slugPromise, previewPromise]);

	if (preview) {
		return (
			<PayloadLivePreview
				path={`/posts/${slug}?preview=true&draft=true`}
				serverURL={urlOrigin}
			/>
		);
	}

	return null;
}

export async function generateMetadata({
	params,
	searchParams,
}: PageProps): Promise<Metadata> {
	const [{ slug }, { draft }] = await Promise.all([params, searchParams]);
	const isDraft = draft === "true";
	const locale = await getActiveLocale();
	const [website, blogPost] = await Promise.all([
		getWebsite({ draft: isDraft, locale }),
		getBlogPost({ slug, draft: isDraft, locale }),
	]);

	if (!website || !blogPost) {
		notFound();
	}

	return {
		title: blogPost.title,
		description: blogPost.brief,
		keywords: blogPost.tags.map((tag) => tag.name),
		authors: [
			{
				name: blogPost.author?.name,
				url: `${urlOrigin}/`,
			},
		],
		creator: website.creator.name,
		publisher: website.creator.name,
		openGraph: {
			title: blogPost.title,
			description: blogPost.brief,
			siteName: website.name,
			url: `${urlOrigin}/posts/${blogPost.slug}`,
			images: [
				{
					url: `${urlOrigin}/posts/${blogPost.slug}/thumbnail.png`,
					width: 1200,
					height: 630,
				},
			],
			type: "article",
			publishedTime: blogPost.publishedAt,
			modifiedTime: blogPost.updatedAt,
			section: "Technology",
			tags: blogPost.tags.map((tag) => tag.name),
			locale: openGraphLocaleByLocale[locale],
			alternateLocale: alternateOpenGraphLocales(locale),
		},
	};
}
