import type { JSX } from "react";
import type { Blog, WithContext } from "schema-dts";
import { urlOrigin } from "@/config";
import { getGlobalAuthor } from "../_fetcher/get-global-author";

export async function BlogJsonLd(): Promise<JSX.Element> {
	const globalAuthor = await getGlobalAuthor();

	return (
		<script
			type="application/ld+json"
			// biome-ignore lint/security/noDangerouslySetInnerHtml: this dangerouslySetInnerHTML is one of the common patterns to render JSON-LD
			dangerouslySetInnerHTML={{
				__html: JSON.stringify({
					"@context": "https://schema.org",
					"@type": "Blog",
					"@id": urlOrigin,
					name: "<btn open />",
					url: urlOrigin,
					author: {
						"@type": "Person",
						"@id": urlOrigin,
						name: globalAuthor.name,
						image: globalAuthor.avatarImage.url,
					},
				} as WithContext<Blog>),
			}}
		/>
	);
}
