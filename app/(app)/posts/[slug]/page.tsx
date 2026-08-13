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
import { matchesPostShareToken } from "@/helpers/post-draft-access";
import { thumbnailHeight, thumbnailWidth } from "@/helpers/thumbnail";
import { getBlogPost } from "@/repositories/get-blog-post";
import { getBlogPostAgentic } from "@/repositories/get-blog-post-agentic";
import { getWebsite } from "@/repositories/get-website";
import { urlOrigin } from "@/runtime";
import { readShareToken } from "./_/helpers/share-token-param";
import { BlogPostAgenticView } from "./_components/blog-post-agentic-view";
import { BlogPostContent } from "./_components/blog-post-content";
import { BlogPostHeader } from "./_components/blog-post-header";
import { BlogPostingJsonLd } from "./_components/blog-posting-json-ld";
import { CommentsLoading } from "./_components/comments/comments-loading";
import { MaybeComments } from "./_components/comments/maybe-comments";
import { MaybePayloadLivePreview } from "./_components/maybe-payload-live-preview";
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
	const { agentic, draft: draftParam, token } = await searchParams;
	const shareToken = readShareToken(token);
	const slug = params.then((p) => p.slug);
	const draft = Promise.resolve(draftParam === "true");

	if (agentic === "true") {
		// the agentic view is session-only by decision, so the token is not
		// forwarded into it — a share link unlocks the reader-facing post and
		// nothing else.
		return <BlogPostAgenticView slug={slug} draft={draft} data-testid="page" />;
	}

	// the comments skeleton needs the same accessible name its loaded counterpart
	// sets, and a <Suspense> fallback may not suspend — an async skeleton would
	// push the wait up to the nearest ancestor boundary, which is the document's.
	// so the label is resolved here and passed in.
	const t = await getTranslations("comments");
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
					{/* no fallback: the post body is what this page exists to show, so
					    this boundary blocks rather than streaming a skeleton the reader
					    would only watch be replaced. */}
					<Suspense>
						<BlogPostContent
							slug={slug}
							draft={draft}
							shareToken={shareToken}
						/>
					</Suspense>
				</main>

				{/* `MaybeComments` renders nothing on a post with comments disabled, so
				    this skeleton briefly shows and then vanishes there. that is the
				    accepted cost of showing one on the posts that do have comments,
				    which is most of them (decided on #179). */}
				<Suspense
					fallback={
						<CommentsLoading
							aria-label={t("heading")}
							data-testid="comments-loading"
						/>
					}
				>
					<MaybeComments blogPost={blogPost} slug={slug} draft={draft} />
				</Suspense>
			</article>

			{/* no fallback: a JSON-LD injector renders a <script> and no visible
			    content, so there is nothing for a skeleton to stand in for. */}
			<Suspense>
				<BlogPostingJsonLd blogPost={blogPost} />
			</Suspense>

			{/* no fallback: the live-preview wrapper only subscribes to Payload's
			    save events and renders nothing at all. */}
			<Suspense>
				<MaybePayloadLivePreview slug={slug} preview={preview} />
			</Suspense>
		</>
	);
}

export async function generateMetadata({
	params,
	searchParams,
}: PageProps): Promise<Metadata> {
	const [{ slug }, { draft, agentic, token }] = await Promise.all([
		params,
		searchParams,
	]);
	const shareToken = readShareToken(token);
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

	// whether the request carried THIS post's own current token — not whether the
	// render resolved as a draft, which for a signed-in author is true whatever
	// token the URL carried. The token lookup beneath `matchesPostShareToken` is
	// `cache()`d on the slug, so a render performs it at most once however many
	// callers ask, and the `isDraft` guard short-circuits this away entirely on
	// the published path, which therefore still reads no dynamic API.
	const carriesOwnShareToken =
		isDraft && (await matchesPostShareToken(slug, shareToken));
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
		// no `?draft=true` URL is in the sitemap, so this costs nothing.
		//
		// spread rather than `robots: isDraft ? … : undefined`: Next.js treats a
		// present key holding `undefined` as an explicit reset and drops the
		// layout's `index, follow` tag entirely. Omitting the key is what leaves a
		// published render's metadata identical to what it is today.
		...(isDraft ? { robots: { index: false, follow: false } } : {}),
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
					//
					// keyed on this post's own token having matched, so nothing else is
					// ever echoed back into the page's <head>: not a token supplied for a
					// published post, and not another post's token supplied by a
					// signed-in author, on a URL this post's thumbnail gate rejects
					// anyway.
					url:
						carriesOwnShareToken && shareToken
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
