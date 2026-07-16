import z from "zod";

/** A rendered run of tweet text: plain text, or an entity link. */
export interface TweetSegment {
	type: "text" | "mention" | "hashtag" | "url";
	value: string;
	href?: string;
}

/** The text-only tweet shape the `x.com` embed renders. */
export interface Tweet {
	id: string;
	/** Canonical `https://x.com/<handle>/status/<id>` URL. */
	url: string;
	authorName: string;
	/** Handle without the leading `@`. */
	authorHandle: string;
	/** ISO 8601 creation timestamp. */
	createdAt: string;
	/** Ordered text/entity runs, ready to render. */
	segments: TweetSegment[];
}

const entityIndices = z.tuple([z.number(), z.number()]);

// Only the fields the text-only card needs; media, verified, and counts are
// intentionally ignored. A tombstone response lacks `text`/`user` and so fails
// this parse, which `getTweet` maps to `null`.
export const SyndicationTweet = z.object({
	text: z.string(),
	// biome-ignore lint/style/useNamingConvention: mirrors the syndication payload
	created_at: z.string(),
	user: z.object({
		name: z.string(),
		// biome-ignore lint/style/useNamingConvention: mirrors the syndication payload
		screen_name: z.string(),
	}),
	entities: z
		.object({
			hashtags: z
				.array(z.object({ text: z.string(), indices: entityIndices }))
				.optional(),
			// biome-ignore lint/style/useNamingConvention: mirrors the syndication payload
			user_mentions: z
				.array(
					z.object({
						// biome-ignore lint/style/useNamingConvention: mirrors the syndication payload
						screen_name: z.string(),
						indices: entityIndices,
					}),
				)
				.optional(),
			urls: z
				.array(
					z.object({
						// biome-ignore lint/style/useNamingConvention: mirrors the syndication payload
						expanded_url: z.string(),
						// biome-ignore lint/style/useNamingConvention: mirrors the syndication payload
						display_url: z.string(),
						indices: entityIndices,
					}),
				)
				.optional(),
		})
		.optional(),
	// biome-ignore lint/style/useNamingConvention: mirrors the syndication payload
	display_text_range: entityIndices.optional(),
});

export type SyndicationTweet = z.infer<typeof SyndicationTweet>;

/**
 * Extracts the numeric status id from an x.com / twitter.com status URL.
 * Accepts `x.com`, `twitter.com`, and `mobile.twitter.com` hosts and a
 * `/<user>/status/<id>` path. Returns `null` for anything else, so only a
 * digits-only id ever flows into the outbound request.
 */
export function extractTweetId(url: string): string | null {
	if (!URL.canParse(url)) {
		return null;
	}

	const { protocol, hostname, pathname } = new URL(url);

	if (protocol !== "http:" && protocol !== "https:") {
		return null;
	}

	const host = hostname.toLowerCase();

	if (
		host !== "x.com" &&
		host !== "twitter.com" &&
		host !== "mobile.twitter.com" &&
		host !== "www.x.com" &&
		host !== "www.twitter.com"
	) {
		return null;
	}

	const match = statusPathPattern.exec(pathname);

	return match ? match[1] : null;
}

const statusPathPattern = /^\/[^/]+\/status\/(\d+)(?:\/|$)/;

// The scheme X's own embed uses to derive the token from a tweet id: scale the
// id, multiply by π, base-36 encode, and drop the "0" and "." characters.
const tweetIdScale = 1e15;
const base36Radix = 36;
const tokenStripPattern = /(0+|\.)/g;

/**
 * Derives the query token the syndication endpoint requires from the tweet id.
 * Reproduces the scheme X's own embed uses; no authentication is involved.
 */
export function deriveSyndicationToken(id: string): string {
	return ((Number(id) / tweetIdScale) * Math.PI)
		.toString(base36Radix)
		.replace(tokenStripPattern, "");
}

const htmlEntities: Record<string, string> = {
	"&amp;": "&",
	"&lt;": "<",
	"&gt;": ">",
	"&quot;": '"',
	"&#39;": "'",
};

const htmlEntityPattern = /&(?:amp|lt|gt|quot|#39);/g;

function decodeHtmlEntities(value: string): string {
	return value.replace(
		htmlEntityPattern,
		(entity) => htmlEntities[entity] ?? entity,
	);
}

/**
 * Splits tweet text into ordered plain-text and entity-link runs. Entity
 * indices are code-point offsets into the raw (HTML-escaped) text, so the text
 * is sliced on a code-point array and only plain-text runs are entity-decoded —
 * entity display values use their canonical forms. Text outside
 * `display_text_range` (leading reply handles, a trailing media link) is
 * dropped.
 */
export function linkifyTweetText(tweet: SyndicationTweet): TweetSegment[] {
	const codePoints = Array.from(tweet.text);
	const [rangeStart, rangeEnd] = tweet.display_text_range ?? [
		0,
		codePoints.length,
	];

	const entities: Array<{
		start: number;
		end: number;
		segment: TweetSegment;
	}> = [];

	for (const mention of tweet.entities?.user_mentions ?? []) {
		entities.push({
			start: mention.indices[0],
			end: mention.indices[1],
			segment: {
				type: "mention",
				value: `@${mention.screen_name}`,
				href: `https://x.com/${mention.screen_name}`,
			},
		});
	}

	for (const hashtag of tweet.entities?.hashtags ?? []) {
		entities.push({
			start: hashtag.indices[0],
			end: hashtag.indices[1],
			segment: {
				type: "hashtag",
				value: `#${hashtag.text}`,
				href: `https://x.com/hashtag/${hashtag.text}`,
			},
		});
	}

	for (const url of tweet.entities?.urls ?? []) {
		entities.push({
			start: url.indices[0],
			end: url.indices[1],
			segment: {
				type: "url",
				value: url.display_url,
				href: url.expanded_url,
			},
		});
	}

	const withinRange = entities
		.filter((entity) => entity.start >= rangeStart && entity.end <= rangeEnd)
		.sort((a, b) => a.start - b.start);

	const segments: TweetSegment[] = [];
	let cursor = rangeStart;

	const pushText = (from: number, to: number): void => {
		if (to <= from) {
			return;
		}

		const value = decodeHtmlEntities(codePoints.slice(from, to).join(""));

		if (value.length > 0) {
			segments.push({ type: "text", value });
		}
	};

	for (const entity of withinRange) {
		// skip an entity overlapping the previous one (defensive; indices should
		// never overlap) to keep the cursor monotonic.
		if (entity.start < cursor) {
			continue;
		}

		pushText(cursor, entity.start);
		segments.push(entity.segment);
		cursor = entity.end;
	}

	pushText(cursor, rangeEnd);

	return segments;
}

/**
 * Normalizes a parsed syndication payload into the text-only `Tweet` shape.
 */
export function normalizeTweet(id: string, raw: SyndicationTweet): Tweet {
	return {
		id,
		url: `https://x.com/${raw.user.screen_name}/status/${id}`,
		authorName: decodeHtmlEntities(raw.user.name),
		authorHandle: raw.user.screen_name,
		createdAt: raw.created_at,
		segments: linkifyTweetText(raw),
	};
}
