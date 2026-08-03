import { formatDate } from "date-fns";
import type { JSX } from "react";
import type { BlogPosting, WithContext } from "schema-dts";
import { getActiveLocale } from "@/helpers/i18n";
import { serializeJsonLd } from "@/helpers/json-ld";
import { thumbnailHeight, thumbnailWidth } from "@/helpers/thumbnail";
import type { BlogPostDetail } from "@/repositories/get-blog-post";
import { getWebsite } from "@/repositories/get-website";
import { urlOrigin } from "@/runtime";

export async function BlogPostingJsonLd({
	blogPost: blogPostPromise,
}: {
	blogPost: Promise<BlogPostDetail | null>;
}): Promise<JSX.Element | null> {
	const [website, blogPost] = await Promise.all([
		getWebsite({ locale: await getActiveLocale() }),
		blogPostPromise,
	]);

	if (!blogPost) {
		return null;
	}

	return (
		<script
			type="application/ld+json"
			// biome-ignore lint/security/noDangerouslySetInnerHtml: inline JSON-LD is the convention, and serializeJsonLd() escapes <, >, and & as JSON unicode escapes so no CMS-authored value can terminate this script element
			dangerouslySetInnerHTML={{
				__html: serializeJsonLd({
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
						// schema-dts types both as strings, so the shared numbers are
						// stringified here rather than repeated as literals.
						width: `${thumbnailWidth}`,
						height: `${thumbnailHeight}`,
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
