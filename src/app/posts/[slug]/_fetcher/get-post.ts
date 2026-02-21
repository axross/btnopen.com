import { hashnodePublicationHost } from "@/config";
import { gql, query } from "@/services/graphql";

export async function getPost(slug: string) {
	"use cache";

	const result = await query({
		query: gql(`
			query GetPostInPublication(
				$host: String!
				$slug: String!
			) {
				publication(host: $host) {
					post(slug: $slug) {
						slug
						title
						brief
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
						tags {
							slug
							name
							tagline
							logo
						}
						coverImage {
							url
						}
						bannerImage {
							url
						}
						seo {
							description
						}
						publishedAt
						updatedAt
					}
				}
			}  
		`),
		variables: {
			host: hashnodePublicationHost,
			slug,
		},
	});

	if (result.data?.publication) {
		const post = result.data.publication.post;

		return post?.coverImage && post.author.profilePicture
			? {
					...post,
					tags: post.tags ?? [],
					coverImage: post.coverImage,
					author: {
						...post.author,
						profilePicture: post.author.profilePicture,
					},
				}
			: null;
	}

	throw (
		result.error ?? new Error("Unknown error occurred while fetching post.")
	);
}
