---
name: e2e-testing-guidelines
description: The Playwright end-to-end testing conventions for this project. Covers the `e2e/` test directory layout, `.test.ts` test-file naming, structured `test()` / `test.step()` naming, stable `getByTestId()` chained/scoped locators with a role-then-copy fallback hierarchy, locator-native auto-waiting assertions (`toBeFocused`, `toBeVisible`, `toHaveAttribute`) over manual DOM reads via `evaluate()`, `expect.poll` / `waitForFunction` (never fixed sleeps) for async settling, pseudo-element state via `getComputedStyle`, authenticated `storageState` reuse, reusable API/setup helpers in `e2e/helpers/api/`, the snapshot update flow, the scenario-coverage journey catalog (`e2e/scenarios.md`) with its `@scenario`/`@area`/`@priority`/`@smoke` tags, and commands for running against dev, local production, and the deployed Vercel environment.
when_to_use: Use whenever writing, reviewing, refactoring, or running Playwright e2e tests, or when a change needs verification via the e2e suite — even when the user only mentions "Playwright", e2e tests, snapshots, `data-testid`, `expect.poll`, `toBeFocused`, pseudo-elements, polling/waiting, focus assertions, or a failing test run. Not for whether verification evidence is adequate (the quality-assurance guidelines) or Jest unit tests (the unit test guidelines).
user-invocable: false
---

# E2E Testing Guidelines

Apply these rules when running, writing or reviewing Playwright end-to-end tests in this project.

## End-to-End Test Commands

See [commands.md](./references/commands.md) for:

- Running end-to-end tests

## End-to-End Test Structure

See [structure.md](./references/structure.md) for:

- The route-tree directory layout (default) and the purpose-based layout for single-route or journey-centric apps (smoke / happy-path / regressions / feature-area)
- Test-file naming
- Test-case naming and step granularity (multi-phase scenarios use steps; short atomic tests omit them)

## End-to-End Test Conventions

See [conventions.md](./references/conventions.md) for:

- The locator fallback hierarchy (test IDs first, roles for accessible controls, text only for copy assertions)
- Playwright's locator-native auto-waiting assertions and polling/wait-for-condition helpers
- Setup/cleanup hooks
- API-call and authenticated-state helper conventions

## E2E Scenario Coverage

See [scenario-coverage.md](./references/scenario-coverage.md) for:

- The scenario-coverage metric (user journeys asserted, **not** e2e line coverage) and why line coverage was rejected
- The human-authored journey catalog (`e2e/scenarios.md`) and the `@scenario` join tag plus `@area`/`@priority`/`@smoke` facet tags
- The phased gate (`must`-priority journeys at 100% first via `npm run coverage:scenarios`), the reporter (`e2e/reporters/scenario-coverage.ts`), and the gate script (`e2e/check-scenario-coverage.mjs`)
