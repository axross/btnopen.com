"use server";

import chromium from "@sparticuz/chromium-min";
import createBrowserless from "browserless";
import htmlGet from "html-get";
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
	selfUrlOrigin,
}: {
	url: string;
	selfUrlOrigin: string;
}): Promise<WebEmbedMetadata> {
	"use cache";

	cacheLife("hours");

	logger.info({ url }, "Started fetching web embed metadata.");

	logger.info({ url }, "Started resolving chromium executable path.");

	const chromiumExecutablePath = await chromium.executablePath(
		new URL("/chromium-pack.tar", selfUrlOrigin).href,
	);

	logger.info(
		{ executablePath: chromiumExecutablePath, url },
		"Completed resolving chromium executable path.",
	);

	logger.info({ url }, "Started creating browserless.");

	const browserless = await createBrowserless({
		launchOpts: {
			args: chromium.args,
			executablePath: chromiumExecutablePath,
		},
	});
	const browserlessContext = await browserless.createContext();

	logger.info({ url }, "Completed creating browserless.");

	logger.info({ url }, "Started fetching HTML.");

	const result = await htmlGet(url, {
		getBrowserless: () => Promise.resolve(browserlessContext),
	});

	logger.info(
		{ url, statusCode: result.statusCode, redirects: result.redirects },
		"Completed fetching HTML.",
	);

	logger.info({ url }, "Started teardown the browserless.");

	await browserlessContext.destroyContext();
	await browserless.close();

	logger.info({ url }, "Completed teardown the browserless.");

	const metascraper = createMetascraper([
		metascraperUrl(),
		metascraperTitle(),
		metascraperDescription(),
		metascraperImage(),
		metascraperUrl(),
	]);

	const metadata = await metascraper({ url: result.url, html: result.html });
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
