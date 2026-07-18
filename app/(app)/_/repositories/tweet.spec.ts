// biome-ignore-all lint/style/useNamingConvention: fixtures mirror the snake_case syndication payload
// biome-ignore-all lint/style/noMagicNumbers: entity code-point indices are intrinsic to the fixtures
// biome-ignore-all lint/performance/useTopLevelRegex: assertion regexes are local to a single test
import { describe, expect, it } from "@jest/globals";
import {
	deriveSyndicationToken,
	extractTweetId,
	linkifyTweetText,
	normalizeTweet,
	SyndicationTweet,
} from "./tweet";

describe("extractTweetId()", () => {
	it("extracts the id from an x.com status URL", () => {
		expect(extractTweetId("https://x.com/axross/status/1234567890")).toBe(
			"1234567890",
		);
	});

	it("extracts the id from a twitter.com and mobile.twitter.com URL", () => {
		expect(extractTweetId("https://twitter.com/jack/status/20")).toBe("20");
		expect(extractTweetId("https://mobile.twitter.com/jack/status/20")).toBe(
			"20",
		);
		expect(extractTweetId("https://www.x.com/jack/status/20")).toBe("20");
	});

	it("ignores a trailing segment or query string", () => {
		expect(extractTweetId("https://x.com/axross/status/42/photo/1")).toBe("42");
		expect(extractTweetId("https://x.com/axross/status/42?s=20")).toBe("42");
	});

	it("returns null for a non-status x.com URL", () => {
		expect(extractTweetId("https://x.com/axross")).toBeNull();
		expect(extractTweetId("https://x.com/axross/status/")).toBeNull();
		expect(extractTweetId("https://x.com/i/status/abc")).toBeNull();
	});

	it("returns null for a non-x host", () => {
		expect(extractTweetId("https://example.com/axross/status/42")).toBeNull();
		expect(extractTweetId("https://notx.com/a/status/42")).toBeNull();
	});

	it("returns null for a non-http(s) protocol or malformed URL", () => {
		expect(extractTweetId("javascript:alert(1)")).toBeNull();
		expect(extractTweetId("not a url")).toBeNull();
	});
});

describe("deriveSyndicationToken()", () => {
	it("is deterministic for a given id", () => {
		expect(deriveSyndicationToken("1234567890123456")).toBe(
			deriveSyndicationToken("1234567890123456"),
		);
	});

	it("emits a base-36 token with the '0' and '.' characters stripped", () => {
		const token = deriveSyndicationToken("1799999999999999999");

		expect(token).toMatch(/^[1-9a-z]+$/);
		expect(token).not.toContain("0");
		expect(token).not.toContain(".");
	});

	it("differs for different ids", () => {
		expect(deriveSyndicationToken("20")).not.toBe(deriveSyndicationToken("21"));
	});
});

// "Hi @bob &amp; #cats https://t.co/abc123" — a mention, an HTML-escaped
// ampersand, a hashtag, and a t.co URL, with code-point indices computed
// against the raw (escaped) text.
const sampleTweet: SyndicationTweet = {
	text: "Hi @bob &amp; #cats https://t.co/abc123",
	created_at: "2026-07-15T15:45:00.000Z",
	user: { name: "Bob & Friends", screen_name: "bob" },
	entities: {
		user_mentions: [{ screen_name: "bob", indices: [3, 7] }],
		hashtags: [{ text: "cats", indices: [14, 19] }],
		urls: [
			{
				expanded_url: "https://example.com/x",
				display_url: "example.com/x",
				indices: [20, 39],
			},
		],
	},
	display_text_range: [0, 39],
};

describe("linkifyTweetText()", () => {
	it("splits text into ordered plain-text and entity runs", () => {
		expect(linkifyTweetText(sampleTweet)).toEqual([
			{ type: "text", value: "Hi " },
			{ type: "mention", value: "@bob", href: "https://x.com/bob" },
			{ type: "text", value: " & " },
			{ type: "hashtag", value: "#cats", href: "https://x.com/hashtag/cats" },
			{ type: "text", value: " " },
			{ type: "url", value: "example.com/x", href: "https://example.com/x" },
		]);
	});

	it("drops text outside display_text_range (leading handles, trailing media)", () => {
		expect(
			linkifyTweetText({ ...sampleTweet, display_text_range: [3, 19] }),
		).toEqual([
			{ type: "mention", value: "@bob", href: "https://x.com/bob" },
			{ type: "text", value: " & " },
			{ type: "hashtag", value: "#cats", href: "https://x.com/hashtag/cats" },
		]);
	});

	it("returns a single text run when there are no entities", () => {
		expect(
			linkifyTweetText({
				text: "just words",
				created_at: sampleTweet.created_at,
				user: sampleTweet.user,
			}),
		).toEqual([{ type: "text", value: "just words" }]);
	});
});

describe("normalizeTweet()", () => {
	it("builds the canonical url, decodes the author name, and links the text", () => {
		expect(normalizeTweet("42", sampleTweet)).toEqual({
			id: "42",
			url: "https://x.com/bob/status/42",
			authorName: "Bob & Friends",
			authorHandle: "bob",
			createdAt: "2026-07-15T15:45:00.000Z",
			segments: linkifyTweetText(sampleTweet),
		});
	});
});

describe("SyndicationTweet schema", () => {
	it("accepts a minimal valid tweet payload", () => {
		expect(
			SyndicationTweet.safeParse({
				text: "hello",
				created_at: "2026-07-15T15:45:00.000Z",
				user: { name: "Bob", screen_name: "bob" },
			}).success,
		).toBe(true);
	});

	it("rejects a tombstone (unavailable) response", () => {
		expect(
			SyndicationTweet.safeParse({
				__typename: "TweetTombstone",
				tombstone: { text: { text: "This Post is unavailable." } },
			}).success,
		).toBe(false);
	});
});
