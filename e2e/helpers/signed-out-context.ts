import type { Browser, BrowserContext, TestInfo } from "@playwright/test";

/**
 * Opens a browser context carrying no Payload session, for a test whose own
 * `page` is signed in.
 *
 * Most tests are one visitor and set `test.use({ storageState })` for the whole
 * file. A share-link test is two: an author, who creates the post and reads its
 * secret through the authenticated API, and a reviewer, who has no account at
 * all. Logging the author out mid-test would conflate them and leave cleanup
 * without a session, so the reviewer gets a context of their own.
 *
 * The empty `storageState` is the whole point and is **not** redundant.
 * `browser.newContext()` under the test runner starts from the options the file
 * declared, `test.use({ storageState })` included, so a context created without
 * this line arrives carrying the author's `payload-token` cookie — and a test
 * that means to prove a signed-out reader is denied would silently prove
 * nothing.
 *
 * The remaining three options are carried across explicitly because they decide
 * what the request looks like: the base URL every relative path resolves
 * against, the locale the suite pins so the Japanese-primary site renders
 * deterministically, and the headers a protected preview deployment needs to let
 * the request through. The viewport is deliberately not carried across — this
 * context asserts content and status codes, never a snapshot.
 *
 * The caller closes it; `try`/`finally` is the shape that survives a failing
 * assertion.
 */
export async function openSignedOutContext({
	browser,
	testInfo,
}: {
	browser: Browser;
	testInfo: TestInfo;
}): Promise<BrowserContext> {
	return await browser.newContext({
		storageState: { cookies: [], origins: [] },
		baseURL: testInfo.project.use.baseURL,
		locale: testInfo.project.use.locale,
		extraHTTPHeaders: testInfo.project.use.extraHTTPHeaders,
	});
}
