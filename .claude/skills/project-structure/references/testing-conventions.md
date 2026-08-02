# Testing Conventions

Apply this reference when adding or changing a test, or a component's test hooks. How to design a unit test, how to locate and wait in an end-to-end test, and how a scenario-coverage catalog works belong to the unit testing and end-to-end testing capabilities. This reference records the runners, paths, and naming this repository uses.

| Surface | This project |
| --- | --- |
| Unit tests | Jest, colocated `*.spec.ts`, run with `npm run test:unit` |
| End-to-end tests | Playwright under `e2e/`, run with `npm run test:e2e` |
| Scenario-coverage gate | `npm run coverage:scenarios` |
| Type check | `tsc --noEmit`, run with `npm run typecheck` |

`npm run lint`, `npm run typecheck`, and `npm run test:unit` gate a merge (the Merge Checks workflow). The e2e suite and the scenario-coverage gate run after merge, in the Check and Deploy workflow, so a `must`-priority coverage regression fails on `main` rather than on the pull request that introduced it.

## Unit Tests

Jest output reads like a behavior report, so the full name — `describe(...)` concatenated with `it(...)` — carries the subject, the condition, and the expected outcome. The suffix conventions below are what make the subject's kind legible at a glance.

**Guidelines:**

- MUST colocate unit tests as `*.spec.ts` beside their subject unless an existing local pattern requires otherwise.
- MUST import Jest APIs from `@jest/globals` — `describe`, `it`, `expect`, `jest`, `beforeEach`, `afterEach`, and any other API used in the file — rather than relying on global-scope symbols.
- MUST use `it(...)` for scenarios and MUST NOT use `test(...)`.
- MUST suffix callable subjects in `describe(...)` / `it(...)` titles with `()` — `describe("formatLocation()")`, `describe("deleteNodeInBlogPostBodyTool()")` — and leave non-callable subjects bare: schemas, codecs, and type contracts as `describe("McpBlogPostResponse")`, UI components in angle brackets as `describe("<BlogPostHeader>")`.
- SHOULD prefer integration or e2e coverage when confidence depends on Next.js or Payload runtime wiring, browser behavior, rendering, providers, routing, or user-facing UI.

## End-to-End Tests

Playwright writes run artifacts to `.playwright-results/` and keeps visual snapshots in a `__snapshots__/` directory beside the test files that own them.

```text
<root>
├── .playwright-results/               # test run output (traces, videos)
├── e2e/
│   ├── .data/                         # local temporary data, incl. saved auth state
│   ├── helpers/                       # test helpers (API call functions in api/)
│   ├── reporters/                     # scenario-coverage reporter
│   ├── scenarios.md                   # journey catalog (the coverage denominator)
│   └── tests/
│       ├── setup.test.ts              # Playwright `setup` project
│       ├── teardown.test.ts           # Playwright `cleanup` project
│       ├── metadata.test.ts           # website-global metadata test
│       └── routes/                    # route-specific tests, mirroring the route tree
│           ├── index/
│           │   ├── __snapshots__/
│           │   └── page.test.ts
│           └── posts/
│               └── ...
└── ...
```

**Guidelines:**

- MUST place route-specific e2e tests under `e2e/tests/routes/`, mirroring the route tree, and keep reusable helpers under `e2e/helpers/` with API call functions in `e2e/helpers/api/`.
- MUST keep `setup.test.ts` and `teardown.test.ts` directly under `e2e/tests/`; they belong to the dedicated `setup` / `cleanup` Playwright projects that the device projects (such as `pixel`) depend on.
- MUST name test files in kebab-case with the `.test.ts` extension.
- MUST define API call functions in `e2e/helpers/api/`, named-exported, taking `page` and `testInfo`, and using `page.request` so calls share the test's authenticated state.
- SHOULD reuse the saved authenticated state with `test.use({ storageState: authenticatedStorageState })` rather than logging in per test. The `setup` project authenticates with `PAYLOAD_TEST_USER_EMAIL` / `PAYLOAD_TEST_USER_PASSWORD` and saves state under `e2e/.data/`.
- SHOULD target a deployed environment only by setting `PLAYWRIGHT_BASE_URL` deliberately, such as `PLAYWRIGHT_BASE_URL=https://btnopen.com npm run test:e2e`.
- MUST keep the suite's device projects to the two responsive tiers that carry a structural transformation — `pixel` (412px, mobile) and `tablet` (712px, tablet), both on Chromium. The five mobile→tablet structural transformations in [responsive-layout.md](../../visual-identity/references/responsive-layout.md) all fire across that pair. The desktop tier is deliberately uncovered: it adjusts density rather than structure, and `workers: 1` means every added project serializes another full pass. Adding one is a cost decision for @axross, not a default.
- MUST let CI generate a new device project's Linux snapshot baselines. Check and Deploy runs `--update-snapshots` and opens a snapshot pull request; the matching darwin baselines come from a maintainer running `npm run test:e2e -- --update-snapshots` on macOS. A baseline captured in a cloud session does not match the GitHub runner's rendering.
- SHOULD run `PLAYWRIGHT_SERVER_MODE=production npm run test:e2e` when verifying caching, image, or compiler behaviour. Local and pull-request runs use `next dev`; only Check and Deploy sets that variable, so `main` is the one pipeline that exercises the production build. The production mode never reuses an already-running server, so stop any local dev server first.
- MUST add a test file under `e2e/tests/routes/<route>/` when a change adds a new `page.tsx` under `app/(app)/`, and MUST NOT remove a `data-testid` an existing test references without updating that test.
- MUST update snapshots (`npm run test:e2e -- --update-snapshots`) only when the visual change is intentional, and state the reason the expected output changed. Snapshots are platform-specific — the path carries a `{/platform}` segment — so a local macOS update changes only the macOS snapshots, never the Linux ones CI compares against. CI re-runs with `--update-snapshots` and opens a pull request for any difference; that pull request is a prompt to review the visual change, not evidence it is acceptable.

## Scenario Coverage

This project measures e2e coverage as scenario coverage — which real user journeys the suite *asserts* — not application lines executed. The catalog is `e2e/scenarios.md`, one row per journey with a stable dotted id (`post.header`), a title, an area, and a `must` | `should` | `may` priority. Tests join to it through Playwright's `tag` option: a `@scenario:<id>` join tag plus matching `@area:` and `@priority:` facet tags, and an optional `@smoke` marker. The reporter at `e2e/reporters/scenario-coverage.ts` tallies coverage and writes `e2e/.scenario-coverage/summary.json`; `npm run coverage:scenarios` enforces the gate, and `SCENARIO_GATE` toggles enforce ↔ report-only.

**Guidelines:**

- MUST add a catalog row in `e2e/scenarios.md` when a change introduces a new user-facing journey, in the same change as the test that asserts it.
- MUST tag the test that asserts the journey's outcome, never one that merely passes through it — executed is not asserted.
- MUST NOT rename a scenario id without updating every tag referencing it in the same change; the id is the contract between catalog and tests.
- MUST keep `must`-priority scenarios at 100%: a `must` row with no passing asserting test blocks `npm run coverage:scenarios`.

## Manual Verification

Some surfaces have no automated proof, so they are checked by hand before a change is called done.

**Guidelines:**

- MUST load the affected route at `http://localhost:3000` via `npm run dev` when the change touches a `page.tsx`, `layout.tsx`, a route-local `_components/`, or `app/(app)/_/components/`.
- MUST verify both published and draft states when a route renders CMS-managed content. Draft state is reached by appending `?draft=true` while authenticated through the Payload admin at `/admin`.
- MUST render a blog post containing the affected construct end-to-end when the change touches the markdown pipeline.
- SHOULD re-check under `npm run build && npm run start` when the change touches caching, images, or compiler behavior — dev and production diverge on transforms, caching, and asset handling.

## Test Hooks (`data-testid`)

Values are intentionally short and **scope-relative**, not globally unique. The page-level component owns the top scope IDs and passes them down as props; each sub-component uses short relative IDs internally, and tests navigate by chaining `getByTestId()` on progressively narrower locators.

```text
page                  ← set on the top-level page element
  header              ← set on <BlogPostHeader> via prop
    title
    timestamp
    cover-image
    author
      avatar-image
      name
    tags
      tag             ← repeated for each list item
  content             ← set on the <main> wrapper
```

**Guidelines:**

- MUST add `data-testid` attributes, in kebab-case, to meaningful UI elements that tests need to identify.
- MUST keep values short and scope-relative, with the page-level component owning the top scope (`page`, `header`, `content`) and passing them as props.
- MUST spread `...props` onto the root element so a caller-supplied `data-testid` propagates, per the `ComponentProps<T>` pattern.
- MUST propagate `data-testid` to a loading fallback with a `-loading` suffix when a component uses the loading/loaded split.
- MAY add further `data-*` attributes alongside `data-testid` to expose entity identifiers or state — `<li data-testid="blog-post" data-slug={post.slug}>` — so a test can target one item without a globally unique ID.
