import type { MetadataRoute } from "next";
import { defaultLocale } from "@/helpers/i18n";
import { getBlogPosts } from "@/repositories/get-blog-posts";
import { urlOrigin } from "@/runtime";

// biome-ignore lint/style/noDefaultExport: sitemap needs default export
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	// slugs are not localized, so the sitemap lists each post once under the
	// default locale regardless of the visitor's negotiated language.
	const blogPosts = await getBlogPosts({ locale: defaultLocale });

	return [
		{
			url: `${urlOrigin}/`,
			lastModified: new Date(),
			changeFrequency: "yearly",
			priority: 1,
		},
		...blogPosts.map(
			(blogPost) =>
				({
					url: `${urlOrigin}/posts/${blogPost.slug}`,
					lastModified: new Date(blogPost.updatedAt),
					changeFrequency: "weekly",
					priority: 0.8,
				}) satisfies MetadataRoute.Sitemap[number],
		),
	];
}
