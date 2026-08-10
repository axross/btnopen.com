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
import { thumbnailHeight, thumbnailWidth } from "@/helpers/thumbnail";
import { type BlogPostDetail, getBlogPost } from "@/repositories/get-blog-post";
import { getBlogPostAgentic } from "@/repositories/get-blog-post-agentic";
import { getWebsite } from "@/repositories/get-website";
import { urlOrigin } from "@/runtime";
import { BlogPostAgenticView } from "./_components/blog-post-agentic-view";
import { BlogPostContent } from "./_components/blog-post-content";
import { BlogPostHeader } from "./_components/blog-post-header";
import { BlogPostingJsonLd } from "./_components/blog-posting-json-ld";
import { Comments } from "./_components/comments/comments";
import { PayloadLivePreview } from "./_components/payload-live-preview";
import css from "./page.module.css";
import type { PageProps } from "./page-props";

export default async function BlogPostPage({
	params,
	searchParams,
}: PageProps): Promise<JSX.Element> {
	// resolve `searchParams` up front to pick the branch, so each branch can
	// stream its own matching loading skeleton (the agentic view and the post
	// have different shapes, so a single shared fallback would mismatch one of
	// them). This opts the route into dynamic rendering.
	const { agentic, draft: draftParam, token: shareToken } = await searchParams;
	const slug = params.then((p) => p.slug);
	const draft = Promise.resolve(draftParam === "true");

	if (agentic === "true") {
		// the agentic view is session-only by decision, so the token is not
		// forwarded into it — a share link unlocks the reader-facing post and
		// nothing else.
		return <BlogPostAgenticView slug={slug} draft={draft} data-testid="page" />;
	}

	const preview = searchParams.then((p) => p.preview === "true");
	// resolve the locale inside the promise callback (not as an eagerly
	// evaluated argument) so the dynamic cookie read happens within the Suspense
	// boundaries that await `blogPost`.
	const blogPost = Promise.all([slug, draft]).then(async ([s, d]) =>
		getBlogPost({
			slug: s,
			draft: d,
			locale: await getActiveLocale(),
			shareToken,
		}),
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
						<BlogPostContent
							slug={slug}
							draft={draft}
							shareToken={shareToken}
						/>
					</Suspense>
				</main>

				<Suspense>
					<MaybeComments blogPost={blogPost} slug={slug} draft={draft} />
				</Suspense>
			</article>

			<Suspense>
				<BlogPostingJsonLd blogPost={blogPost} />
			</Suspense>

			<Suspense>
				<MaybePayloadLivePreview slug={slug} preview={preview} />
			</Suspense>
		</>
	);
}

async function MaybeComments({
	blogPost,
	slug,
	draft,
}: {
	blogPost: Promise<BlogPostDetail | null>;
	slug: Promise<string>;
	draft: Promise<boolean>;
}): Promise<JSX.Element | null> {
	const [post, resolvedSlug, isDraft] = await Promise.all([
		blogPost,
		slug,
		draft,
	]);

	if (!post?.isCommentsEnabled) {
		return null;
	}

	return <Comments slug={resolvedSlug} draft={isDraft} />;
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
	const [{ slug }, { draft, agentic, token: shareToken }] = await Promise.all([
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
		getWebsite({ locale }),
		getBlogPost({ slug, draft: isDraft, locale, shareToken }),
	]);

	if (!website || !blogPost) {
		notFound();
	}

	const thumbnailUrl = `${urlOrigin}/posts/${blogPost.slug}/thumbnail.png`;

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
		// a draft render is never indexable, whatever it resolved to. the site-wide
		// `index: true` in the root layout would otherwise leave a leaked or
		// forwarded share link free to put unpublished content into a search index;
		// no `?draft=true` URL is in the sitemap, so this costs nothing. A published
		// render leaves the key unset and keeps the layout's value, exactly as
		// before.
		robots: isDraft ? { index: false, follow: false } : undefined,
		openGraph: {
			title: blogPost.title,
			description: blogPost.brief,
			siteName: website.name,
			url: `${urlOrigin}/posts/${blogPost.slug}`,
			images: [
				{
					// the thumbnail route gates the draft on the same token this request
					// carried, so an unfurl of a shared link has to hand it back to
					// render the draft's own card. The accepted consequence is that the
					// token appears in the draft page's rendered HTML — only a holder can
					// render that page. The published path builds the bare URL it always
					// did, so a published render's metadata is unchanged.
					url:
						isDraft && shareToken
							? `${thumbnailUrl}?token=${encodeURIComponent(shareToken)}`
							: thumbnailUrl,
					width: thumbnailWidth,
					height: thumbnailHeight,
					alt: blogPost.title,
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
