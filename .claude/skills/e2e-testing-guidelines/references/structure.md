# E2E Test Structure

## Project Structure

Tests are easiest to find when their location mirrors the surface they cover. The default layout groups suites by route, so a route change points directly at the tests that guard it, while helpers and setup files stay in shared locations every suite can reach. Playwright writes run artifacts to `.playwright-results/` and keeps visual snapshots in a `__snapshots__/` directory next to the test files that own them.

```
<root>
├── .playwright-results/               # test run output (traces, videos)
├── e2e/
│   ├── .data/                         # local temporary data
│   ├── helpers/                       # test helpers (API call functions in api/)
│   └── tests/
│       ├── setup.test.ts              # setup test (Playwright `setup` project)
│       ├── teardown.test.ts           # cleanup test (Playwright `cleanup` project)
│       ├── metadata.test.ts           # website-global metadata test
│       ├── routes                     # route-specific tests
│       │   ├── index/
│       │   │   ├── __snapshots__/     # visual snapshots for this route's tests
│       │   │   ├── page.test.ts       # visual/functional tests for the route
│       │   │   └── thumbnail.test.ts  # thumbnail image endpoint tests
│       │   └── posts/
│       │       ├── ...
│       │       └── slug/
│       │           └── ...
│       └── ...
└── ...
```

**Guidelines:**

- MUST place route-specific e2e tests under `e2e/tests/routes/`.
- MUST keep reusable e2e helpers under `e2e/helpers/`.
- SHOULD keep setup and global metadata tests directly under `e2e/tests/` when they are not route-specific; `setup.test.ts` and `teardown.test.ts` belong to the dedicated `setup`/`cleanup` Playwright projects that the device projects (such as `pixel`) depend on.

### Purpose-Based Layout

A route tree adds empty hierarchy when the app has one route or its value lives in cross-route journeys. Purpose-named suites keep the cheapest signal first: smoke proves the app boots and the core loop works, happy-path walks the main journeys end to end, regressions hold named guards for previously shipped bugs, and feature-area suites cover one surface in depth.

```
e2e/
└── tests/
    ├── smoke.test.ts          # boots + core loop, the first gate
    ├── happy-path.test.ts     # main journeys end to end
    ├── regressions.test.ts    # named guards for shipped bugs
    └── <feature>.test.ts      # feature-specific suite
```

**Guidelines:**

- SHOULD organize suites by purpose (`smoke`, `happy-path`, `regressions`, `<feature-area>`) instead of by route in single-route or journey-centric apps.
- MUST treat the smoke suite as the first gate: if it fails, deeper suites are not worth running.
- SHOULD guard each previously shipped bug with a named regression test instead of folding the check into an unrelated case.

## Test File Structure

File names are kebab-case with the `.test.ts` extension so Playwright's test-file matcher picks them up without extra configuration.

**Guidelines:**

- MUST use kebab-case for file names.
- MUST use the `.test.ts` extension for test files.

## Test Case Structure

One behavior per test keeps failures diagnosable, and named steps turn a multi-phase journey's report into a readable narrative. Steps earn their keep only when a test has phases to narrate — wrapping a single arrange → act → assert in one step adds noise, not structure.

**Guidelines:**

- MUST define one `test()` case per behavior.
- MUST name test cases concisely.
- MUST wrap each meaningful action/assertion group of a multi-phase scenario (two or more distinct arrange/act/assert phases) in `test.step()` at human-understandable granularity; steps can nest.
- MAY omit steps in a short atomic test (a single arrange → act → assert).
- MUST NOT pad an atomic test with a one-step wrapper just to satisfy step structure.
- MUST name test steps concisely.
