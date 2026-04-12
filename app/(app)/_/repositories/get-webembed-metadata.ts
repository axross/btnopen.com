"use server";

import createMetascraper from "metascraper";
import metascraperDescription from "metascraper-description";
import metascraperImage from "metascraper-image";
import metascraperTitle from "metascraper-title";
import metascraperUrl from "metascraper-url";
import { cacheLife } from "next/cache";
import { rootLogger } from "@/logger";

const logger = rootLogger.child({ module: "🌏" });

interface WebEmbedMetadata {
	url: string;
	urlSource: string | null;
	title: string | null;
	description: string | null;
	imageUrl: string | null;
}

export async function getWebEmbedMetadata({
	url,
}: {
	url: string;
}): Promise<WebEmbedMetadata> {
	"use cache";

	cacheLife("hours");

	logger.info({ url }, "Started fetching web embed metadata.");

	logger.info({ url }, "Started fetching HTML.");

	const response = await fetch(url);
	const html = await response.text();

	logger.info(
		{ url, statusCode: response.status, isRedirected: response.redirected },
		"Completed fetching HTML.",
	);

	const metascraper = createMetascraper([
		metascraperUrl(),
		metascraperTitle(),
		metascraperDescription(),
		metascraperImage(),
		metascraperUrl(),
	]);

	const metadata = await metascraper({ url: response.url, html });
	const formattedMetadata = {
		url,
		urlSource: metadata.url ?? null,
		title: metadata.title ?? null,
		description: metadata.description ?? null,
		imageUrl: metadata.image ?? null,
	};

	logger.info(formattedMetadata, "Completed fetching web embed metadata.");

	return formattedMetadata;
}
