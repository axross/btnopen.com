import type { MetadataRoute } from "next";
import { urlOrigin } from "@/runtime";

// biome-ignore lint/style/noDefaultExport: robots needs default export
export default async function robots(): Promise<MetadataRoute.Robots> {
	return {
		rules: {
			userAgent: "*",
			allow: "/",
		},
		sitemap: `${urlOrigin}/sitemap.xml`,
	};
}
