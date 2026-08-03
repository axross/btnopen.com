import type { JSX } from "react";
import type { Blog, WithContext } from "schema-dts";
import { serializeJsonLd } from "@/helpers/json-ld";
import type { Website } from "@/repositories/get-website";
import { urlOrigin } from "@/runtime";

export async function BlogJsonLd({
	website: websitePromise,
}: {
	website: Promise<Website | null>;
}): Promise<JSX.Element | null> {
	const website = await websitePromise;

	// a metadata injector emits no visible output, so it must not 404 a page that
	// has already rendered its content. the index route's own `notFound()` calls
	// — in `IndexPageMain` and `generateMetadata` — own that decision.
	if (!website) {
		return null;
	}

	return (
		<script
			type="application/ld+json"
			// biome-ignore lint/security/noDangerouslySetInnerHtml: inline JSON-LD is the convention, and serializeJsonLd() escapes <, >, and & as JSON unicode escapes so no CMS-authored value can terminate this script element
			dangerouslySetInnerHTML={{
				__html: serializeJsonLd({
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
				} satisfies WithContext<Blog>),
			}}
		/>
	);
}
