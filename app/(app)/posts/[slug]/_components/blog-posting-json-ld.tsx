import { formatDate } from "date-fns";
import type { JSX } from "react";
import type { BlogPosting, WithContext } from "schema-dts";
import type { BlogPostDetail } from "@/repositories/get-blog-post";
import { getWebsite } from "@/repositories/get-website";
import { urlOrigin } from "@/runtime";

export async function BlogPostingJsonLd({
	blogPost: blogPostPromise,
	draft: draftPromise,
}: {
	blogPost: Promise<BlogPostDetail | null>;
	draft?: Promise<boolean>;
}): Promise<JSX.Element | null> {
	const [website, blogPost] = await Promise.all([
		getWebsite({ draft: await draftPromise }),
		blogPostPromise,
	]);

	if (!blogPost) {
		return null;
	}

	return (
		<script
			type="application/ld+json"
			// biome-ignore lint/security/noDangerouslySetInnerHtml: this dangerouslySetInnerHTML is one of the common patterns to render JSON-LD
			dangerouslySetInnerHTML={{
				__html: JSON.stringify({
					"@context": "https://schema.org",
					"@type": "BlogPosting",
					"@id": `${urlOrigin}/posts/${blogPost.slug}`,
					name: blogPost.title,
					description: blogPost.brief,
					datePublished: formatDate(blogPost.publishedAt, "yyyy-MM-dd"),
					dateModified: formatDate(blogPost.updatedAt, "yyyy-MM-dd"),
					author: {
						"@type": "Person",
						"@id": `${urlOrigin}/`,
						name: blogPost.author.name,
						image: `${urlOrigin}${blogPost.author.avatarImage.url}`,
					},
					image: {
						"@type": "ImageObject",
						"@id": `${urlOrigin}/posts/${blogPost.slug}/thumbnail.png`,
						url: `${urlOrigin}/posts/${blogPost.slug}/thumbnail.png`,
						height: "1200",
						width: "630",
					},
					url: `${urlOrigin}/posts/${blogPost.slug}`,
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
