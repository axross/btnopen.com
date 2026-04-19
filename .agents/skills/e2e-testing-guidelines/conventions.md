# E2E Test Conventions

## Locator Usage

- MUST use `getByTestId()` for locators.
- MUST use kebab-case for test IDs.
- MUST use chained locators to narrow down the scope of the locator.
  - For example, `page.getByTestId("page").getByTestId("header")` instead of `page.getByTestId("header")`.
- SHOULD use `locator()` for locators that are not impossible to implement with `getByTestId()`.
- MUST NOT use `getByText()` for locators.

Example:

```ts
import { expect, type Locator, test } from "@playwright/test";

test("Introduction section", async ({ page }) => {
	const indexPage = page.getByTestId("page");
	let intro: Locator;

	await test.step("Verify the bio", async () => {
		intro = indexPage.getByTestId("intro");

		await expect(intro.getByTestId("bio")).toBeVisible();
	});

	await test.step("Verify the social links", async () => {
		const socialLinks = intro.getByTestId("social-links");

		await test.step("Verify the GitHub link", async () => {
			await expect(socialLinks.getByTestId("github")).toBeVisible();
		});

		await test.step("Verify the X link", async () => {
			await expect(socialLinks.getByTestId("xcom")).toBeVisible();
		});

		await test.step("Verify the LinkedIn link", async () => {
			await expect(socialLinks.getByTestId("linkedin")).toBeVisible();
		});
	});
});
```

## Assertions

- MUST prefer Playwright's locator-native assertions (`toBeVisible()`, `toBeFocused()`, `toHaveAttribute()`, `toHaveClass()`, `toHaveText()`, `toHaveCount()`) over `locator.evaluate(...)` that pulls DOM state back to the test for manual comparison. Locator-native assertions auto-wait and produce clearer failure messages; e.g., write `await expect(scrollArea).toBeFocused()` instead of `expect(await scrollArea.evaluate((el) => el === document.activeElement)).toBe(true)`.
- For state that no locator-native assertion covers — scroll position, computed styles, scroll-driven animations, transitions, intersection-observer-driven classes — MUST use `expect.poll(() => ...)` or `page.waitForFunction(...)` to re-sample until the expected value is reached. MUST NOT use `page.waitForTimeout(...)` or fixed sleeps to "let the animation finish" (see [flakiness-tolerance.md](../quality-assurance-guidelines/flakiness-tolerance.md)).
- To assert visual state on a pseudo-element (`::before` / `::after`), read it inside an `evaluate` on the host locator via `getComputedStyle(element, "::before").opacity` (or the relevant property) and wrap the call in `expect.poll` so scroll-driven or transition-driven changes have time to settle.

## Hooks Usage

- SHOULD use `test.beforeEach()` for setup that is not dependent on the test case.
- SHOULD use `test.afterEach()` for cleanup that is not dependent on the test case.

Example:

```ts
import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
	await test.step("Navigate to the index route (draft=true)", async () => {
		await page.goto("/?draft=true");
	});
});
```

## API Calls

### Authentication

- SHOULD use `test.use({ storageState: authenticatedStorageState })` when using API call functions.

Example:

```ts
import { test } from "@playwright/test";
import { authenticatedStorageState } from "@/e2e/helpers/api/auth";

test.use({ storageState: authenticatedStorageState });

test.beforeEach(async ({ page }) => {
	await test.step("Navigate to the index route (draft=true)", async () => {
		await page.goto("/?draft=true");
	});
});
```

### API Call Usage

- SHOULD use API call functions to retrieve data to compare with the UI.
- SHOULD use API call functions in each test case.
- SHOULD use API call functions in `test.beforeEach()` instead of within the test case if it is not dependent on the test case.

Example:

```ts
import { expect, test } from "@playwright/test";
import { getExampleBlogPost } from "@/e2e/helpers/api/blog-post";
import { authenticatedStorageState } from "@/e2e/helpers/api/auth";

test.use({ storageState: authenticatedStorageState });

test("Blog post header", async ({ page }, testInfo) => {
	let blogPost: Awaited<ReturnType<typeof getExampleBlogPost>>;

	await test.step("Retrieve the example blog post record", async () => {
		blogPost = await getExampleBlogPost({ page, testInfo });
	});

	const header = page.getByTestId("page").getByTestId("header");

	await test.step("Verify the blog post title", async () => {
		await expect(header.getByTestId("title")).toHaveText(blogPost.title);
	});

	await test.step("Verify the blog post author", async () => {
		await expect(header.getByTestId("author")).toHaveText(blogPost.author.name);
	});
});
```

### API Call Function Definitions

- API call functions MUST be defined in `@/e2e/helpers/api/`.
- SHOULD use kebab-case for file names.
- SHOULD named-export the function.
- SHOULD take `page` and `testInfo` as arguments.
- MUST use `page.request` to make API calls.

Example:

```ts
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
```
