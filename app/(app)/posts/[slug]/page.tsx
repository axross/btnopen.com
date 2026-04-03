import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { JSX } from "react";
import { Suspense, ViewTransition } from "react";
import { resolveUrlOrigin } from "@/helpers/request";
import { getPost } from "@/repositories/get-post";
import { getPosts } from "@/repositories/get-posts";
import { getWebsite } from "@/repositories/get-website";
import { BlogPostingJsonLd } from "./_components/blog-posting-json-ld";
import { PayloadLivePreview } from "./_components/payload-live-preview";
import { PostContent } from "./_components/post-content";
import { BlogPostHeader } from "./_components/post-header";
import css from "./page.module.css";
import type { PageProps } from "./page-props";

export async function generateStaticParams() {
	const posts = await getPosts();

	return posts.map((post) => ({ slug: post.slug }));
}

export default async function PostPage({
	params,
	searchParams,
}: PageProps): Promise<JSX.Element> {
	const slug = params.then((p) => p.slug);
	const draft = searchParams.then((p) => p.draft === "true");
	const preview = searchParams.then((p) => p.preview === "true");
	const blogPost = Promise.all([slug, draft]).then(([s, d]) =>
		getPost({ slug: s, draft: d }),
	);

	return (
		<>
			<article className={css.postPage} data-testid="page">
				<Suspense>
					<BlogPostHeader
						blogPost={blogPost}
						className={css.header}
						data-testid="header"
					/>
				</Suspense>

				<ViewTransition name={`post-${slug}-content`}>
					<main className={css.content} data-testid="content">
						<Suspense>
							<PostContent slug={slug} draft={draft} />
						</Suspense>
					</main>
				</ViewTransition>
			</article>

			<BlogPostingJsonLd blogPost={blogPost} draft={draft} />

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
	const [urlOrigin, slug, preview] = await Promise.all([
		resolveUrlOrigin(),
		slugPromise,
		previewPromise,
	]);

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
	const [urlOrigin, { slug }, { draft }] = await Promise.all([
		resolveUrlOrigin(),
		params,
		searchParams,
	]);
	const isDraft = draft === "true";
	const [website, post] = await Promise.all([
		getWebsite({ draft: isDraft }),
		getPost({ slug, draft: isDraft }),
	]);

	if (!website || !post) {
		notFound();
	}

	return {
		title: post.title,
		description: post.brief,
		keywords: post.tags.map((tag) => tag.name),
		authors: [
			{
				name: post.author?.name,
				url: `${urlOrigin}/`,
			},
		],
		creator: website.creator.name,
		publisher: website.creator.name,
		openGraph: {
			title: post.title,
			description: post.brief,
			siteName: website.name,
			url: `${urlOrigin}/posts/${post.slug}`,
			images: [
				{
					url: `${urlOrigin}/posts/${post.slug}/thumbnail.png`,
					width: 1200,
					height: 630,
				},
			],
			type: "article",
			publishedTime: post.publishedAt,
			modifiedTime: post.updatedAt,
			section: "Technology",
			tags: post.tags.map((tag) => tag.name),
			locale: "ja_JP",
		},
	};
}
