// biome-ignore-all lint/style/useNamingConvention: fixtures mirror the snake_case Sentry event payload
import type { Event } from "@sentry/nextjs";
import { describe, expect, it } from "vitest";
import {
	hasShareToken,
	redactShareTokenInEvent,
	redactShareTokenInUrl,
} from "./share-token-scrubbing";

const shareToken = "pnryCl0emXnq8uYvQGiGKTgwg2NYZ_fQf6o3KPhbXSA";
const postUrl = "https://btnopen.com/posts/declarative-ui";

describe("redactShareTokenInUrl()", () => {
	it("replaces the token in an absolute URL", () => {
		expect(
			redactShareTokenInUrl(`${postUrl}?draft=true&token=${shareToken}`),
		).toBe(`${postUrl}?draft=true&token=[Filtered]`);
	});

	it("replaces the token when it is the first parameter", () => {
		expect(
			redactShareTokenInUrl(`${postUrl}?token=${shareToken}&draft=true`),
		).toBe(`${postUrl}?token=[Filtered]&draft=true`);
	});

	it("replaces the token in a relative URL", () => {
		expect(
			redactShareTokenInUrl(
				`/posts/declarative-ui?draft=true&token=${shareToken}`,
			),
		).toBe("/posts/declarative-ui?draft=true&token=[Filtered]");
	});

	it("replaces the token in a bare query string", () => {
		expect(redactShareTokenInUrl(`token=${shareToken}&draft=true`)).toBe(
			"token=[Filtered]&draft=true",
		);
	});

	it("replaces every occurrence of a repeated token parameter", () => {
		expect(
			redactShareTokenInUrl(
				`${postUrl}?token=${shareToken}&draft=true&token=${shareToken}`,
			),
		).toBe(`${postUrl}?token=[Filtered]&draft=true&token=[Filtered]`);
	});

	it("stops the redaction at the fragment", () => {
		expect(
			redactShareTokenInUrl(`${postUrl}?token=${shareToken}#comments`),
		).toBe(`${postUrl}?token=[Filtered]#comments`);
	});

	it("returns a URL carrying no token unchanged", () => {
		expect(redactShareTokenInUrl(`${postUrl}?draft=true`)).toBe(
			`${postUrl}?draft=true`,
		);
		expect(redactShareTokenInUrl(postUrl)).toBe(postUrl);
	});

	it("leaves a parameter whose name merely ends in the token name alone", () => {
		expect(redactShareTokenInUrl(`${postUrl}?csrftoken=${shareToken}`)).toBe(
			`${postUrl}?csrftoken=${shareToken}`,
		);
	});

	it("returns a malformed URL unchanged when it carries no token", () => {
		expect(redactShareTokenInUrl("ht!tp:// not a url at all")).toBe(
			"ht!tp:// not a url at all",
		);
		expect(redactShareTokenInUrl("")).toBe("");
	});

	it("still redacts a token carried by a malformed URL", () => {
		expect(redactShareTokenInUrl(`ht!tp://%%%?token=${shareToken}`)).toBe(
			"ht!tp://%%%?token=[Filtered]",
		);
	});

	it("redacts a token parameter that has an empty value", () => {
		expect(redactShareTokenInUrl(`${postUrl}?token=&draft=true`)).toBe(
			`${postUrl}?token=[Filtered]&draft=true`,
		);
	});
});

describe("hasShareToken()", () => {
	it("reports a URL carrying a token", () => {
		expect(hasShareToken(`${postUrl}?draft=true&token=${shareToken}`)).toBe(
			true,
		);
	});

	it("reports a bare query string carrying a token", () => {
		expect(hasShareToken(`?token=${shareToken}`)).toBe(true);
	});

	// deliberately not the gate's answer: `matchesShareToken` rejects an empty
	// secret, and this reports it as carried. Each errs the safe way for what it
	// decides — the gate refuses to unlock, this refuses to upload a recording.
	it("reports an empty token parameter as carried", () => {
		expect(hasShareToken(`${postUrl}?draft=true&token=`)).toBe(true);
		expect(hasShareToken("?token=")).toBe(true);
	});

	it("reports no token for a URL without the parameter", () => {
		expect(hasShareToken(`${postUrl}?draft=true`)).toBe(false);
		expect(hasShareToken("")).toBe(false);
	});

	it("reports no token for a parameter whose name merely ends in it", () => {
		expect(hasShareToken(`${postUrl}?csrftoken=${shareToken}`)).toBe(false);
	});
});

describe("redactShareTokenInEvent()", () => {
	it("redacts the request URL", () => {
		const event = redactShareTokenInEvent({
			request: { url: `${postUrl}?draft=true&token=${shareToken}` },
		});

		expect(event.request?.url).toBe(`${postUrl}?draft=true&token=[Filtered]`);
	});

	it("redacts a string query_string", () => {
		const event = redactShareTokenInEvent({
			request: { query_string: `draft=true&token=${shareToken}` },
		});

		expect(event.request?.query_string).toBe("draft=true&token=[Filtered]");
	});

	it("redacts an object query_string", () => {
		const event = redactShareTokenInEvent({
			request: { query_string: { draft: "true", token: shareToken } },
		});

		expect(event.request?.query_string).toEqual({
			draft: "true",
			token: "[Filtered]",
		});
	});

	it("redacts a pair-list query_string", () => {
		const event = redactShareTokenInEvent({
			request: {
				query_string: [
					["draft", "true"],
					["token", shareToken],
				] as [string, string][],
			},
		});

		expect(event.request?.query_string).toEqual([
			["draft", "true"],
			["token", "[Filtered]"],
		]);
	});

	// `Referrer-Policy: strict-origin-when-cross-origin` sends the full URL on a
	// same-origin request, so every subresource a draft page asks for carries the
	// token back in `Referer` — and the SDK's own filter matches header *names*
	// against snippets like `auth`, `token`, and `secret`, which `referer` is not.
	it("redacts the token in a referer header", () => {
		const event = redactShareTokenInEvent({
			request: {
				headers: {
					host: "btnopen.com",
					referer: `${postUrl}?draft=true&token=${shareToken}`,
				},
			},
		});

		expect(event.request?.headers).toEqual({
			host: "btnopen.com",
			referer: `${postUrl}?draft=true&token=[Filtered]`,
		});
	});

	it("redacts the token whatever the header is called or cased", () => {
		const event = redactShareTokenInEvent({
			request: {
				headers: {
					Referer: `${postUrl}?token=${shareToken}`,
					"x-forwarded-uri": `/posts/declarative-ui?token=${shareToken}`,
				},
			},
		});

		expect(event.request?.headers).toEqual({
			Referer: `${postUrl}?token=[Filtered]`,
			"x-forwarded-uri": "/posts/declarative-ui?token=[Filtered]",
		});
	});

	it("leaves a header map carrying no token untouched", () => {
		const headers = {
			accept: "image/avif,image/webp,*/*",
			host: "btnopen.com",
			referer: `${postUrl}?draft=true`,
		};

		expect(
			redactShareTokenInEvent({ request: { headers } }).request?.headers,
		).toEqual(headers);
	});

	it("leaves a non-string header value alone", () => {
		const event = redactShareTokenInEvent({
			request: {
				headers: {
					"content-length": 1024,
					referer: null,
					"set-cookie": [`a=${shareToken}`],
				},
			},
		} as unknown as Event);

		expect(event.request?.headers).toEqual({
			"content-length": 1024,
			referer: null,
			"set-cookie": [`a=${shareToken}`],
		});
	});

	it("returns a request with no headers key unchanged", () => {
		const event = redactShareTokenInEvent({
			request: { url: `${postUrl}?token=${shareToken}` },
		});

		expect(event.request).toEqual({ url: `${postUrl}?token=[Filtered]` });
		expect(event.request).not.toHaveProperty("headers");
	});

	it("leaves null headers exactly as they arrived", () => {
		const event = redactShareTokenInEvent({
			request: { headers: null },
		} as unknown as Event);

		expect(event.request).toEqual({ headers: null });
	});

	it("redacts a fetch breadcrumb's url and a navigation breadcrumb's from and to", () => {
		const event = redactShareTokenInEvent({
			breadcrumbs: [
				{
					category: "fetch",
					data: { url: `${postUrl}/thumbnail.png?token=${shareToken}` },
				},
				{
					category: "navigation",
					data: {
						from: `${postUrl}?token=${shareToken}`,
						to: `${postUrl}?draft=true&token=${shareToken}`,
					},
				},
			],
		});

		expect(event.breadcrumbs?.[0]?.data).toEqual({
			url: `${postUrl}/thumbnail.png?token=[Filtered]`,
		});
		expect(event.breadcrumbs?.[1]?.data).toEqual({
			from: `${postUrl}?token=[Filtered]`,
			to: `${postUrl}?draft=true&token=[Filtered]`,
		});
	});

	it("leaves a non-string breadcrumb data value alone", () => {
		const event = redactShareTokenInEvent({
			breadcrumbs: [{ category: "fetch", data: { url: 42, status_code: 500 } }],
		});

		expect(event.breadcrumbs?.[0]?.data).toEqual({ url: 42, status_code: 500 });
	});

	// the surface a transaction actually leaks through. Next's root server span
	// sets `http.target` to the request URL, query string included, and the
	// OpenTelemetry exporter copies every span attribute verbatim into
	// `contexts.trace.data` and each `spans[].data`. The SDK's own filter matches
	// attribute *names* against `auth`, `token`, `secret`, … and none of these
	// keys contains one, so nothing upstream removes the value.
	it("redacts the token in contexts.trace.data", () => {
		const event = redactShareTokenInEvent({
			contexts: {
				trace: {
					span_id: "aaaaaaaaaaaaaaaa",
					trace_id: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
					data: {
						"http.method": "GET",
						"http.target": `/posts/declarative-ui?draft=true&token=${shareToken}`,
						"url.full": `${postUrl}?draft=true&token=${shareToken}`,
						"http.query": `?draft=true&token=${shareToken}`,
						"http.status_code": 200,
					},
				},
			},
		});

		expect(event.contexts?.trace?.data).toEqual({
			"http.method": "GET",
			"http.target": "/posts/declarative-ui?draft=true&token=[Filtered]",
			"url.full": `${postUrl}?draft=true&token=[Filtered]`,
			"http.query": "?draft=true&token=[Filtered]",
			"http.status_code": 200,
		});
	});

	it("redacts the token in every span's data", () => {
		const event = redactShareTokenInEvent({
			spans: [
				{
					span_id: "cccccccccccccccc",
					trace_id: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
					start_timestamp: 0,
					data: {
						"http.url": `${postUrl}/thumbnail.png?token=${shareToken}`,
					},
				},
				{
					span_id: "dddddddddddddddd",
					trace_id: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
					start_timestamp: 0,
					data: { "sentry.op": "function.nextjs" },
				},
			],
		});

		expect(event.spans?.[0]?.data).toEqual({
			"http.url": `${postUrl}/thumbnail.png?token=[Filtered]`,
		});
		expect(event.spans?.[1]?.data).toEqual({ "sentry.op": "function.nextjs" });
	});

	it("leaves a context carrying no data record alone", () => {
		const event = redactShareTokenInEvent({
			contexts: { runtime: { name: "node", version: "v24.0.0" } },
		});

		expect(event.contexts).toEqual({
			runtime: { name: "node", version: "v24.0.0" },
		});
	});

	it("leaves a non-string span attribute alone", () => {
		const event = redactShareTokenInEvent({
			spans: [
				{
					span_id: "cccccccccccccccc",
					trace_id: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
					start_timestamp: 0,
					data: {
						"http.status_code": 200,
						"sentry.parent_span_already_sent": true,
					},
				},
			],
		});

		expect(event.spans?.[0]?.data).toEqual({
			"http.status_code": 200,
			"sentry.parent_span_already_sent": true,
		});
	});

	it("leaves an event carrying no token untouched", () => {
		const event = {
			breadcrumbs: [{ category: "navigation", data: { from: "/", to: "/" } }],
			request: { url: `${postUrl}?draft=true`, query_string: "draft=true" },
		};

		expect(redactShareTokenInEvent(event)).toEqual(event);
	});

	it("returns an event with no request and no breadcrumbs unchanged", () => {
		expect(redactShareTokenInEvent({ message: "boom" })).toEqual({
			message: "boom",
		});
	});

	// the event types declare these fields optional, so TypeScript is satisfied by
	// an `undefined` check — but the payload is JSON assembled by several
	// integrations and a `null` arrives in practice. A throw here loses the event
	// and takes the response being rendered with it, so each shape is pinned.
	const malformedEvents: [string, unknown][] = [
		["a null request", { request: null }],
		["a null request url", { request: { url: null } }],
		["a null query_string", { request: { query_string: null } }],
		["null request headers", { request: { headers: null } }],
		["a non-string request url", { request: { url: 42 } }],
		["a non-string, non-object query_string", { request: { query_string: 7 } }],
		["a non-object headers", { request: { headers: 7 } }],
		["a null header value", { request: { headers: { referer: null } } }],
		["null breadcrumbs", { breadcrumbs: null }],
		["a null breadcrumb", { breadcrumbs: [null] }],
		[
			"a null breadcrumb data",
			{ breadcrumbs: [{ category: "x", data: null }] },
		],
		["a malformed query_string pair", { request: { query_string: [null] } }],
		["null contexts", { contexts: null }],
		["a null context", { contexts: { trace: null } }],
		["a non-record context", { contexts: { trace: 7 } }],
		["a null context data", { contexts: { trace: { data: null } } }],
		["null spans", { spans: null }],
		["a null span", { spans: [null] }],
		["a null span data", { spans: [{ data: null }] }],
		["a non-record span data", { spans: [{ data: "x" }] }],
		["a null event", null],
		["an undefined event", undefined],
	];

	it.each(malformedEvents)("survives %s without throwing", (_label, event) => {
		expect(() => redactShareTokenInEvent(event as Event)).not.toThrow();
	});

	it("leaves a null request url and query_string exactly as they arrived", () => {
		const event = redactShareTokenInEvent({
			request: { url: null, query_string: null },
		} as unknown as Event);

		expect(event.request).toEqual({ url: null, query_string: null });
	});

	it("does not modify the event it was handed", () => {
		const event = {
			request: {
				headers: { referer: `${postUrl}?token=${shareToken}` },
				url: `${postUrl}?token=${shareToken}`,
			},
			breadcrumbs: [
				{ category: "fetch", data: { url: `${postUrl}?token=${shareToken}` } },
			],
			contexts: {
				trace: { data: { "http.target": `/posts?token=${shareToken}` } },
			},
			spans: [{ data: { "http.url": `${postUrl}?token=${shareToken}` } }],
		};

		redactShareTokenInEvent(event as unknown as Event);

		expect(event.request.url).toBe(`${postUrl}?token=${shareToken}`);
		expect(event.request.headers.referer).toBe(
			`${postUrl}?token=${shareToken}`,
		);
		expect(event.breadcrumbs[0]?.data.url).toBe(
			`${postUrl}?token=${shareToken}`,
		);
		expect(event.contexts.trace.data["http.target"]).toBe(
			`/posts?token=${shareToken}`,
		);
		expect(event.spans[0]?.data["http.url"]).toBe(
			`${postUrl}?token=${shareToken}`,
		);
	});
});
