---
name: e2e-testing-guidelines
description: Use this skill whenever writing, reviewing, refactoring, or running Playwright end-to-end tests in this project, or whenever a change requires verification via the e2e suite. Covers the `e2e/` directory layout, `.test.ts` naming, `test()` / `test.step()` structure, mandatory `getByTestId()` chained locators (never `getByText()`), locator-native assertions (`toBeFocused`, `toBeVisible`, `toHaveAttribute`) over `evaluate()`, `expect.poll` / `waitForFunction` (never `waitForTimeout`) for scroll-driven / CSS-animation settling, pseudo-element state via `getComputedStyle(el, "::before")`, authenticated `storageState` for API helpers, API-helper conventions in `e2e/helpers/api/`, snapshot update flow, and commands for running tests against dev, local production, and the deployed Vercel URL. Use even when the user only mentions "Playwright", "tests", snapshots, `data-testid`, `expect.poll`, `toBeFocused`, pseudo-elements, or a failing test run.
---

# E2E Testing Guidelines

Apply these rules when running, writing or reviewing end-to-end tests in this project.

## End-to-End Test Commands

See [E2E Test Commands](./commands.md) for:

- Running end-to-end tests

## End-to-End Test Structure

See [E2E Test Structure](./structure.md) for:

- Understanding the end-to-end test structure
- Writing end-to-end tests
- Reviewing end-to-end tests
- Refactoring end-to-end tests

## End-to-End Test Conventions

See [E2E Test Conventions](./conventions.md) for:

- Writing end-to-end tests
- Reviewing end-to-end tests
- Refactoring end-to-end tests
