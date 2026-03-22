import type { JSX } from "react";
import type { Blog, WithContext } from "schema-dts";
import type { Website } from "@/repositories/get-website";
import { urlOrigin } from "@/runtime";

export async function BlogJsonLd({
	website,
}: {
	website: Website;
}): Promise<JSX.Element | null> {
	return (
		<script
			type="application/ld+json"
			// biome-ignore lint/security/noDangerouslySetInnerHtml: this dangerouslySetInnerHTML is one of the common patterns to render JSON-LD
			dangerouslySetInnerHTML={{
				__html: JSON.stringify({
					"@context": "https://schema.org",
					"@type": "Blog",
					"@id": `${urlOrigin}`,
					name: website.name,
					url: `${urlOrigin}/`,
					author: {
						"@type": "Person",
						"@id": `${urlOrigin}/`,
						name: website.creator.name,
						image: website.creator.avatarImage.url,
					},
				} as WithContext<Blog>),
			}}
		/>
	);
}
