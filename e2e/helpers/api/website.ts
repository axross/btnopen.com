import type { Page, TestInfo } from "@playwright/test";
import type z from "zod";
import { PayloadWebsite } from "@/repositories/payload-types";

export async function getWebsite({
	page,
	testInfo,
}: {
	page: Page;
	testInfo: TestInfo;
}): Promise<z.infer<typeof PayloadWebsite>> {
	const url = new URL("/api/globals/website", testInfo.project.use.baseURL);
	url.searchParams.set("draft", "true");

	const response = await page.request.get(`${url}`);

	if (!response.ok()) {
		throw new Error(
			"Failed to get the website record due to non-200 response.",
		);
	}

	const json = await response.json();

	return PayloadWebsite.parse(json);
}
