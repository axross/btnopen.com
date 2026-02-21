import type { JSX } from "react";
import type { Blog, WithContext } from "schema-dts";
import { getPublication } from "../_fetcher/get-publication";

export async function BlogJsonLd(): Promise<JSX.Element> {
	const publication = await getPublication();

	return (
		<script
			type="application/ld+json"
			// biome-ignore lint/security/noDangerouslySetInnerHtml: this dangerouslySetInnerHTML is one of the common patterns to render JSON-LD
			dangerouslySetInnerHTML={{
				__html: JSON.stringify({
					"@context": "https://schema.org",
					"@type": "Blog",
					"@id": publication.url,
					name: publication.title,
					url: publication.url,
					author: {
						"@type": "Person",
						"@id":
							publication.author.socialMediaLinks?.github ?? publication.url,
						name: publication.author.name,
						image: publication.author.profilePicture ?? undefined,
						address: publication.author.location ?? undefined,
					},
				} as WithContext<Blog>),
			}}
		/>
	);
}
