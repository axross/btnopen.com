import { notFound } from "next/navigation";
import type { JSX } from "react";
import type { Blog, WithContext } from "schema-dts";
import { resolveUrlOrigin } from "@/helpers/request";
import type { Website } from "@/repositories/get-website";

export async function BlogJsonLd({
	website: websitePromise,
}: {
	website: Promise<Website | null>;
}): Promise<JSX.Element | null> {
	const [urlOrigin, website] = await Promise.all([
		resolveUrlOrigin(),
		websitePromise,
	]);

	if (!website) {
		return notFound();
	}

	return (
		<script
			type="application/ld+json"
			// biome-ignore lint/security/noDangerouslySetInnerHtml: this dangerouslySetInnerHTML is one of the common patterns to render JSON-LD
			dangerouslySetInnerHTML={{
				__html: JSON.stringify({
					"@context": "https://schema.org",
					"@type": "Blog",
					"@id": `${urlOrigin}/`,
					name: website.name,
					url: `${urlOrigin}/`,
					author: {
						"@type": "Person",
						"@id": `${urlOrigin}/`,
						name: website.creator.name,
						image: `${urlOrigin}${website.creator.avatarImage.url}`,
					},
				} as WithContext<Blog>),
			}}
		/>
	);
}
