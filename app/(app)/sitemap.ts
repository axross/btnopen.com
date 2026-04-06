import type { MetadataRoute } from "next";
import { getBlogPosts } from "@/repositories/get-blog-posts";
import { urlOrigin } from "@/runtime";

// biome-ignore lint/style/noDefaultExport: sitemap needs default export
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const blogPosts = await getBlogPosts();

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
