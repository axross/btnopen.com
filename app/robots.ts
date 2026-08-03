import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { urlOrigin } from "@/runtime";

export default async function robots(): Promise<MetadataRoute.Robots> {
	// render at request time rather than at build time. urlOrigin reads Vercel's
	// system environment variables, and both deploy workflows build on the GitHub
	// Actions runner and ship the result with `vercel deploy --prebuilt`, where
	// those variables are absent — so a prerendered robots.txt bakes in
	// `http://localhost:3000` on a preview and `https://undefined` in production.
	// A serverless function resolves them at cold start instead, which is why
	// /sitemap.xml has always carried the right origin.
	await connection();

	return {
		rules: {
			userAgent: "*",
			allow: "/",
		},
		sitemap: `${urlOrigin}/sitemap.xml`,
	};
}
