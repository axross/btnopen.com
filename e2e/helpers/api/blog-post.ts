import type { Page, TestInfo } from "@playwright/test";
import type z from "zod";
import { PayloadBlogPost } from "@/repositories/payload-types";

export const exampleBlogPostSlug = "markdown-example";

export async function getExampleBlogPost({
	page,
	testInfo,
}: {
	page: Page;
	testInfo: TestInfo;
}): Promise<z.infer<typeof PayloadBlogPost>> {
	const url = new URL("/api/blog-posts", testInfo.project.use.baseURL);
	url.searchParams.set("where[slug][equals]", exampleBlogPostSlug);
	url.searchParams.set("draft", "true");
	url.searchParams.set("limit", "1");

	const response = await page.request.get(`${url}`);

	if (!response.ok()) {
		throw new Error(
			"Failed to get the example blog post due to non-200 response.",
		);
	}

	const json = await response.json();
	const docs = json.docs;

	if (Array.isArray(docs) && docs.length > 0) {
		return PayloadBlogPost.parse(docs[0]);
	}

	throw new Error(
		"Failed to get the example blog post because it was not found.",
	);
}
