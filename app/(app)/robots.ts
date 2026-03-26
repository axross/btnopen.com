import type { MetadataRoute } from "next";
import { resolveUrlOrigin } from "@/helpers/request";

// biome-ignore lint/style/noDefaultExport: robots needs default export
export default async function robots(): Promise<MetadataRoute.Robots> {
	const urlOrigin = await resolveUrlOrigin();

	return {
		rules: {
			userAgent: "*",
			allow: "/",
		},
		sitemap: `${urlOrigin}/sitemap.xml`,
	};
}
