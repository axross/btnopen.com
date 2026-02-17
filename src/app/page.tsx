import type { Metadata } from "next";
import { cacheLife } from "next/cache";
import Image from "next/image";
import Link from "next/link";
import type { Blog, WithContext } from "schema-dts";
import { Markdown } from "@/components/markdown";
import { GitHubIcon, LinkedInIcon, XcomIcon } from "@/components/social-icon";
import { hashnodePublicationHost } from "@/config";
import { execute, graphql } from "@/services/graphql";
import { BrushGrunge } from "./brush-grunge";
import css from "./page.module.css";
import { PostList, PostListItem } from "./post-list";

async function IndexPage() {
	"use cache";

	cacheLife("minutes");

	const publication = await getPublicationWithPosts();

	return (
		<>
			<div className={css.indexPage}>
				<main className={css.main}>
					<section className={css.intro}>
						<div className={css.portrait}>
							<Image
								src="/images/bio.webp"
								alt={publication.author.name}
								width={1057}
								height={1080}
								className={css.portraitForeground}
							/>

							<BrushGrunge
								aria-label="Background"
								className={css.portraitBackground}
							/>
						</div>

						<div className={css.bio}>
							<div className={css.bioContent}>
								<Markdown markdown={publication.about.markdown} />
							</div>

							<div className={css.bioSocialLinks}>
								<a
									href="https://github.com/axross"
									target="_blank"
									rel="noopener noreferrer"
									className={css.bioSocialLink}
								>
									<GitHubIcon />
								</a>

								<a
									href="https://x.com/axross"
									target="_blank"
									rel="noopener noreferrer"
									className={css.bioSocialLink}
								>
									<XcomIcon />
								</a>

								<a
									href="https://www.linkedin.com/in/axross"
									target="_blank"
									rel="noopener noreferrer"
									className={css.bioSocialLink}
								>
									<LinkedInIcon />
								</a>
							</div>
						</div>
					</section>

					<section className={css.section}>
						<h1 className={css.sectionHeading}>{"Posts"}</h1>

						<PostList className={css.posts}>
							{publication.posts.edges.map((edge) => (
								<Link
									href={`/posts/${edge.node.slug}`}
									className={css.post}
									key={edge.node.slug}
								>
									<PostListItem
										slug={edge.node.slug}
										title={edge.node.title}
										brief={edge.node.seo?.description ?? edge.node.brief}
										imageUrl={edge.node.coverImage?.url}
										publishedAt={edge.node.publishedAt}
									/>
								</Link>
							))}
						</PostList>
					</section>
				</main>
			</div>

			<script
				type="application/ld+json"
				// biome-ignore lint/security/noDangerouslySetInnerHtml: this dangerouslySetInnerHTML is one of the common patterns to render JSON-LD
				dangerouslySetInnerHTML={{
					__html: JSON.stringify({
						"@context": "https://schema.org",
						"@type": "Blog",
						"@id": publication.url,
						name: publication.title,
						url: publication.url,
						author: {
							"@type": "Person",
							"@id":
								publication.author.socialMediaLinks?.github ?? publication.url,
							name: publication.author.name,
							image: publication.author.profilePicture ?? undefined,
							address: publication.author.location ?? undefined,
						},
					} as WithContext<Blog>),
				}}
			/>
		</>
	);
}

export async function generateMetadata(): Promise<Metadata> {
	"use cache";

	cacheLife("minutes");

	const publication = await getPublicationWithPosts();

	return {
		description: publication.descriptionSEO,
		keywords: [
			"axross",
			"Kohei Asai",
			"ソフトウェアエンジニア",
			"バンクーバー",
			"ブログ",
		],
		authors: [
			{
				name: publication.author.name,
				url:
					publication.author.socialMediaLinks?.website ??
					publication.author.socialMediaLinks?.github ??
					publication.url,
			},
		],
		creator: publication.author.name,
		publisher: publication.author.name,
		openGraph: {
			title: publication.title,
			description: publication.descriptionSEO,
			siteName: publication.title,
			type: "website",
			images: "/images/bio.webp",
			locale: "ja_JP",
		},
	};
}

async function getPublicationWithPosts() {
	const result = await execute(
		graphql(`
			query GetPublicationWithPosts(
				$host: String!
			) {
				publication(host: $host) {
					title
					url
					about {
						markdown
					}
					descriptionSEO
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
					posts(first: 50) {
						edges {
							node {
								slug
								title
								brief
								author {
									username
									name
									profilePicture
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
								seo {
									description
								}
								publishedAt
							}
						}
						pageInfo {
							endCursor
							hasNextPage
						}
					}
				}
			}  
		`),
		{ host: hashnodePublicationHost },
	);

	if (result.data?.publication) {
		const publication = result.data.publication;

		if (publication?.descriptionSEO == null) {
			throw new Error("The publication doesn't contain valid descriptionSEO.");
		}

		if (publication?.about?.markdown == null) {
			throw new Error("The publication doesn't contain valid about.markdown.");
		}

		if (publication?.author == null) {
			throw new Error("The publication doesn't contain valid author.");
		}

		return {
			...publication,
			about: {
				...publication.about,
				markdown: publication.about.markdown,
			},
		};
	}

	throw new Error(result.errors?.map((error) => error.message).join(", "));
}

export default IndexPage;
