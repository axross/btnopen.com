import { type APIResponse, expect, test } from "@playwright/test";

const okStatus = 200;

const urlsetOpeningTag =
	'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
// the origin comes from urlOrigin, which resolves to the branch url on a preview
// deployment and to localhost locally — neither is necessarily the base url this
// suite requests — so only each entry's shape is pinned.
const indexEntry = /<loc>https?:\/\/[^<]+\/<\/loc>/;
const blogPostEntry = /<loc>https?:\/\/[^<]+\/posts\/[^<]+<\/loc>/;

test("The sitemap.xml route serves the generated sitemap", {
	tag: ["@scenario:metadata.sitemap", "@area:metadata", "@priority:should"],
}, async ({ page }) => {
	let response: APIResponse;

	await test.step("Request /sitemap.xml", async () => {
		response = await page.request.get("/sitemap.xml");
	});

	await test.step("Verify the response status is 200", async () => {
		expect(response.status()).toBe(okStatus);
	});

	await test.step("Verify the response is served as XML", async () => {
		expect(response.headers()["content-type"]).toContain("xml");
	});

	let body: string;

	await test.step("Read the response body", async () => {
		body = await response.text();
	});

	await test.step("Verify the document is a sitemap urlset", async () => {
		expect(body).toContain(urlsetOpeningTag);
	});

	await test.step("Verify the index route is listed", async () => {
		expect(body).toMatch(indexEntry);
	});

	await test.step("Verify a published blog post is listed", async () => {
		expect(body).toMatch(blogPostEntry);
	});
});
