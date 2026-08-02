import { type APIResponse, expect, test } from "@playwright/test";

const okStatus = 200;

const anyUserAgentRule = /^User-Agent: \*$/im;
const allowEverythingRule = /^Allow: \/$/m;
// the origin comes from urlOrigin, which resolves to the branch url on a preview
// deployment and to localhost locally — neither is necessarily the base url this
// suite requests — so only the line's shape is pinned.
const sitemapPointer = /^Sitemap: https?:\/\/\S+\/sitemap\.xml$/m;

test("The robots.txt route serves the generated robots file", {
	tag: ["@scenario:metadata.robots", "@area:metadata", "@priority:should"],
}, async ({ page }) => {
	let response: APIResponse;

	await test.step("Request /robots.txt", async () => {
		response = await page.request.get("/robots.txt");
	});

	await test.step("Verify the response status is 200", async () => {
		expect(response.status()).toBe(okStatus);
	});

	await test.step("Verify the response is served as plain text", async () => {
		expect(response.headers()["content-type"]).toContain("text/plain");
	});

	let body: string;

	await test.step("Read the response body", async () => {
		body = await response.text();
	});

	await test.step("Verify every crawler is allowed", async () => {
		expect(body).toMatch(anyUserAgentRule);
		expect(body).toMatch(allowEverythingRule);
	});

	await test.step("Verify the sitemap pointer is present", async () => {
		expect(body).toMatch(sitemapPointer);
	});
});
