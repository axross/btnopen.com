import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type { JSX } from "react";
import { Suspense } from "react";
import {
	alternateOpenGraphLocales,
	getActiveLocale,
	openGraphLocaleByLocale,
} from "@/helpers/i18n";
import { getBlogPost } from "@/repositories/get-blog-post";
import { getBlogPostAgentic } from "@/repositories/get-blog-post-agentic";
import { getWebsite } from "@/repositories/get-website";
import { urlOrigin } from "@/runtime";
import { BlogPostAgenticView } from "./_components/blog-post-agentic-view";
import { BlogPostContent } from "./_components/blog-post-content";
import { BlogPostHeader } from "./_components/blog-post-header";
import { BlogPostHeaderLoading } from "./_components/blog-post-header/loading";
import { BlogPostingJsonLd } from "./_components/blog-posting-json-ld";
import { PayloadLivePreview } from "./_components/payload-live-preview";
import css from "./page.module.css";
import type { PageProps } from "./page-props";

export default function BlogPostPage({
	params,
	searchParams,
}: PageProps): JSX.Element {
	const slug = params.then((p) => p.slug);
	const draft = searchParams.then((p) => p.draft === "true");
	const preview = searchParams.then((p) => p.preview === "true");
	const agentic = searchParams.then((p) => p.agentic === "true");

	// the agentic decision reads `searchParams`, so resolve it inside a Suspense
	// boundary rather than at the top of the route — this keeps the partially
	// prerendered shell (the header skeleton below) static instead of forcing the
	// whole route dynamic.
	return (
		<Suspense fallback={<BlogPostPageShell />}>
			<BlogPostPageBody
				slug={slug}
				draft={draft}
				preview={preview}
				agentic={agentic}
			/>
		</Suspense>
	);
}

async function BlogPostPageBody({
	slug,
	draft,
	preview,
	agentic,
}: {
	slug: Promise<string>;
	draft: Promise<boolean>;
	preview: Promise<boolean>;
	agentic: Promise<boolean>;
}): Promise<JSX.Element> {
	if (await agentic) {
		return <BlogPostAgenticView slug={slug} draft={draft} />;
	}

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

function BlogPostPageShell(): JSX.Element {
	return (
		<article className={css.blogPostPage} data-testid="page">
			<BlogPostHeaderLoading
				className={css.header}
				data-testid="header-loading"
			/>

			<main className={css.content} data-testid="content" />
		</article>
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
	const [{ slug }, { draft, agentic }] = await Promise.all([
		params,
		searchParams,
	]);
	const isDraft = draft === "true";
	const locale = await getActiveLocale();

	// the agentic authoring view is a preview surface that is never meant for
	// public indexing (it shares the post URL with a `?agentic=true` param, which
	// is absent from the sitemap), so it opts out of the layout's global
	// `index: true` and skips the post's Open Graph article metadata.
	if (agentic === "true") {
		const [post, t] = await Promise.all([
			getBlogPostAgentic({ slug, draft: isDraft, locale }),
			getTranslations("agentic"),
		]);

		if (!post) {
			notFound();
		}

		return {
			title: `${t("label")}: ${post.title}`,
			robots: {
				index: false,
				follow: false,
			},
		};
	}

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
