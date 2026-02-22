import { hashnodePublicationHost } from "@/config";
import { gql, query } from "@/services/graphql";

export async function getPosts() {
	"use cache";

	const result = await query({
		query: gql(`
			query GetPostsInPublication(
				$host: String!
			) {
				publication(host: $host) {
					posts(first: 50) {
						edges {
							node {
							  id
								slug
								title
								brief
								author {
									username
									name
									profilePicture
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
								seo {
									description
								}
								publishedAt
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
		variables: { host: hashnodePublicationHost },
	});

	if (result.data?.publication) {
		const publication = result.data.publication;

		return publication.posts.edges
			.map((edge) => edge.node)
			.filter(
				(
					node,
				): node is (typeof publication.posts.edges)[number]["node"] & {
					coverImage: NonNullable<
						(typeof publication.posts.edges)[number]["node"]["coverImage"]
					>;
				} => node.coverImage?.url != null,
			);
	}

	throw (
		result.error ?? new Error("Unknown error occurred while fetching posts.")
	);
}
