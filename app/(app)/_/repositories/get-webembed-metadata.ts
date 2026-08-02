import "server-only";

import createMetascraper from "metascraper";
import metascraperDescription from "metascraper-description";
import metascraperImage from "metascraper-image";
import metascraperTitle from "metascraper-title";
import metascraperUrl from "metascraper-url";
import { cacheLife } from "next/cache";
import { rootLogger } from "@/shared/logger";
import { fetchTimeoutMs, readBoundedArrayBuffer } from "./webembed-fetch";
import { decodeHtml } from "./webembed-html";

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

	try {
		return await scrapeWebEmbedMetadata(url);
	} catch (error) {
		// the embedded host is third-party and may be slow, oversized, or gone;
		// degrade to the bare URL so the card still renders from the authored
		// link text instead of failing the whole post.
		logger.warn({ url, error }, "Failed to fetch web embed metadata.");

		return {
			url,
			urlSource: null,
			title: null,
			description: null,
			imageUrl: null,
		};
	}
}

async function scrapeWebEmbedMetadata(url: string): Promise<WebEmbedMetadata> {
	logger.info({ url }, "Started fetching HTML.");

	const response = await fetch(url, {
		// redirects are followed deliberately: an embedded link is often a
		// shortener or a canonical redirect, and the metadata wanted is the
		// destination's. `urlSource` therefore reports where the metadata was
		// actually read from, which can differ from the authored `url`.
		redirect: "follow",
		// a third-party host must not be able to stall the render that awaits it.
		signal: AbortSignal.timeout(fetchTimeoutMs),
	});

	// decode from raw bytes with the page's declared charset; response.text()
	// would decode everything as UTF-8 and garble e.g. Shift_JIS pages
	const { html, encoding } = decodeHtml(
		await readBoundedArrayBuffer(response),
		response.headers.get("content-type"),
	);

	logger.info(
		{
			url,
			statusCode: response.status,
			isRedirected: response.redirected,
			encoding,
		},
		"Completed fetching HTML.",
	);

	const metascraper = createMetascraper([
		metascraperUrl(),
		metascraperTitle(),
		metascraperDescription(),
		metascraperImage(),
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
