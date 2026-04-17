# E2E Coverage

Apply these rules to verify the change has the right e2e coverage. The project relies on Playwright e2e tests as the **primary** verification mechanism per [development-guidelines › verification](../development-guidelines/verification.md).

## Coverage Floor

- MUST flag a Critical when the diff adds a new route (any new `page.tsx` under `app/(app)/`) without a co-located test file under `e2e/tests/routes/<route>/`.
- MUST flag a Major when the diff adds a new visually distinct page section to an existing route without a new `test()` (or `test.step()`) covering it.
- MUST flag a Major when the diff adds a new user-facing feature (a new interactive element, a new server action, a new `route.ts` endpoint) without an e2e assertion that exercises the user-observable outcome.
- SHOULD NOT demand unit tests for pure logic unless the logic is complex enough that e2e would not adequately exercise edge cases — the project explicitly de-prioritizes unit tests per [development-guidelines › verification](../development-guidelines/verification.md).

## `data-testid` Hooks

- MUST flag a Major when the diff introduces a new visually distinct element (a new section, a new button, a new image, a new list) without a `data-testid` attribute. The e2e suite cannot target it otherwise per [react-component-guidelines › testable-components](../react-component-guidelines/testable-components.md).
- MUST flag a Critical when the diff **removes** a `data-testid` that an existing e2e test references. Cross-check with `Grep` over `e2e/tests/`.
- MUST flag any use of `getByText()` in a new or modified test — the project rule is `getByTestId()` only per [e2e-testing-guidelines › conventions](../e2e-testing-guidelines/conventions.md).
- MUST flag a `data-testid` value that is not kebab-case.
- SHOULD flag a `data-testid` value chosen to be globally unique (e.g., `"blog-post-header-title"`) instead of scope-relative (`"title"`) — the project chains locators per the nesting pattern in [react-component-guidelines › testable-components](../react-component-guidelines/testable-components.md).

## Loading State Coverage

- SHOULD flag a new component using the loading/loaded split pattern that lacks a `data-testid={…+ "-loading"}` propagation in its orchestrator — without it, e2e cannot assert the skeleton is visible.
- MAY suggest adding a `test.step()` that asserts the `-loading` skeleton is visible before the `loaded` state appears, when the loading state is user-visible (i.e., not behind an inner Suspense whose fallback is empty).

## Test File Conventions

- MUST flag a new test file not named `<thing>.test.ts` (kebab-case + `.test.ts`).
- MUST flag a new test file placed outside `e2e/tests/routes/<route>/…` for a route-specific test.
- MUST flag a `test()` body that does not wrap each action in a `test.step()` per [e2e-testing-guidelines › structure](../e2e-testing-guidelines/structure.md).
- MUST flag a chained-locator chain that re-roots at `page.getByTestId(…)` mid-test instead of narrowing from a previously captured `Locator` — defeats the readability of the nesting pattern.

## API Helpers

- MUST flag an API call (`page.request.get(…)`) made inline in a test body when an existing helper under `e2e/helpers/api/` exists for that resource. Use the helper.
- MUST flag a new API helper that does not live under `e2e/helpers/api/`, does not take `{ page, testInfo }`, or does not use `page.request` per [e2e-testing-guidelines › conventions](../e2e-testing-guidelines/conventions.md).
- MUST flag a test that calls API helpers without `test.use({ storageState: authenticatedStorageState })` when the API requires auth (anything that hits Payload's draft-aware endpoints).
