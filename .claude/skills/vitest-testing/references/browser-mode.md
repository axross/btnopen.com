# Browser Mode

Apply this reference when a test needs a real browser — component rendering, CSS layout, genuine event dispatch — rather than a DOM shim.

Verified against Vitest 4.1.10, where Browser Mode is stable — <https://vitest.dev/guide/browser/>

## What It Buys

A DOM shim reimplements browser APIs in JavaScript. Browser Mode runs the tests in an actual browser, which is the only way to see the class of bug a shim cannot produce: CSS layout and computed styles, real event dispatch and bubbling, focus and selection behavior, and APIs the shim stubs approximately.

That confidence costs startup time and a browser binary in CI, so it is a per-suite decision rather than a default.

**Guidelines:**

- SHOULD move a test to Browser Mode when it depends on layout, computed style, or real event behavior, rather than stubbing more of the shim.
- SHOULD keep pure logic in a `node` environment; a browser adds nothing there.

## Setup Changed in v4

Three things moved, and a v3-era config fails on all of them:

- The provider is an **object from a separately installed package** — `@vitest/browser-playwright`, `@vitest/browser-webdriverio`, or `@vitest/browser-preview` — not the string it was in v3.
- Browser APIs import from **`vitest/browser`**; the `@vitest/browser/context` and `@vitest/browser/utils` paths are gone, and the `@vitest/browser` package is no longer needed.
- `preview` is no longer the default provider.

`vitest init browser` scaffolds the dependencies and config. Vitest reserves port 63315 to avoid colliding with a dev server, and the framework's own Vite plugin must be installed.

```ts
browser: {
  enabled: true,
  provider: playwright(),
  instances: [{ browser: "chromium" }],
}
```

**Guidelines:**

- MUST install a provider package and pass its object; a provider string does not resolve in v4.
- MUST import browser APIs from `vitest/browser`.
- SHOULD choose Playwright for CI — it parallelizes and drives through CDP — and reserve `preview` for local development, since it simulates events rather than driving them.

## Locators and Interaction

`page.getByRole`, `getByLabelText`, `getByTestId` and their siblings return locators. Assertions on them are **asynchronous**: `await expect.element(locator).toBeVisible()`, not the synchronous `expect` used elsewhere.

`userEvent` from `vitest/browser` drives interaction through CDP or WebDriver — real input, not synthesized events. This is a different thing from `@testing-library/user-event`, which dispatches synthetic events; mixing them in one suite produces inconsistent behavior.

**Guidelines:**

- MUST `await expect.element(...)` for DOM assertions in Browser Mode; the synchronous form does not retry.
- MUST use `userEvent` from `vitest/browser` rather than the Testing Library equivalent, and not both.
- SHOULD follow the project's existing locator conventions; a capability owning end-to-end tests defines the fallback hierarchy, and a component capability defines the test-hook attributes.

## Rendering Components

`vitest-browser-react`, `vitest-browser-vue`, and `vitest-browser-svelte` render components; Lit, Preact, Qwik, Solid, and Marko are also supported. For a framework without an official package, `page.elementLocator()` bridges a Testing Library render into Vitest's locator API.

**Guidelines:**

- SHOULD use the official `vitest-browser-*` package for the project's framework rather than a Testing Library render plus a bridge.
- MUST NOT mix Testing Library queries with Vitest locators against the same element; use one query API per test.

## Documented Limits

- `alert`, `confirm`, and `prompt` block the thread and hang the run. Vitest provides default mocks; mocking them explicitly is safer.
- ESM module namespaces are **sealed**, so spying on an export does not work. `vi.mock(..., { spy: true })` is the supported way.
- Modern browsers only: Chrome >= 87, Firefox >= 78, Safari >= 15.4, Edge >= 88.
- `headless` requires Playwright or WebdriverIO; `preview` cannot run headless.

**Guidelines:**

- MUST mock dialog APIs explicitly in any test whose code path can reach one.
- MUST use `{ spy: true }` to observe a module export in Browser Mode; direct spying fails on the sealed namespace.

## Keep the Suites Separate

Browser and Node tests want different environments, isolation, and startup costs. Splitting them into `projects` lets one run cover both without either paying the other's overhead.

**Guidelines:**

- SHOULD define browser tests as their own project rather than toggling `browser.enabled` for the whole suite.
- MUST NOT run the whole suite in a browser to accommodate a handful of component tests.
