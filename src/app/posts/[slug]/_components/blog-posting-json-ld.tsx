import { formatDate } from "date-fns";
import { notFound } from "next/navigation";
import type { JSX } from "react";
import type { BlogPosting, WithContext } from "schema-dts";
import { getPublication } from "../../../_fetcher/get-publication";
import { getPost } from "../_fetcher/get-post";

export async function BlogPostingJsonLd({
	slug,
}: {
	slug: string;
}): Promise<JSX.Element> {
	const [publication, post] = await Promise.all([
		getPublication(),
		getPost(slug),
	]);

	if (!post) {
		notFound();
	}

	return (
		<script
			type="application/ld+json"
			// biome-ignore lint/security/noDangerouslySetInnerHtml: this dangerouslySetInnerHTML is one of the common patterns to render JSON-LD
			dangerouslySetInnerHTML={{
				__html: JSON.stringify({
					"@context": "https://schema.org",
					"@type": "BlogPosting",
					"@id": `${publication.url}/posts/${post.slug}`,
					name: post.title,
					description: post.seo?.description ?? post.brief,
					datePublished: formatDate(post.publishedAt, "yyyy-MM-dd"),
					dateModified: formatDate(post.updatedAt, "yyyy-MM-dd"),
					author: post.author
						? {
								"@type": "Person",
								"@id": "https://github.com/axross",
								name: post.author.name,
								image: post.author.profilePicture ?? undefined,
							}
						: undefined,
					image: {
						"@type": "ImageObject",
						"@id": `${publication.url}/posts/${post.slug}/opengraph-image`,
						url: `${publication.url}/posts/${post.slug}/opengraph-image`,
						height: "1200",
						width: "630",
					},
					url: `${publication.url}/posts/${post.slug}`,
					isPartOf: {
						"@type": "Blog",
						name: publication.title,
						url: publication.url,
					},
				} satisfies WithContext<BlogPosting>),
			}}
		/>
	);
}
