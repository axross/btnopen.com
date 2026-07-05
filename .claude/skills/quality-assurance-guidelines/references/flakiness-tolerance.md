# Flakiness Tolerance

Apply these rules to verify the change does not introduce or paper over test flakiness. The project's `playwright.config.ts` sets `repeatEach: 2` and `failOnFlakyTests: true` — flakiness fails the suite, not just retries away.

## Flakiness Workarounds to Reject

Each of these hides a real race instead of fixing it, so the nondeterminism ships and resurfaces later in CI.

**Guidelines:**

- MUST flag a Critical when a new or modified test contains:
  - `await new Promise((resolve) => setTimeout(resolve, <ms>))` or `await page.waitForTimeout(<ms>)` — fixed sleeps are an anti-pattern. Use Playwright's auto-waiting, `expect(locator).toBeVisible()`, `page.waitForResponse(…)`, or `page.waitForLoadState(…)` instead.
  - A `try`/`catch` around an `expect(…)` to "make the test pass when it sometimes fails".
  - A `test.skip(…)` or `test.fixme(…)` added to suppress an intermittent failure rather than to skip a known-broken test with a tracked issue.
  - A `for (let i = 0; i < <n>; i++)` retry loop wrapping an assertion.
- MUST flag a Critical when the diff modifies `playwright.config.ts` to weaken `repeatEach`, `failOnFlakyTests`, `forbidOnly`, or to add `retries: > 0`. Defer the change to the human owner per [escalation.md](../../code-review-guideline/references/escalation.md).

## Root-Cause Investigation

Retargeting the assertion only moves the flake out of sight; the underlying race is still live and will fire again under different timing.

**Guidelines:**

- MUST flag when a flake is "fixed" by changing the assertion target rather than fixing the underlying race (e.g., changing `toHaveText("foo")` to `toContainText("f")`).
- SHOULD ask the author to identify the specific race (e.g., "did the response arrive before the assertion ran?", "was a Suspense boundary still loading?") in the PR description.

## `.only()` and `.skip()`

A stray `.only()` hard-fails CI, and a silent skip quietly shrinks the suite until no one remembers what stopped running.

**Guidelines:**

- MUST flag a Critical for any committed `test.only(…)`, `test.describe.only(…)`, `test.step.only(…)` — CI's `forbidOnly: isCI` will fail the build.
- MUST flag a Major for any committed `test.skip(…)` or `test.fixme(…)` without a tracked-issue comment explaining what's skipped, why, and when it's expected to be re-enabled.

## Authentication and Storage State

State that a test assumes but never sets up — a logged-in session, a clean fixture — is exactly the state that differs between a developer's machine and CI, or between the first run and the next.

**Guidelines:**

- SHOULD flag a test that hits Payload's draft endpoints without `test.use({ storageState: authenticatedStorageState })` — it will succeed when run locally with a logged-in browser session and fail in CI, which is a flakiness pattern.
- SHOULD flag a test that mutates Payload state (e.g., creates a draft, updates a tag) without a corresponding `test.afterEach` cleanup — the next iteration of `repeatEach: 2` will see the mutation and behave differently.

## Network and External Dependencies

Anything the test doesn't control — a remote host's availability, the wall clock — turns a pass into a coin flip across repeated runs.

**Guidelines:**

- SHOULD flag a test that depends on a live external URL (e.g., the webembed pipeline fetching real social media metadata) without a route mock or fixture — external availability flakes the test.
- SHOULD flag a test that asserts on `Date.now()`-derived UI (e.g., "5 minutes ago") without freezing the clock — time-dependent assertions are inherently flaky across `repeatEach`.
