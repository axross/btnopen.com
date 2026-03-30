import { formatDate } from "date-fns";
import type { JSX } from "react";
import type { BlogPosting, WithContext } from "schema-dts";
import { resolveUrlOrigin } from "@/helpers/request";
import type { BlogPostDetail } from "@/repositories/get-post";
import { getWebsite } from "@/repositories/get-website";

export async function BlogPostingJsonLd({
	post,
	draft,
}: {
	post: BlogPostDetail;
	draft?: boolean;
}): Promise<JSX.Element> {
	const [urlOrigin, website] = await Promise.all([
		resolveUrlOrigin(),
		getWebsite({ draft }),
	]);

	return (
		<script
			type="application/ld+json"
			// biome-ignore lint/security/noDangerouslySetInnerHtml: this dangerouslySetInnerHTML is one of the common patterns to render JSON-LD
			dangerouslySetInnerHTML={{
				__html: JSON.stringify({
					"@context": "https://schema.org",
					"@type": "BlogPosting",
					"@id": `${urlOrigin}/posts/${post.slug}`,
					name: post.title,
					description: post.brief,
					datePublished: formatDate(post.publishedAt, "yyyy-MM-dd"),
					dateModified: formatDate(post.updatedAt, "yyyy-MM-dd"),
					author: {
						"@type": "Person",
						"@id": `${urlOrigin}/`,
						name: post.author.name,
						image: `${urlOrigin}${post.author.avatarImage.url}`,
					},
					image: {
						"@type": "ImageObject",
						"@id": `${urlOrigin}/posts/${post.slug}/thumbnail.png`,
						url: `${urlOrigin}/posts/${post.slug}/thumbnail.png`,
						height: "1200",
						width: "630",
					},
					url: `${urlOrigin}/posts/${post.slug}`,
					isPartOf: {
						"@type": "Blog",
						"@id": `${urlOrigin}/`,
						name: website?.name,
						url: `${urlOrigin}/`,
					},
				} satisfies WithContext<BlogPosting>),
			}}
		/>
	);
}
