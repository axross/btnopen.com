import { format } from "date-fns";
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ViewTransition } from "react";
import { resolveUrlOrigin } from "@/helpers/request";
import { getPost } from "@/repositories/get-post";
import { getPosts } from "@/repositories/get-posts";
import { getWebsite } from "@/repositories/get-website";
import { BlogPostingJsonLd } from "./_components/blog-posting-json-ld";
import { PayloadLivePreview } from "./_components/payload-live-preview/payload-live-preview";
import { PostContent } from "./_components/post-content";
import css from "./page.module.css";
import type { PageProps } from "./page-props";

export async function generateStaticParams() {
	const posts = await getPosts();

	return posts.map((post) => ({ slug: post.slug }));
}

export default async function PostPage({ params, searchParams }: PageProps) {
	const urlOrigin = await resolveUrlOrigin();
	const { slug } = await params;
	const { draft, preview } = await searchParams;
	const isDraft = draft === "true";
	const post = await getPost({ slug, draft: isDraft });

	if (!post) {
		notFound();
	}

	return (
		<>
			<article className={css.postPage} data-testid="page">
				<header className={css.header} data-testid="header">
					<ViewTransition name={`post-${post.slug}-image`}>
						<Image
							alt={post.title}
							src={post.thumbnailImage.url}
							width={post.thumbnailImage.width}
							height={post.thumbnailImage.height}
							className={css.coverImage}
							data-testid="cover-image"
						/>
					</ViewTransition>

					<ViewTransition name={`post-${post.slug}-timestamp`}>
						<div className={css.timestamp} data-testid="timestamp">
							{format(post.publishedAt, "PPP")}
						</div>
					</ViewTransition>

					<ViewTransition name={`post-${post.slug}-title`}>
						<h1 className={css.title} data-testid="title">
							{post.title}
						</h1>
					</ViewTransition>

					<div className={css.author} data-testid="author">
						<Image
							alt={post.author.name}
							src={post.author.avatarImage.url}
							width={post.author.avatarImage.width}
							height={post.author.avatarImage.height}
							className={css.authorImage}
							data-testid="avatar-image"
						/>

						<span className={css.authorName} data-testid="name">
							{post.author.name}
						</span>
					</div>

					<ul className={css.tags} data-testid="tags">
						{post.tags?.map((tag) => (
							<li className={css.tag} key={tag.slug} data-testid="tag">
								{tag.name}
							</li>
						))}
					</ul>
				</header>

				<ViewTransition name={`post-${slug}-content`}>
					<main className={css.content} data-testid="content">
						<PostContent slug={slug} draft={isDraft} />
					</main>
				</ViewTransition>
			</article>

			<BlogPostingJsonLd post={post} draft={isDraft} />

			{preview === "true" && (
				<PayloadLivePreview
					path={`/posts/${slug}?preview=true&draft=true`}
					serverURL={urlOrigin}
				/>
			)}
		</>
	);
}

export async function generateMetadata({
	params,
	searchParams,
}: PageProps): Promise<Metadata> {
	const urlOrigin = await resolveUrlOrigin();
	const { slug } = await params;
	const { draft } = await searchParams;
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
			type: "article",
			publishedTime: post.publishedAt,
			modifiedTime: post.updatedAt,
			section: "Technology",
			tags: post.tags.map((tag) => tag.name),
			locale: "ja_JP",
		},
	};
}
