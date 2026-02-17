import { format, formatDate } from "date-fns";
import type { Metadata } from "next";
import { cacheLife } from "next/cache";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Suspense, ViewTransition } from "react";
import type { BlogPosting, WithContext } from "schema-dts";
import { hashnodePublicationHost } from "@/config";
import { execute, graphql } from "@/services/graphql";
import css from "./page.module.css";
import { PostContent } from "./post-content";

interface PageProps {
	params: Promise<{ slug: string }>;
}

export default async function PostPage({ params }: PageProps) {
	"use cache";

	cacheLife("minutes");

	const publication = await getPublicationWithPost((await params).slug);

	if (!publication.post) {
		notFound();
	}

	return (
		<>
			<article className={css.postPage}>
				<header className={css.header}>
					<ViewTransition name={`post-${publication.post.slug}-image`}>
						<Image
							src={publication.post.coverImage?.url}
							alt={publication.post.title}
							width={1600}
							height={840}
							className={css.coverImage}
						/>
					</ViewTransition>

					<ViewTransition name={`post-${publication.post.slug}-timestamp`}>
						<div className={css.timestamp}>
							{format(publication.post.publishedAt, "PPP")}
						</div>
					</ViewTransition>

					<ViewTransition name={`post-${publication.post.slug}-title`}>
						<h1 className={css.title}>{publication.post.title}</h1>
					</ViewTransition>

					<div className={css.author}>
						<Image
							src={publication.post.author.profilePicture}
							alt={publication.post.author.name}
							width={96}
							height={96}
							className={css.authorImage}
						/>

						<span className={css.authorName}>
							{publication.post.author.name}
						</span>
					</div>

					<ul className={css.tags}>
						{publication.post.tags?.map((tag) => (
							<li className={css.tag} key={tag.slug}>
								{tag.name}
							</li>
						))}
					</ul>
				</header>

				<main className={css.content}>
					<Suspense fallback={null}>
						<PostContent markdown={publication.post.content.markdown} />
					</Suspense>
				</main>
			</article>

			<script
				type="application/ld+json"
				// biome-ignore lint/security/noDangerouslySetInnerHtml: this dangerouslySetInnerHTML is one of the common patterns to render JSON-LD
				dangerouslySetInnerHTML={{
					__html: JSON.stringify({
						"@context": "https://schema.org",
						"@type": "BlogPosting",
						"@id": `${publication.url}/posts/${publication.post.slug}`,
						name: publication.post.title,
						description:
							publication.post.seo?.description ?? publication.post.brief,
						datePublished: formatDate(
							publication.post.publishedAt,
							"yyyy-MM-dd",
						),
						dateModified: formatDate(publication.post.updatedAt, "yyyy-MM-dd"),
						author: publication.post.author
							? {
									"@type": "Person",
									"@id": "https://github.com/axross",
									name: publication.post.author.name,
									image: publication.post.author.profilePicture ?? undefined,
								}
							: undefined,
						image: {
							"@type": "ImageObject",
							"@id": `${publication.url}/posts/${publication.post.slug}/opengraph-image`,
							url: `${publication.url}/posts/${publication.post.slug}/opengraph-image`,
							height: "1200",
							width: "630",
						},
						url: `${publication.url}/posts/${publication.post.slug}`,
						isPartOf: {
							"@type": "Blog",
							name: publication.title,
							url: publication.url,
						},
					} satisfies WithContext<BlogPosting>),
				}}
			/>
		</>
	);
}

export async function generateMetadata({
	params,
}: PageProps): Promise<Metadata> {
	"use cache";

	cacheLife("hours");

	const slug = (await params).slug;
	const publication = await getPublicationWithPost(slug);

	if (!publication.post) {
		notFound();
	}

	return {
		title: publication.post.title,
		description: publication.post.seo?.description ?? publication.post.brief,
		keywords: publication.post.tags?.map((tag) => tag.name),
		authors: [
			{
				name: publication.post.author?.name,
				url:
					publication.post.author?.socialMediaLinks?.website ??
					publication.post.author?.socialMediaLinks?.github ??
					publication.url,
			},
		],
		creator: publication.author?.name,
		publisher: publication.author?.name,
		openGraph: {
			title: publication.post.title,
			description: publication.post.seo?.description ?? publication.post.brief,
			siteName: publication.title,
			url: `${publication.url}/posts/${publication.post.slug}`,
			type: "article",
			publishedTime: publication.post.publishedAt,
			modifiedTime: publication.post.updatedAt,
			section: "Technology",
			tags: publication.post.tags?.map((tag) => tag.name),
			locale: "ja_JP",
		},
	};
}

async function getPublicationWithPost(slug: string) {
	const result = await execute(
		graphql(`
			query GetPublicationWithPost(
				$host: String!
				$slug: String!
			) {
				publication(host: $host) {
					title
					url
					author {
						name
					}
					post(slug: $slug) {
						slug
						title
						brief
						author {
							id
							name
							profilePicture
							socialMediaLinks {
								website
								github
							}
							location
						}
						tags {
							slug
							name
							tagline
							logo
						}
						coverImage {
							url
						}
						content {
							markdown
						}
						seo {
							description
						}
						publishedAt
						updatedAt
					}
				}
			}  
		`),
		{
			host: hashnodePublicationHost,
			slug,
		},
	);

	if (result.data?.publication) {
		const publication = result.data.publication;

		return {
			...publication,
			post: publication.post
				? {
						...publication.post,
						tags: publication.post.tags ?? [],
					}
				: null,
		};
	}

	throw new Error(result.errors?.map((error) => error.message).join(", "));
}
