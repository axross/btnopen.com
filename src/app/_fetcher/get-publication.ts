import { hashnodePublicationHost } from "@/config";
import { gql, query } from "@/services/graphql";

export async function getPublication() {
	"use cache";

	const result = await query({
		query: gql(`
			query GetPublication(
				$host: String!
			) {
				publication(host: $host) {
					title
					url
					about {
						markdown
					}
					descriptionSEO
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
				}
			}
		`),
		variables: { host: hashnodePublicationHost },
	});

	if (result.data?.publication) {
		const publication = result.data.publication;

		if (publication?.descriptionSEO == null) {
			throw new Error("The publication doesn't contain valid descriptionSEO.");
		}

		if (publication?.about?.markdown == null) {
			throw new Error("The publication doesn't contain valid about.markdown.");
		}

		if (publication?.author == null) {
			throw new Error("The publication doesn't contain valid author.");
		}

		return {
			...publication,
			about: {
				...publication.about,
				markdown: publication.about.markdown,
			},
		};
	}

	throw (
		result.error ??
		new Error("Unknown error occurred while fetching publication.")
	);
}
