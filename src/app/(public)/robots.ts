import type { MetadataRoute } from "next";
import { urlOrigin } from "@/config";

export default async function robots(): Promise<MetadataRoute.Robots> {
	return {
		rules: {
			userAgent: "*",
			allow: "/",
		},
		sitemap: `${urlOrigin}/sitemap.xml`,
	};
}
