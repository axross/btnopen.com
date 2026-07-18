import { describe, expect, it } from "@jest/globals";
import { isSameSiteRequest } from "./request-origin";

function request(headers: Record<string, string>): Request {
	return new Request("https://btnopen.com/posts/x/comments", { headers });
}

describe("isSameSiteRequest()", () => {
	it("allows same-origin and same-site Sec-Fetch-Site", () => {
		expect(
			isSameSiteRequest(request({ "sec-fetch-site": "same-origin" })),
		).toBe(true);
		expect(isSameSiteRequest(request({ "sec-fetch-site": "same-site" }))).toBe(
			true,
		);
	});

	it("allows a direct navigation (Sec-Fetch-Site: none)", () => {
		expect(isSameSiteRequest(request({ "sec-fetch-site": "none" }))).toBe(true);
	});

	it("rejects a cross-site Sec-Fetch-Site", () => {
		expect(isSameSiteRequest(request({ "sec-fetch-site": "cross-site" }))).toBe(
			false,
		);
	});

	it("treats a request with no site/origin headers as same-site (server call)", () => {
		expect(isSameSiteRequest(request({}))).toBe(true);
	});

	it("falls back to matching Origin host against Host", () => {
		expect(
			isSameSiteRequest(
				request({ origin: "https://btnopen.com", host: "btnopen.com" }),
			),
		).toBe(true);
		expect(
			isSameSiteRequest(
				request({ origin: "https://evil.example", host: "btnopen.com" }),
			),
		).toBe(false);
	});
});
