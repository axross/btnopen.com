---
name: e2e-testing-guidelines
description: Use this skill whenever writing, reviewing, refactoring, or running Playwright end-to-end tests in this project, or whenever a change requires verification via the e2e suite. Covers the `e2e/` test directory layout, `.test.ts` test-file naming, structured `test()` / `test.step()` naming, stable `getByTestId()` chained/scoped locators with a role-then-copy fallback hierarchy (text matching only when asserting the copy itself), locator-native auto-waiting assertions (`toBeFocused`, `toBeVisible`, `toHaveAttribute`) over manual DOM reads via `evaluate()`, `expect.poll` / `waitForFunction` (never fixed sleeps) for async settling such as scroll-driven or CSS-animation transitions, pseudo-element state via `getComputedStyle(el, "::before")`, authenticated `storageState` reuse for API helpers, reusable API/setup helper conventions in `e2e/helpers/api/`, the snapshot update flow, and commands for running tests against dev, local production, and the deployed Vercel environment. Use even when the user only mentions "Playwright", e2e tests, snapshots, `data-testid`, `expect.poll`, `toBeFocused`, pseudo-elements, polling/waiting, focus assertions, or a failing test run.
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
