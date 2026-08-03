import type { Page, TestInfo } from "@playwright/test";
import type { PayloadLocale } from "@/shared/payload-types";
import { isRecord } from "./mcp";

// the shared placeholder media both seed posts embed in their bodies via the
// `![media:<id>]()` upload directive (`sharedMediaId` in
// `payload/helpers/seed.ts`). Its `alt` is seeded in both locales.
export const sharedMediaId = "019d1223-94d4-754c-8f57-47337be15c9e";

// reads the shared media's localized `alt` through the public REST API, so a
// test asserts the rendered alt against what the CMS holds for that locale
// rather than against its own copy of the seeded string.
export async function getSharedMediaAlt({
	locale,
	page,
	testInfo,
}: {
	locale: PayloadLocale;
	page: Page;
	testInfo: TestInfo;
}): Promise<string> {
	const url = new URL(
		`/api/media/${sharedMediaId}`,
		testInfo.project.use.baseURL,
	);
	url.searchParams.set("locale", locale);
	url.searchParams.set("depth", "0");

	const response = await page.request.get(`${url}`);

	if (!response.ok()) {
		throw new Error(
			`Failed to get the shared media: ${response.status()} ${await response.text()}`,
		);
	}

	const json: unknown = await response.json();

	if (isRecord(json) && typeof json.alt === "string" && json.alt.trim()) {
		return json.alt;
	}

	throw new Error(
		`Failed to get the shared media's ${locale} alt text because it was empty.`,
	);
}
