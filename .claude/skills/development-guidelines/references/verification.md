# Verification

Apply these guidelines to confirm that any change produces the correct application output before considering the task done.

## Identifying Affected Output Surfaces

Use this table to determine which output surfaces a change puts at risk:

| Changed area | Output surface at risk |
|---|---|
| `page.tsx`, `layout.tsx`, components under `_components/` (route-local) or `_/components/` (shared across the route group) | Rendered pages |
| Repository functions or data-fetching logic | Rendered pages, content fidelity |
| Route segment files, `not-found.tsx`, `global-not-found.tsx` | Routing and navigation |
| `generateMetadata`, `sitemap.ts`, `robots.ts`, OG image `route.tsx` | Metadata and discoverability |
| Markdown processing pipeline | Content fidelity |
| Sentry config (`sentry.*.config.ts`), logger setup | Observability |

- Changes that touch none of the above — type definitions, Payload CMS collection config, migration files, or utilities with no UI call path — do not put any output surface at risk.

**Guidelines:**

- MUST map changed files to their at-risk output surfaces before choosing the verification path.

## Manual Verification

Manual verification is the first line of confirmation. Run it before the automated suite.

**Guidelines:**

- MUST start the development server (`npm run dev`, available at `http://localhost:3000`) and navigate to the affected route after every change that touches an output surface.
- MUST verify both published and draft states when the route displays CMS-managed content. Draft state is accessible by appending `?draft=true` to the URL while authenticated through the Payload CMS admin panel at `/admin`.
- MUST verify the not-found page renders when the change affects routing or error handling (e.g., navigate to a non-existent slug).

## Automated Verification

The e2e suite drives the real application through the full render pipeline, so it is the evidence that an output surface still behaves after a change.

**Guidelines:**

- MUST run the full end-to-end test suite after any change that touches an output surface:
  ```bash
  npm run test:e2e
  ```
- MUST follow the e2e authoring and coverage rules owned by [e2e-testing-guidelines](../../e2e-testing-guidelines/SKILL.md) and [quality-assurance-guidelines › e2e-coverage](../../quality-assurance-guidelines/references/e2e-coverage.md) — new-route/feature coverage, stable `data-testid` identifiers, and co-location under `e2e/` — rather than restating them here.

## E2E Tests vs Unit Tests

This project relies on end-to-end tests as the primary verification mechanism. E2E tests run against the real application with a real database and cover the full rendering pipeline from data fetching through to the browser.

**Guidelines:**

- SHOULD NOT write unit tests as a substitute for E2E coverage. Unit tests cannot verify that the rendered output is correct.
- MAY write unit tests for pure logic (e.g., utility functions, data transformations) where the logic is complex enough that E2E tests alone would not adequately exercise edge cases.

## Flakiness

The Playwright configuration repeats every test case twice (`repeatEach: 2`) and fails the suite if any test produces inconsistent results (`failOnFlakyTests: true`).

**Guidelines:**

- MUST investigate the root cause of flaky failures — timing issues, race conditions, or test isolation problems — rather than re-running the suite and hoping for green.
- MUST NOT disable `repeatEach` or `failOnFlakyTests` to work around flakiness.

## Responding to Failures

A red test is usually reporting a real regression; muting it ships the defect while destroying the signal that would have caught the next one.

- Snapshots are platform-specific — the snapshot path includes a `{/platform}` segment. Running `--update-snapshots` locally on macOS will update macOS snapshots only, not the Linux snapshots used in CI. See [quality-assurance-guidelines › snapshot-handling](../../quality-assurance-guidelines/references/snapshot-handling.md) for the full snapshot-review discipline.

**Guidelines:**

- MUST NOT delete test cases or weaken assertions to make a failure pass.
- SHOULD update snapshot expectations only when the output change is intentional and the new output satisfies the relevant feature requirement. Use `npm run test:e2e -- --update-snapshots` to regenerate them.
- SHOULD surface pre-existing failures to the user rather than working around them.

## CI Pipeline

Two workflows verify changes automatically:

- `merge-checks.yaml` — the fast merge-gating CI: lint (`npm run lint`) and unit tests (`npm run test:unit`) on every pull request and on pushes to `main`.
- `check-and-deploy.yaml` — the heavier pipeline on pushes to `main`: lint → Playwright e2e tests → Vercel production deployment.

- CI runs E2E tests against `http://localhost:3000` (the app is started locally within the CI runner), not against a deployed Vercel URL. The `PLAYWRIGHT_BASE_URL` environment variable can override this.
- CI runs tests with `--update-snapshots` and auto-creates a PR for any snapshot differences. Snapshot changes still require review — an auto-created snapshot PR does not mean the visual change is acceptable.

**Guidelines:**

- MUST treat CI-created snapshot PRs as review-required evidence, not automatic approval of the visual change.
