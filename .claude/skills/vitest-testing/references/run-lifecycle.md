# Run Lifecycle

Apply this reference when deciding where setup belongs, when state leaks between files, or when a value needs to reach tests from outside the worker.

Verified against Vitest 4.1.10 — <https://vitest.dev/guide/lifecycle>

## Phase Order

A run proceeds through: config resolution, global setup, worker creation, per-file setup files, test collection, test execution, reporting, and global teardown.

What runs when:

| Frequency          | What                                                     |
| ------------------ | -------------------------------------------------------- |
| Once per run       | Config resolution, `globalSetup` and its teardown        |
| Once per worker    | Worker startup, worker-scoped fixtures                   |
| Once per test file | `setupFiles`, top-level file code, collection            |
| Once per suite     | `beforeAll` / `afterAll` / `aroundAll`                   |
| Once per test      | `beforeEach` / `afterEach` / `aroundEach`, the test body |

## The Global Setup Scope Boundary

`globalSetup` runs in the **main process, in a different global scope from the tests**. A value assigned to a global there is not visible in any test — the most common misuse of the hook.

The supported channel is `provide` / `inject`: global setup provides a value, and a test or fixture injects it. Anything else crosses a process boundary that does not exist for ordinary variables.

**Guidelines:**

- MUST pass values from `globalSetup` to tests through `provide` / `inject`; never through a global assignment or a module-level variable.
- MUST use `globalSetup` for genuinely once-per-run work — starting a container, seeding a database, building a fixture artifact — and nothing else.
- MUST return or register teardown from `globalSetup` so the resource it started is released.

## Setup Files Run in the Worker

`setupFiles` execute inside the worker alongside the tests, sharing their module registry and their globals. That is why mock registration, custom matcher extension, and DOM polyfills belong there and not in global setup.

**Guidelines:**

- MUST register `expect.extend` matchers and project-wide `vi.mock` calls in `setupFiles`, where they reach the tests.
- SHOULD keep setup files cheap; they run once per test file, so their cost multiplies across the suite.

## What Isolation Changes

With `isolate: false`, workers are reused across files. Setup files **still re-run** before each file so their side effects apply — but the modules they import stay cached, so module-level state established on the first file persists into the next.

That distinction is the whole risk of disabling isolation: a setup file that calls a function re-runs, while a module that initializes a singleton at import time does not.

Workers are also retained under the `vmThreads` and `vmForks` pools, where the VM provides isolation instead.

**Guidelines:**

- MUST audit module-level state — singletons, caches, registries, module-scoped counters — before disabling isolation; that state is what survives.
- MUST NOT assume a re-running setup file resets a module it merely imports.

## Watch Mode

`globalSetup` does **not** re-run between file changes in watch mode; only affected test files and their setup files re-execute. A suite whose global setup seeds a database is therefore running against whatever state the previous run left.

**Guidelines:**

- MUST make per-test data setup independent of `globalSetup` when tests mutate shared external state, so a watch rerun starts clean.
- SHOULD configure `forceRerunTriggers` and `watchTriggerPatterns` when a non-imported file — a fixture, a schema, a snapshot input — should invalidate a run.
