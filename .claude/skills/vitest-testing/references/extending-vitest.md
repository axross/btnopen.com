# Extending Vitest

Apply this reference when a built-in reporter, environment, or pool does not cover a need, or when driving the runner from a script.

Verified against Vitest 4.1.10 — <https://vitest.dev/guide/advanced/>

## Reporters

A custom reporter implements the v4 interface. The v3 hooks — `onCollected`, `onSpecsCollected`, `onPathsCollected`, `onTaskUpdate`, and `onFinished` — were **removed**, so a reporter written against them produces no output rather than an error.

**Guidelines:**

- MUST port a v3 reporter to the current interface rather than assuming it still runs; the removed hooks are simply never called.
- SHOULD compose the built-in reporters through the `reporters` array before writing one, since most needs are output routing rather than new formatting.

## Environments and Pools

A custom environment is a `vitest-environment-<name>` package or a module path, exporting `name`, `viteEnvironment` (`"ssr"`, `"client"`, or a custom Vite environment), a `setup()` returning teardown, and optionally `setupVM()`.

The pool interface was rewritten in v4 and a v3 pool does not port mechanically. Almost nothing needs a custom pool: the four built-ins plus `isolate` and `maxWorkers` cover the realistic space, and a custom pool takes on responsibility for worker lifecycle and cleanup.

**Guidelines:**

- MUST set `viteEnvironment` rather than the removed `transformMode` in a v4 environment.
- SHOULD exhaust `environmentOptions` and the built-in pools before writing either; both are load-bearing infrastructure once adopted.

## Driving the Runner from a Script

`vitest/node` exports `startVitest`, `createVitest`, `resolveConfig`, and `parseCLI`. Results come off the instance — `vitest.state.getTestModules()` returns `TestModule` objects carrying outcomes.

This is for tooling around the runner: a custom orchestrator, a build-tool integration, a bespoke report. Ordinary CI is better served by the CLI plus a reporter.

**Guidelines:**

- MUST prefer the CLI with a machine-readable reporter over the Node API for CI; the API is for building tools, not for running a suite.
- MUST close the instance the API creates; it holds a Vite server open.

## Tracing a Run

`experimental.openTelemetry` instruments the process and each worker, given `enabled: true` and an `sdkPath` whose module default-exports an SDK — Vitest does not call `start()` for you. `browserSdkPath` supplies a browser-side SDK, and trace context propagates between Node and the browser.

Spans appear as `vitest.worker.start` containing `vitest.runtime.traces`, with custom spans nesting under `vitest.test.runner.test.callback`.

It is experimental, and it **adds startup cost to every worker** unless the run is not isolated.

**Guidelines:**

- MUST treat the OpenTelemetry integration as experimental — record why it is enabled, and re-check it on each upgrade.
- SHOULD enable it for a specific investigation rather than leaving it on, given the per-worker startup cost.
- SHOULD re-check on each Vitest upgrade whether a built-in now covers what an extension point here was adopted for; every one of them is an interface Vitest has already rewritten once at a major.
