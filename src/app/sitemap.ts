import type { MetadataRoute } from "next";
import { getPosts } from "./_fetcher/get-posts";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const posts = await getPosts();

	return [
		{
			url: process.env.NEXT_PUBLIC_VERCEL_URL ?? "https://btnopen2.com",
			lastModified: new Date(),
			changeFrequency: "yearly",
			priority: 1,
		},
		...posts.map(
			(post) =>
				({
					url: `https://btnopen.com/posts/${post.slug}`,
					lastModified: new Date(post.updatedAt),
					changeFrequency: "weekly",
					priority: 0.8,
				}) satisfies MetadataRoute.Sitemap[number],
		),
	];
}
