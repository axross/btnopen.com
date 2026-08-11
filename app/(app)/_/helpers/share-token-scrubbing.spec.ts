// biome-ignore-all lint/style/useNamingConvention: fixtures mirror the snake_case Sentry event payload
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

	it("does not modify the event it was handed", () => {
		const event = {
			request: { url: `${postUrl}?token=${shareToken}` },
			breadcrumbs: [
				{ category: "fetch", data: { url: `${postUrl}?token=${shareToken}` } },
			],
		};

		redactShareTokenInEvent(event);

		expect(event.request.url).toBe(`${postUrl}?token=${shareToken}`);
		expect(event.breadcrumbs[0]?.data.url).toBe(
			`${postUrl}?token=${shareToken}`,
		);
	});
});
