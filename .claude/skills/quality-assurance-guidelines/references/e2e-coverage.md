# E2E Coverage

Apply these rules to verify the change has the right e2e coverage. The project relies on Playwright e2e tests as the **primary** verification mechanism per the project's development guidelines (verification rules).

## Coverage Floor

A new route or surface with no test is a hole in the project's primary verification mechanism — nothing re-checks it after the next change.

**Guidelines:**

- MUST flag a Critical when the diff adds a new route (any new `page.tsx` under `app/(app)/`) without a co-located test file under `e2e/tests/routes/<route>/`.
- MUST flag a Major when the diff adds a new visually distinct page section to an existing route without a new `test()` (or `test.step()`) covering it.
- MUST flag a Major when the diff adds a new user-facing feature (a new interactive element, a new server action, a new `route.ts` endpoint) without an e2e assertion that exercises the user-observable outcome.
- SHOULD NOT demand unit tests for pure logic unless the logic is complex enough that e2e would not adequately exercise edge cases — the project explicitly de-prioritizes unit tests per the project's development guidelines (verification rules).

## `data-testid` Hooks

Because the suite locates elements primarily by `data-testid`, an element that ships without a stable hook is invisible to most future tests.

**Guidelines:**

- MUST flag a Major when the diff introduces a new visually distinct element (a new section, a new button, a new image, a new list) without a `data-testid` attribute. The e2e suite cannot target it otherwise per the project's React component guidelines (testable-components rules).
- MUST flag a Critical when the diff **removes** a `data-testid` that an existing e2e test references. Cross-check with `rg` over `e2e/tests/`.
- MUST flag any locator in a new or modified test that violates the locator hierarchy of the project's e2e testing guidelines (conventions rules) — e.g., `getByText()` matching where the assertion is not about the copy itself.
- MUST flag a `data-testid` value that is not kebab-case.
- SHOULD flag a `data-testid` value chosen to be globally unique (e.g., `"blog-post-header-title"`) instead of scope-relative (`"title"`) — the project chains locators per the nesting pattern in the project's React component guidelines (testable-components rules).

## Loading State Coverage

The loading half of a split component is a distinct user-visible state; without a way to target its skeleton, that state ships unverified.

**Guidelines:**

- SHOULD flag a new component using the loading/loaded split pattern that lacks a `data-testid={…+ "-loading"}` propagation in its orchestrator — without it, e2e cannot assert the skeleton is visible.
- MAY suggest adding a `test.step()` that asserts the `-loading` skeleton is visible before the `loaded` state appears, when the loading state is user-visible (i.e., not behind an inner Suspense whose fallback is empty).

## Test File Conventions

Consistent names and locations are what let the runner discover route tests and what let the next reader find them.

**Guidelines:**

- MUST flag a new test file not named `<thing>.test.ts` (kebab-case + `.test.ts`).
- MUST flag a new test file placed outside `e2e/tests/routes/<route>/…` for a route-specific test.
- MUST flag a multi-phase `test()` body that does not group its phases into `test.step()` calls per the project's e2e testing guidelines (structure rules) — short atomic tests may omit steps.
- MUST flag a chained-locator chain that re-roots at `page.getByTestId(…)` mid-test instead of narrowing from a previously captured `Locator` — defeats the readability of the nesting pattern.

## Scenario Coverage

Scenario coverage tracks which real user journeys the e2e suite **asserts**, via the human-authored journey catalog (`e2e/scenarios.md`) and per-test `@scenario` tags — not e2e line coverage. Its denominator is the catalog itself, so review guards the catalog's completeness as much as the tests. See the project's e2e testing guidelines (scenario-coverage rules) for the mechanism.

**Guidelines:**

- MUST require scenario-coverage evidence when a change adds or alters a user-facing journey: the overall and per-priority `covered/total` from `npm run coverage:scenarios`, plus any newly surfaced gaps.
- MUST flag a Major when a change adds a new user-facing journey without a corresponding `e2e/scenarios.md` row, per the catalog-completeness rule in the project's e2e testing guidelines (scenario-coverage rules).
- MUST treat a new `must`-priority scenario as a blocker until a passing tagged test asserts it; `should` / `may` gaps are reported, not blocking.
- MUST flag a stale or mistyped `@scenario` tag, an `@area`/`@priority` facet tag that disagrees with the catalog, and any tag placement that violates the tagging rules of the project's e2e testing guidelines (scenario-coverage rules) (e.g., a `@scenario` tag on a pass-through test).
- SHOULD note surfaced `should` / `may` gaps as follow-up work rather than silently expanding the change's scope to close them.

## API Helpers

Inline setup duplicated across tests drifts out of sync as the resource changes; a shared helper keeps every test on the same, current path.

**Guidelines:**

- MUST flag an API call (`page.request.get(…)`) made inline in a test body when an existing helper under `e2e/helpers/api/` exists for that resource. Use the helper.
- MUST flag a new API helper that does not live under `e2e/helpers/api/`, does not take `{ page, testInfo }`, or does not use `page.request` per the project's e2e testing guidelines (conventions rules).
- MUST flag a test that calls API helpers without `test.use({ storageState: authenticatedStorageState })` when the API requires auth (anything that hits Payload's draft-aware endpoints).
