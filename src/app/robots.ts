import type { MetadataRoute } from "next";
import { getPublication } from "./_fetcher/get-publication";

export default async function robots(): Promise<MetadataRoute.Robots> {
	const publication = await getPublication();

	return {
		rules: {
			userAgent: "*",
			allow: "/",
		},
		sitemap: `${publication.url}/sitemap.xml`,
	};
}
