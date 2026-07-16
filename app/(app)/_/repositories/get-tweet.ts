"use server";

import { cacheLife } from "next/cache";
import z from "zod";
import { rootLogger } from "@/logger";
import {
	deriveSyndicationToken,
	extractTweetId,
	normalizeTweet,
	SyndicationTweet,
	type Tweet,
} from "./tweet";

const logger = rootLogger.child({ module: "𝕏" });

// The syndication endpoint X's own embed reads. The host is a fixed constant;
// only a digits-validated numeric id ever reaches the query string, so a
// CMS-authored URL can never steer this fetch at another host (no SSRF).
const syndicationOrigin = "https://cdn.syndication.twimg.com";

// The feature flags X's embed passes; the endpoint expects the parameter to be
// present. Kept verbatim from the public embed request.
const syndicationFeatures =
	"tfw_timeline_list:;tfw_follower_count_sunset:true;tfw_tweet_edit_backend:on;tfw_refsrc_session:on;tfw_fosnr_soft_interventions_enabled:on;tfw_show_birdwatch_pivots_enabled:on;tfw_show_business_verified_badge:on;tfw_duplicate_scribes_to_settings:on;tfw_use_profile_image_shape_enabled:on;tfw_show_blue_verified_badge:on;tfw_legacy_timeline_sunset:on;tfw_show_gov_verified_badge:on;tfw_show_business_affiliate_badge:on;tfw_tweet_edit_frontend:on";

const requestTimeoutMs = 5000;

/**
 * Fetches and normalizes a tweet for the `x.com` embed, reading the
 * unauthenticated syndication endpoint X's own embed uses. Returns `null` — so
 * the component can degrade to a plain link — when the URL is not a tweet, the
 * tweet is unavailable (deleted/protected/tombstoned), the response fails
 * validation, or the request errors.
 */
export async function getTweet({
	url,
}: {
	url: string;
}): Promise<Tweet | null> {
	"use cache";

	cacheLife("hours");

	const id = extractTweetId(url);

	if (id === null) {
		return null;
	}

	logger.info({ id }, "Started fetching tweet.");

	const endpoint = new URL("/tweet-result", syndicationOrigin);
	endpoint.searchParams.set("id", id);
	endpoint.searchParams.set("lang", "en");
	endpoint.searchParams.set("features", syndicationFeatures);
	endpoint.searchParams.set("token", deriveSyndicationToken(id));

	let payload: unknown;

	try {
		const response = await fetch(endpoint, {
			signal: AbortSignal.timeout(requestTimeoutMs),
		});

		if (!response.ok) {
			logger.warn(
				{ id, statusCode: response.status },
				"Tweet fetch returned a non-ok status.",
			);

			return null;
		}

		payload = await response.json();
	} catch (error) {
		// `err` (not `error`) is the key Pino's built-in Error serializer keys on;
		// a plain `error` key would serialize the Error to `{}`.
		logger.warn({ id, err: error }, "Tweet fetch failed.");

		return null;
	}

	const parseResult = SyndicationTweet.safeParse(payload);

	if (!parseResult.success) {
		logger.warn(
			{ id, error: z.flattenError(parseResult.error) },
			"Tweet response was unavailable or failed validation.",
		);

		return null;
	}

	logger.info({ id }, "Completed fetching tweet.");

	return normalizeTweet(id, parseResult.data);
}
