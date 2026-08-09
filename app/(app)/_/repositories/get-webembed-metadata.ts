import "server-only";

import createMetascraper from "metascraper";
import metascraperDescription from "metascraper-description";
import metascraperImage from "metascraper-image";
import metascraperTitle from "metascraper-title";
import metascraperUrl from "metascraper-url";
import { cacheLife } from "next/cache";
import { rootLogger } from "@/shared/logger";
import { fetchPermittedUrl, readBoundedArrayBuffer } from "./webembed-fetch";
import { BlockedHostError } from "./webembed-host";
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
		// the embedded host is third-party and may be slow, oversized, gone, or
		// somewhere this server refuses to reach; degrade to the bare URL so the
		// card still renders from the authored link text instead of failing the
		// whole post. a refusal is called out separately because it is an
		// authoring mistake far more often than an attack, and reads nothing like
		// an unreachable host to whoever has to fix it.
		if (error instanceof BlockedHostError) {
			logger.warn(
				{ url, error },
				"Refused to fetch a web embed from a host this server must not reach.",
			);
		} else {
			logger.warn({ url, error }, "Failed to fetch web embed metadata.");
		}

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

	// every hop is resolved and checked before its request leaves, and the whole
	// chain shares one timeout so a third-party host cannot stall the render that
	// awaits it. `fetchedUrl` reports where the metadata was actually read from,
	// which a shortener or a canonical redirect makes differ from the authored
	// `url`.
	const {
		response,
		url: fetchedUrl,
		isRedirected,
	} = await fetchPermittedUrl(url);

	// decode from raw bytes with the page's declared charset; response.text()
	// would decode everything as UTF-8 and garble e.g. Shift_JIS pages
	const { html, encoding } = decodeHtml(
		await readBoundedArrayBuffer(response),
		response.headers.get("content-type"),
	);

	logger.info(
		{
			url,
			fetchedUrl,
			statusCode: response.status,
			isRedirected,
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

	const metadata = await metascraper({ url: fetchedUrl, html });
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
