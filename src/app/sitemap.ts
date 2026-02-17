import type { MetadataRoute } from "next";
import { hashnodePublicationHost } from "@/config";
import { execute, graphql } from "@/services/graphql";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const posts = await getPostSummaries();

	return [
		{
			url: "https://btnopen.com",
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

async function getPostSummaries() {
	const postsResult = await execute(
		graphql(`
      query PostSummaries(
        $host: String!
      ) {
        publication(host: $host) {
          posts(first: 50) {
            edges {
              node {
                slug
                updatedAt
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

	return (postsResult.data?.publication?.posts.edges ?? []).map(
		(edge) => edge.node,
	);
}
