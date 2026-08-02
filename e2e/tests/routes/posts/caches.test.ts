import { expect, type Page, test } from "@playwright/test";

const noContentStatus = 204;
const badRequestStatus = 400;
const forbiddenStatus = 403;

interface CacheDeletion {
	url: string;
	status: number;
	body: unknown;
}

/**
 * Sends one `DELETE` and resolves both its status and its parsed body, so call
 * sites can fan out with `Promise.all` and assert without awaiting in a loop.
 * A `204` carries no body, so parsing is skipped for it.
 */
async function deleteCache(
	page: Page,
	url: string,
	headers?: Record<string, string>,
): Promise<CacheDeletion> {
	const response = await page.request.delete(url, { headers });
	const status = response.status();

	return {
		url,
		status,
		body: status === noContentStatus ? null : await response.json(),
	};
}

function cacheUrls(baseUrl: string | undefined): string[] {
	return [
		`${new URL("/posts/caches", baseUrl)}`,
		`${new URL("/posts/example/caches", baseUrl)}`,
	];
}

test(
	"The post cache-invalidation endpoints reject a cross-site call but accept the hook's own",
	{
		tag: ["@scenario:post.caches.csrf", "@area:posts", "@priority:should"],
	},
	async ({ page }, testInfo) => {
		const urls = cacheUrls(testInfo.project.use.baseURL);

		await test.step("A cross-site Sec-Fetch-Site is rejected", async () => {
			const results = await Promise.all(
				urls.map((url) =>
					deleteCache(page, url, { "sec-fetch-site": "cross-site" }),
				),
			);

			for (const result of results) {
				expect(result.status, result.url).toBe(forbiddenStatus);
				expect(result.body, result.url).toEqual({
					error: "Cross-site request.",
				});
			}
		});

		await test.step("A foreign Origin is rejected", async () => {
			const results = await Promise.all(
				urls.map((url) =>
					deleteCache(page, url, { origin: "https://cross-site.example" }),
				),
			);

			for (const result of results) {
				expect(result.status, result.url).toBe(forbiddenStatus);
			}
		});

		// the Payload afterOperation hook calls these endpoints with a bare
		// same-process fetch, which sends neither header — the case the same-site
		// check treats as same-site. Revalidation is idempotent, so exercising it
		// here costs the suite nothing beyond a cache miss.
		await test.step("A header-less server-to-server call still succeeds", async () => {
			const results = await Promise.all(
				urls.map((url) => deleteCache(page, url)),
			);

			for (const result of results) {
				expect(result.status, result.url).toBe(noContentStatus);
			}
		});
	},
);

test(
	"The post cache-invalidation endpoint rejects an implausible slug",
	{
		tag: [
			"@scenario:post.caches.invalid-slug",
			"@area:posts",
			"@priority:should",
		],
	},
	async ({ page }, testInfo) => {
		const baseUrl = testInfo.project.use.baseURL;
		const slugs = ["Invalid_Slug", "a..b", "-leading-hyphen"];

		const results = await Promise.all(
			slugs.map((slug) =>
				deleteCache(page, `${new URL(`/posts/${slug}/caches`, baseUrl)}`),
			),
		);

		for (const result of results) {
			expect(result.status, result.url).toBe(badRequestStatus);
			expect(result.body, result.url).toEqual({ error: "Invalid slug." });
		}
	},
);

test(
	"The post cache-invalidation endpoint rejects a cross-site call before it judges the slug",
	{
		tag: ["@scenario:post.caches.csrf", "@area:posts", "@priority:should"],
	},
	async ({ page }, testInfo) => {
		// origin first, then input: a cross-site caller gets 403 rather than a 400
		// that would tell it which slugs the endpoint considers valid.
		const url = `${new URL("/posts/Invalid_Slug/caches", testInfo.project.use.baseURL)}`;
		const result = await deleteCache(page, url, {
			"sec-fetch-site": "cross-site",
		});

		expect(result.status).toBe(forbiddenStatus);
	},
);
