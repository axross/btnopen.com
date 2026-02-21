import { hashnodePublicationHost } from "@/config";
import { gql, query } from "@/services/graphql";

export async function getPostMarkdown(slug: string) {
	"use cache";

	const result = await query({
		query: gql(`
			query GetPostContentInPublication(
				$host: String!
				$slug: String!
			) {
				publication(host: $host) {
					post(slug: $slug) {
						content {
							markdown
						}
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
		return result.data.publication.post?.content?.markdown ?? null;
	}

	throw (
		result.error ??
		new Error("Unknown error occurred while fetching post content.")
	);
}
