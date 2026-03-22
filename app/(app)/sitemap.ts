import type { MetadataRoute } from "next";
import { getPosts } from "@/repositories/get-posts";
import { urlOrigin } from "@/runtime";

// biome-ignore lint/style/noDefaultExport: sitemap needs default export
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const posts = await getPosts();

	return [
		{
			url: `${urlOrigin}/`,
			lastModified: new Date(),
			changeFrequency: "yearly",
			priority: 1,
		},
		...posts.map(
			(post) =>
				({
					url: `${urlOrigin}/posts/${post.slug}`,
					lastModified: new Date(post.updatedAt),
					changeFrequency: "weekly",
					priority: 0.8,
				}) satisfies MetadataRoute.Sitemap[number],
		),
	];
}
