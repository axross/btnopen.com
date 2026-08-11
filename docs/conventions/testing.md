# Testing

The runners this project uses, where each kind of test lives, how scenario
coverage is measured, what gets checked by hand, and how a test hook is named.

How to design a unit test, how to locate and wait in an end-to-end test, and how
a scenario-coverage catalog works belong to the installed unit-testing and
end-to-end-testing capabilities, both of which are runner-agnostic; the runner
layer beneath them — the config file, the `vi` API, pools, reporters, and
coverage providers — belongs to the installed vitest-testing capability. This
document records the runners, paths, and naming this repository uses.

| Surface | This project |
| --- | --- |
| Unit tests | Vitest, colocated `*.spec.ts`, run with `npm run test:unit` |
| End-to-end tests | Playwright under `e2e/`, run with `npm run test:e2e` |
| Scenario-coverage gate | `npm run coverage:scenarios` |
| Type check | `tsc --noEmit`, run with `npm run typecheck` |

`npm run lint`, `npm run typecheck`, `npm run test:unit`, and the Payload
Artifacts drift check gate a merge. The e2e suite and the scenario-coverage gate
run after merge, in the Check and Deploy workflow, so a `must`-priority coverage
regression fails on `main` rather than on the pull request that introduced it.

## Unit Tests

Unit tests MUST be colocated as `*.spec.ts` beside their subject unless an
existing local pattern requires otherwise. The test API MUST be imported from
`vitest` — `describe`, `it`, `expect`, `vi`, `beforeEach`, `afterEach`, and any
other API used in the file — rather than relied on as global-scope symbols.
`vitest.config.ts` leaves `globals` at its default `false`, so an unimported
symbol is a reference error rather than a silent ambient lookup.

Vitest output reads like a behaviour report, so the full name — `describe(...)`
concatenated with `it(...)` — carries the subject, the condition, and the
expected outcome. The suffix conventions below are what make the subject's kind
legible at a glance. `it(...)` MUST be used for scenarios, and `test(...)` MUST
NOT be used. Callable subjects in `describe(...)` / `it(...)` titles MUST be
suffixed with `()` — `describe("formatLocation()")`,
`describe("deleteNodeInBlogPostBodyTool()")` — and non-callable subjects left
bare: schemas, codecs, and type contracts as `describe("McpBlogPostResponse")`,
UI components in angle brackets as `describe("<BlogPostHeader>")`.

Anything a `vi.mock` factory assigns to MUST be held in `vi.hoisted()` rather
than in an ordinary module-level binding. The factory runs while the subject is
being imported, which is before the spec module's own body, so a plain `let` is
still in its temporal dead zone when the factory writes to it and the spec fails
on a reference error rather than on its subject.

`expect(...)` MUST be left in an `it(...)` body rather than in a helper the
scenarios call, and such a helper MUST throw on a broken precondition instead.
Biome's `noMisplacedAssertion` recognizes a `vitest` import where it did not
recognize `@jest/globals`, so an asserting helper that passed lint under Jest now
fails `npm run lint`.

Integration or e2e coverage SHOULD be preferred when confidence depends on
Next.js or Payload runtime wiring, browser behaviour, rendering, providers,
routing, or user-facing UI.

## End-to-End Tests

Playwright writes run artifacts to `.playwright-results/` and keeps visual
snapshots in a `__snapshots__/` directory beside the test files that own them.

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

Route-specific e2e tests MUST be placed under `e2e/tests/routes/`, mirroring the
route tree, and reusable helpers MUST be kept under `e2e/helpers/` with API call
functions in `e2e/helpers/api/`. `setup.test.ts` and `teardown.test.ts` MUST stay
directly under `e2e/tests/`; they belong to the dedicated `setup` / `cleanup`
Playwright projects that the device projects (such as `pixel`) depend on. Test
files MUST be named in kebab-case with the `.test.ts` extension. API call
functions MUST be defined in `e2e/helpers/api/`, named-exported, taking `page`
and `testInfo`, and using `page.request` so calls share the test's authenticated
state.

The saved authenticated state SHOULD be reused with
`test.use({ storageState: authenticatedStorageState })` rather than logging in
per test. The `setup` project authenticates with `PAYLOAD_TEST_USER_EMAIL` /
`PAYLOAD_TEST_USER_PASSWORD` and saves state under `e2e/.data/`. A deployed
environment SHOULD be targeted only by setting `PLAYWRIGHT_BASE_URL`
deliberately, such as `PLAYWRIGHT_BASE_URL=https://btnopen.com npm run test:e2e`.

The suite's device projects MUST stay limited to the two responsive tiers that
carry a structural transformation — `pixel` (412px, mobile) and `tablet` (712px,
tablet), both on Chromium. The five mobile→tablet structural transformations in
[../specs/reader-surfaces.md](../specs/reader-surfaces.md) all fire across that
pair. The desktop tier is deliberately uncovered: it adjusts density rather than
structure, and `workers: 1` means every added project serializes another full
pass. Adding one is a cost decision for @axross, not a default. CI MUST be left
to generate a new device project's Linux snapshot baselines: Check and Deploy
runs `--update-snapshots` and opens a snapshot pull request, and the matching
darwin baselines come from a maintainer running
`npm run test:e2e -- --update-snapshots` on macOS. A baseline captured in a cloud
session does not match the GitHub runner's rendering.

`PLAYWRIGHT_SERVER_MODE=production npm run test:e2e` SHOULD be run when verifying
caching, image, or compiler behaviour. Local and pull-request runs use
`next dev`; only Check and Deploy sets that variable, so `main` is the one
pipeline that exercises the production build. The production mode never reuses
an already-running server, so stop any local dev server first.

A test file MUST be added under `e2e/tests/routes/<route>/` when a change adds a
new `page.tsx` under `app/(app)/`, and a `data-testid` an existing test
references MUST NOT be removed without updating that test.

Snapshots MUST be updated (`npm run test:e2e -- --update-snapshots`) only when
the visual change is intentional, and the reason the expected output changed
MUST be stated. Snapshots are platform-specific — the path carries a
`{/platform}` segment — so a local macOS update changes only the macOS snapshots,
never the Linux ones CI compares against. CI re-runs with `--update-snapshots`
and opens a pull request for any difference; that pull request is a prompt to
review the visual change, not evidence it is acceptable.

## Scenario Coverage

This project measures e2e coverage as scenario coverage — which real user
journeys the suite *asserts* — not application lines executed. The catalog is
`e2e/scenarios.md`, one row per journey with a stable dotted id (`post.header`),
a title, an area, and a `must` | `should` | `may` priority. Tests join to it
through Playwright's `tag` option: a `@scenario:<id>` join tag plus matching
`@area:` and `@priority:` facet tags, and an optional `@smoke` marker. The
reporter at `e2e/reporters/scenario-coverage.ts` tallies coverage and writes
`e2e/.scenario-coverage/summary.json`; `npm run coverage:scenarios` enforces the
gate, and `SCENARIO_GATE` toggles enforce ↔ report-only.

A catalog row MUST be added in `e2e/scenarios.md` when a change introduces a new
user-facing journey, in the same change as the test that asserts it. The tag MUST
go on the test that asserts the journey's outcome, never on one that merely
passes through it — executed is not asserted. A scenario id MUST NOT be renamed
without updating every tag referencing it in the same change; the id is the
contract between catalog and tests. `must`-priority scenarios MUST stay at 100%:
a `must` row with no passing asserting test blocks `npm run coverage:scenarios`.

## Manual Verification

Some surfaces have no automated proof, so they are checked by hand before a
change is called done. The affected route MUST be loaded at
`http://localhost:3000` via `npm run dev` when the change touches a `page.tsx`,
`layout.tsx`, a route-local `_components/`, or `app/(app)/_/components/`. Both
published and draft states MUST be verified when a route renders CMS-managed
content; draft state is reached by appending `?draft=true` while authenticated
through the Payload admin at `/admin`. A blog post containing the affected
construct MUST be rendered end-to-end when the change touches the markdown
pipeline.

The change SHOULD be re-checked under `npm run build && npm run start` when it
touches caching, images, or compiler behaviour — dev and production diverge on
transforms, caching, and asset handling.

## Test Hooks (`data-testid`)

Values MUST stay short and **scope-relative**, not globally unique: the
page-level component owns the top scope IDs and passes them down as props, each
sub-component uses short relative IDs internally, and tests navigate by chaining
`getByTestId()` on progressively narrower locators.

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

`data-testid` attributes MUST be added, in kebab-case, to meaningful UI elements
that tests need to identify, with the page-level component owning the top scope
(`page`, `header`, `content`) and passing them as props. A component MUST spread
`...props` onto its root element so a caller-supplied `data-testid` propagates,
per the `ComponentProps<T>` pattern in
[react-components.md](./react-components.md). A `data-testid` MUST be propagated
to a loading fallback with a `-loading` suffix when a component uses the
loading/loaded split.

Further `data-*` attributes MAY be added alongside `data-testid` to expose entity
identifiers or state — `<li data-testid="blog-post" data-slug={post.slug}>` — so
a test can target one item without a globally unique ID.
