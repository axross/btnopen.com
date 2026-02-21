import { format } from "date-fns";
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ViewTransition } from "react";
import { getPosts } from "@/app/_fetcher/get-posts";
import { getPublication } from "@/app/_fetcher/get-publication";
import { BlogPostingJsonLd } from "./_components/blog-posting-json-ld";
import { PostContent } from "./_components/post-content";
import { getPost } from "./_fetcher/get-post";
import type { PageProps } from "./_misc/page-props";
import css from "./page.module.css";

export async function generateStaticParams() {
	const posts = await getPosts();

	return posts.map((post) => ({ slug: post.slug }));
}

export default async function PostPage({ params }: PageProps) {
	const { slug } = await params;
	const post = await getPost(slug);

	if (!post) {
		notFound();
	}

	return (
		<>
			<article className={css.postPage}>
				<header className={css.header}>
					<ViewTransition name={`post-${post.slug}-image`}>
						<Image
							src={post.coverImage.url}
							alt={post.title}
							width={1600}
							height={840}
							className={css.coverImage}
						/>
					</ViewTransition>

					<ViewTransition name={`post-${post.slug}-timestamp`}>
						<div className={css.timestamp}>
							{format(post.publishedAt, "PPP")}
						</div>
					</ViewTransition>

					<ViewTransition name={`post-${post.slug}-title`}>
						<h1 className={css.title}>{post.title}</h1>
					</ViewTransition>

					<div className={css.author}>
						<Image
							src={post.author.profilePicture}
							alt={post.author.name}
							width={96}
							height={96}
							className={css.authorImage}
						/>

						<span className={css.authorName}>{post.author.name}</span>
					</div>

					<ul className={css.tags}>
						{post.tags?.map((tag) => (
							<li className={css.tag} key={tag.slug}>
								{tag.name}
							</li>
						))}
					</ul>
				</header>

				<main className={css.content}>
					<PostContent slug={slug} />
				</main>
			</article>

			<BlogPostingJsonLd slug={slug} />
		</>
	);
}

export async function generateMetadata({
	params,
}: PageProps): Promise<Metadata> {
	"use cache";

	const [publication, post] = await Promise.all([
		getPublication(),
		getPost((await params).slug),
	]);

	if (!post) {
		notFound();
	}

	return {
		title: post.title,
		description: post.seo?.description ?? post.brief,
		keywords: post.tags?.map((tag) => tag.name),
		authors: [
			{
				name: post.author?.name,
				url:
					post.author?.socialMediaLinks?.website ??
					post.author?.socialMediaLinks?.github ??
					publication.url,
			},
		],
		creator: publication.author?.name,
		publisher: publication.author?.name,
		openGraph: {
			title: post.title,
			description: post.seo?.description ?? post.brief,
			siteName: publication.title,
			url: `${publication.url}/posts/${post.slug}`,
			type: "article",
			publishedTime: post.publishedAt,
			modifiedTime: post.updatedAt,
			section: "Technology",
			tags: post.tags?.map((tag) => tag.name),
			locale: "ja_JP",
		},
	};
}
