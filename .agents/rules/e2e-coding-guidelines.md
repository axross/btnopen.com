---
trigger: glob
globs: e2e/**/*.test.ts
---

# E2E Coding Guidelines

Refer [E2E Test Instructions](.agents/rules/e2e-instruction.md) for the project structure and the general instructions.

## Authentication

Most routes require authentication. Apply storage state at the top of the file using `test.use({ storageState })`:

```ts
test.use({ storageState: authenticatedStorageState });
```

Do not authenticate inside individual tests or `beforeEach` hooks manually — rely on the stored session.

## Testing with Draft Data

Some of the test targets are in draft state. To use, include `?draft=true` for navigation:

```ts
await test.step("Navigate to the index route (draft=true)", async () => {
  await page.goto("/?draft=true");
});
```

## Test Structure

- Every assertion and interaction must be wrapped in a `test.step()` with a descriptive, human-readable label
- Each test should focus on a single, well-defined concern (e.g., metadata, a specific UI section, a navigation flow)
- Declare `Locator` variables with `let` outside `test.step` blocks when they need to be shared across steps:

```ts
let blogPost!: Locator;

await test.step("Verify blog post list is visible", async () => {
  blogPostList = page.getByTestId("blog-posts");
  await expect(blogPostList).toBeVisible();
});

await test.step("Verify example blog post appears", async () => {
  blogPost = blogPostList.locator(`[data-testid="blog-post"][data-slug="${slug}"]`);
  await expect(blogPost).toBeVisible();
});
```

## Locators

- Prefer `getByTestId()` for element selection — all meaningful UI elements have `data-testid` attributes in the source
- Scope locators by chaining from a parent to avoid ambiguity:
  ```ts
  page.getByTestId("page").getByTestId("header").getByTestId("title")
  ```
- For list items that have additional data attributes (like `data-slug`), use `locator()` with an attribute selector:
  ```ts
  blogPostList.locator(`[data-testid="blog-post"][data-slug="${slug}"]`)
  ```
- Never use CSS class selectors, XPath, or fragile text-based selectors when `data-testid` is available
- Never use `waitForNetworkIdle` or deprecated APIs

## API Helpers

Fetch test data via the Payload CMS REST API using the provided helpers. Always pass `{ page, testInfo }`:

```ts
const blogPost = await getExampleBlogPost({ page, testInfo });
const website = await getWebsite({ page, testInfo });
```

- These helpers call the API using `page.request.get()` and validate responses with Zod schemas
- Fetch data inside a `test.step()` block
- Use return values to drive assertions — never hardcode expected values that come from data (titles, names, etc.)
- The "example" blog post has slug `markdown-example` and is the canonical fixture for blog post tests

## Metadata Tests

For JSON-LD metadata tests:
- Query for `script[type="application/ld+json"]` with `page.locator()`
- Use `expect(ldJson).toBeAttached()` before reading content
- Parse and verify with `expect.objectContaining()` to be resilient to field additions:
  ```ts
  expect(JSON.parse(content ?? "{}")).toEqual(
    expect.objectContaining({
      "@context": "https://schema.org",
      "@type": "Blog",
      ...
    })
  );
  ```

For Open Graph metadata tests:
- Select with `page.locator('meta[property="og:title"]')` and assert with `toHaveAttribute("content", value)`

## Screenshot Tests

Use `toHaveScreenshot()` with a descriptive filename for visual regression tests:

```ts
await expect(header.getByTestId("cover-image")).toHaveScreenshot("cover-image.png");
```

Screenshot files are stored per platform and project, managed automatically by the config.

## Test Grouping

Group related tests by their concern at the file level — one file per route. Within a file, name each `test()` block after the section or feature it covers:

```
"Blog post header"
"Blog post content"
"JSON-LD metadata"
"Open Graph metadata"
```

## URL Assertions

After navigation actions, verify the URL using both `waitForURL` and `toHaveURL` for robustness:

```ts
await page.waitForURL(`/posts/${slug}?draft=true`);
await expect(page).toHaveURL(`/posts/${slug}?draft=true`);
```

## What Not To Do

- Do not use `page.waitForNetworkIdle()` — it's discouraged and deprecated
- Do not use `test.skip()` unless accompanied by a comment explaining what the app does instead
- Do not hardcode dynamic values (titles, names, slugs) — always fetch them from API helpers
- Do not share state between tests — each test must be independent
- Do not use `test.only()` or `test.skip()` in committed code on CI (`forbidOnly: true` in config)
- Do not write tests without `test.step()` — all actions and assertions must be clearly labeled