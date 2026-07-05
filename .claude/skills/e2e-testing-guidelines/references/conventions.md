# E2E Test Conventions

## Locator Usage

Elements are targeted by stable test-id hooks scoped through their container, so copy edits and markup reshuffles never break a spec. When a hook is missing, the fallback order goes through accessibility, then copy: role-based locators cover accessible controls that cannot carry a test id, and text matching is reserved for assertions about the copy itself. Document structure is a last resort reserved for DOM the project cannot instrument.

**Guidelines:**

- MUST use `getByTestId()` as the default for locating elements.
- MUST use kebab-case for test IDs.
- MUST use chained locators to narrow down the scope of the locator.
  - For example, `page.getByTestId("page").getByTestId("header")` instead of `page.getByTestId("header")`.
- MUST use `getByRole()`, matching by accessible name, for accessible controls (buttons, options, menu items) that cannot carry a test id — for example, elements portaled out of the component's own markup.
- MUST NOT use `getByText()` except when the assertion is about the copy itself, such as an empty-state message.
- MUST add a new `data-testid` to the component when no stable hook exists rather than reaching for a structural CSS selector.
- MAY scope a structural `locator()` inside a test-id-anchored container as a last resort for third-party-rendered DOM the project cannot instrument, when no role applies and the assertion is not about copy; leave a comment naming why no stable hook was possible.

**Example:**

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

Prefer Playwright's locator-native auto-waiting assertions (`toBeVisible()`, `toBeFocused()`, `toHaveAttribute()`, `toHaveClass()`, `toHaveText()`, `toHaveCount()`) over pulling DOM state back into the test via `locator.evaluate(...)` for manual comparison. Locator-native assertions auto-wait and produce clearer failure messages; e.g., write `await expect(scrollArea).toBeFocused()` instead of `expect(await scrollArea.evaluate((el) => el === document.activeElement)).toBe(true)`.

To assert state that no locator-native assertion covers (such as a computed style or a pseudo-element property), read it inside an `evaluate` on the host locator — for example, `getComputedStyle(element, "::before").opacity` for a `::before` / `::after` pseudo-element — and wrap the call in `expect.poll` so scroll-driven or transition-driven changes have time to settle.

**Guidelines:**

- MUST prefer Playwright's locator-native auto-waiting assertions (visibility, focus, attribute, class, text, count) over evaluating DOM state and comparing it manually in the test.
- MUST NOT use `page.waitForTimeout(...)` or fixed sleeps to "let the animation finish" (see [flakiness-tolerance.md](../../quality-assurance-guidelines/references/flakiness-tolerance.md)).
- MUST use `expect.poll(() => ...)` or `page.waitForFunction(...)` to re-sample state until the expected value is reached when no locator-native assertion covers it, such as scroll position, computed styles, scroll-driven animations, transitions, or intersection-observer-driven classes.

## Hooks Usage

Case-independent setup and cleanup belong in hooks so every spec starts from the same state and test bodies show only the behavior under test.

**Guidelines:**

- SHOULD use `test.beforeEach()` for setup that is not dependent on the test case.
- SHOULD use `test.afterEach()` for cleanup that is not dependent on the test case.

**Example:**

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

Re-authenticating in every test is slow and adds a failure mode unrelated to the behavior under test; a saved authenticated storage state lets each spec and its API helpers share one login. The setup project authenticates with the test user credentials from the `PAYLOAD_TEST_USER_EMAIL` and `PAYLOAD_TEST_USER_PASSWORD` environment variables and saves the state under `e2e/.data/`.

**Guidelines:**

- SHOULD use `test.use({ storageState: authenticatedStorageState })` when using API call functions.

**Example:**

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

Hard-coded expected values drift as content changes; fetching the same record through the API keeps UI assertions accurate without editing the spec every time the data moves.

**Guidelines:**

- SHOULD use API call functions to retrieve data to compare with the UI.
- SHOULD use API call functions in each test case.
- SHOULD use API call functions in `test.beforeEach()` instead of within the test case if it is not dependent on the test case.

**Example:**

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

Centralizing request wiring in named helpers keeps auth state, URL construction, and response validation consistent across specs, so test cases read as behavior instead of HTTP plumbing.

**Example:**

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

	// use page.request for API calls so it shares the test's auth state
	const response = await page.request.get(`${url}`);

	if (!response.ok()) {
		throw new Error(
			"Failed to get the example blog post due to non-200 response.",
		);
	}

	const json = await response.json();
	const docs = json.docs;

	if (Array.isArray(docs) && docs.length > 0) {
		// parse with the project's schema to validate the response shape
		return PayloadBlogPost.parse(docs[0]);
	}

	throw new Error(
		"Failed to get the example blog post because it was not found.",
	);
}
```

**Guidelines:**

- MUST define API call functions in `@/e2e/helpers/api/`.
- SHOULD use kebab-case for file names.
- SHOULD named-export the function.
- SHOULD take `page` and `testInfo` as arguments.
- MUST use `page.request` to make API calls so they share the test's authenticated state.
