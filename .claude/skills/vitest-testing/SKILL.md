---
name: vitest-testing
description: A change touching Vitest — `vitest.config`, `defineConfig` from `vitest/config`, `vi.mock`, `vi.fn`, `vi.spyOn`, `vi.useFakeTimers`, `expect.poll`, `toMatchInlineSnapshot`, `test.extend`, `describe.concurrent`, `projects`, `pool`, `isolate`, `--coverage`, `browser.instances`, `toMatchScreenshot`, `*.test-d.ts`, `import.meta.vitest`, a `vitest run` invocation, or a config key Vitest 4 silently ignores. For what to assert and how a spec is shaped, use a unit-testing capability; for journeys and server lifecycle, an end-to-end one. The 4.x runner layer, lookup-first where the option surface moved from v3.
user-invocable: false
---

# Vitest Testing

This skill equips you to configure, run, debug, and review a Vitest suite: the runner's own surface — its config file, its `vi` API, its pools and reporters, its coverage providers, and its Browser Mode — plus the operational rules an agent needs to drive it without hanging a session or burning a context window.

It is the **runner-specific layer**. A tool-agnostic unit-testing capability owns what to assert, how to name a spec, what makes a fixture good, and whether a behavior deserves a unit test at all; those questions have the same answers whatever runner executes them. This skill owns the mechanism underneath: which option, which file, which `vi` call, which flag. Where a rule here touches judgment — which dependency is worth mocking, how much of a payload to pin, whether a snapshot earns its place — it points at the tool-agnostic owner rather than answering it.

Two neighbours are disclaimed explicitly. An end-to-end capability owns user journeys, the locator fallback hierarchy, server lifecycle, and scenario coverage **even when the runner underneath is Vitest**; this skill owns the runner configuration that suite runs on. A component-development capability owns test-hook conventions such as `data-testid` and `testID`; this skill owns the Browser Mode machinery that queries them. A project on a different runner should reach for that runner's own capability, not this one.

**Version posture is lookup-first.** Rules are verified against **Vitest 4.1.10** (Node >= 20, Vite >= 6) and name the release they were checked against. Vitest 4 moved or removed roughly two dozen configuration options and **silently ignores the old names rather than erroring**, so a v3-era answer copied off the open web fails invisibly — the suite runs, the option does nothing. Wherever a surface is known to have moved, consult the installed version's own documentation at <https://vitest.dev> rather than recalling an option name; each reference below names the upstream page it was verified against.

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119.html).

## Running Vitest as an Agent

See [running-as-an-agent.md](./references/running-as-an-agent.md) for:

- `vitest run` or `--no-watch` for every non-interactive run; bare `vitest` enters watch mode and never exits
- a project `test` script defined as `vitest` or `vitest --watch`, which hands that hang to anyone who runs it
- narrowing with a path, `-t`, `file.test.ts:42`, `--project`, `--changed`, or `--related`
- the `minimal` reporter's token cost argument, and the custom `reporters` array that disables its auto-selection
- reading the reported diff and stack frame instead of re-running the suite to see the failure again
- third-party Vitest MCP servers, and why adding one needs the human's approval

## Version Discipline

See [version-discipline.md](./references/version-discipline.md) for:

- Vitest 4 ignoring an unrecognized `test` key instead of erroring, so a v3-era option runs green and does nothing
- `workspace` → `projects`, `maxThreads`/`maxForks` → `maxWorkers`, `singleThread` → `maxWorkers: 1` + `isolate: false`
- `poolOptions.*` flattened to the top level, and `deps.external`/`inline` → `server.deps.*`
- `coverage.all`, `environmentMatchGlobs`, `poolMatchGlobs`, `minWorkers`, and the `basic` reporter, all removed
- `getMockName()` now returning `"vi.fn()"`, which rewrites every snapshot containing a mock
- which features need 4.1.0, 4.1.1, 4.1.3, or 4.1.4 — tags, the fixture builder, custom snapshot matchers, ARIA snapshots

## Configuration

See [configuration.md](./references/configuration.md) for:

- `defineConfig` imported from `vitest/config`, not from `vite`, which does not type the `test` block
- v4's default exclusions shrinking to `node_modules` and `.git`, so `dist` is now scanned unless excluded
- `globals: false` and explicit imports as the posture, and the `vitest/globals` types entry `globals: true` then needs
- `clearMocks`, `mockReset`, `restoreMocks`, `unstubEnvs`, `unstubGlobals` as config rather than a remembered hook
- `testTimeout` at 5,000 ms, and raising the narrowest scope — per-test or `hookTimeout` — instead of the suite
- `dangerouslyIgnoreUnhandledErrors` disabling a real check, and the `experimental` block as a separate risk class

## Test Projects

See [test-projects.md](./references/test-projects.md) for:

- `projects` as the one mechanism, replacing `workspace`, `poolMatchGlobs`, and `environmentMatchGlobs` together
- glob, config path, and inline entries, `!` negation, and the `packages/!(business)` bracket idiom
- the `vitest.config.*` / `vitest.<name>.config.*` naming rule a file must match to be picked up at all
- projects not inheriting the root config — `extends: true` or `mergeConfig`, or shared setup files are simply absent
- `coverage`, `reporters`, and `resolveSnapshotPath` being process-wide and therefore illegal in a project
- splitting a `node` project from a browser one, or unit from integration with different isolation

## Test Environment

See [environments.md](./references/environments.md) for:

- `node`, `jsdom`, `happy-dom`, `edge-runtime`, and DOM startup cost paid per file
- the `// @vitest-environment jsdom` docblock for a handful of files rather than the whole suite
- a dependency importing CSS or an asset failing under a DOM shim until the whole chain is in `server.deps.inline`
- `viteEnvironment` as v4's replacement for `transformMode` in a custom environment
- "passes under jsdom, breaks in the browser" as the signal to move to Browser Mode rather than stub further

## Run Lifecycle

See [run-lifecycle.md](./references/run-lifecycle.md) for:

- `globalSetup` running in the main process with a different global scope, so only `provide`/`inject` crosses it
- `setupFiles` running in the worker, which is why mock registration and `expect.extend` belong there
- setup files re-running under `isolate: false` while the modules they import stay cached
- `globalSetup` not re-running in watch mode, so a seeded database keeps the previous run's state
- `forceRerunTriggers` and `watchTriggerPatterns` for a non-imported file that should invalidate a run

## Test API

See [test-api.md](./references/test-api.md) for:

- test options in the **second** argument; the v3 third-argument form is removed and silently unread
- `skip`, `skipIf`, `runIf`, `only`, `todo`, `fails`, `concurrent`, and `sequential`'s deprecation
- `test.each` spreading an array case while `test.for` does not, and `for` supplying the test context
- `aroundEach`/`aroundAll` and the `runTest` call without which nothing inside runs
- `onTestFinished`/`onTestFailed` as the per-test cleanup that survives concurrency
- `retry`'s error predicate, for absorbing one failure mode rather than every error the test can raise

## Fixtures and Test Context

See [fixtures-and-context.md](./references/fixtures-and-context.md) for:

- `context.expect` being required for a snapshot inside a concurrent test
- the 4.1 `test.extend` builder inferring types, and `onCleanup` being callable only once per fixture
- test, file, and worker scope, and a fixture reaching only its own scope or a longer-lived one
- only destructured fixtures being initialized, so `{ database }` and `context.database` are not equivalent
- `test.override` for a suite's value, and `injected` fixtures fed from `config.provide` per project

## Assertions and Async Tests

See [assertions-and-async.md](./references/assertions-and-async.md) for:

- `toEqual` and `toStrictEqual` disagreeing exactly on a present-`undefined` key and a sparse array
- `expect.objectContaining`, `expect.stringMatching`, `expect.closeTo`, and `expect.schemaMatching` for Standard Schema
- `.resolves`/`.rejects` failing the test in v4 when unawaited, where v3 passed silently
- `vi.waitFor` vs `vi.waitUntil` vs `expect.poll`, and `expect.poll` rejecting snapshots, `.rejects`, and `toThrow`
- `expect.hasAssertions()` for a test whose assertions sit inside a callback
- `expect.extend`'s `MatcherResult`, and why branching `pass` on `isNot` cancels out

## Function Mocks and Spies

See [function-mocks.md](./references/function-mocks.md) for:

- a spy seeing only calls made after it is installed, so import-time work is invisible to it
- `mockClear` keeping the implementation, `mockReset` restoring the original, `mockRestore` restoring the descriptor
- `clearAllMocks`/`resetAllMocks`/`restoreAllMocks` not reaching automocked modules at all
- `mockThrow`/`mockThrowOnce`, `withImplementation`, and the `Once` variants for a call sequence
- `invocationCallOrder` starting at 1 in v4, and preferring the mock matchers over reading `mock.calls`
- `vi.defineHelper` so a shared assertion helper reports the caller's line

## Module Mocking

See [module-mocking.md](./references/module-mocking.md) for:

- `vi.mock` hoisting above imports, leaving a module-level `const` undefined when the factory runs
- `vi.hoisted` for a value the factory closes over, and `importOriginal` needing an `await`
- automocking emptying arrays and returning `undefined` from methods, versus `{ spy: true }` keeping real behavior
- `__mocks__` staying inert until a `vi.mock` call names the module
- a call between two functions in the same file being unmockable, and the extract-or-inject refactor that fixes it
- `server.deps.inline` when `vi.mock` against an externalized dependency has no effect

## Timers and Ambient State

See [timers-and-ambient-state.md](./references/timers-and-ambient-state.md) for:

- a fake clock left installed leaking into later files in the same worker
- the `*Async` advance variants being required whenever a scheduled callback awaits
- `runAllTimers` throwing at `loopLimit` on code that reschedules itself
- `vi.setSystemTime` freezing a drifting snapshot, and `TZ` still governing formatted output
- `vi.stubGlobal`/`vi.stubEnv` persisting across tests unless `unstubGlobals`/`unstubEnvs` are set
- `memfs` through `__mocks__/fs.cjs` and `__mocks__/fs/promises.cjs`, mocking both specifiers

## Network Mocking

See [network-mocking.md](./references/network-mocking.md) for:

- intercepting with MSW rather than replacing `fetch`, so the request path under test stays real
- `server.listen()` / `resetHandlers()` / `close()` across `beforeAll`, `afterEach`, and `afterAll`
- `onUnhandledRequest: "error"` as what stops an unmatched request reaching the real network
- why an end-to-end test deliberately wants the real dependency instead

## Snapshots

See [snapshots.md](./references/snapshots.md) for:

- inline for a diff-reviewable value, `.snap` for larger output, file snapshots for markup, ARIA for structure
- errors rendering as `[Error: message]` rather than the bare message
- `-u` accepting `new`, `all`, and `none`, and `--update=new` leaving existing snapshots alone
- CI refusing to **write** a snapshot, so a missing one fails rather than being created
- an **obsolete** snapshot failing CI, which catches a deleted test whose stored output stayed

## Coverage

See [coverage.md](./references/coverage.md) for:

- `@vitest/coverage-v8` and `@vitest/coverage-istanbul` needing explicit installation in v4
- only imported files being reported unless `coverage.include` names the source globs
- `autoUpdate` rewriting a threshold after a run, so a drop is recorded rather than rejected
- ignore hints needing `-- @preserve` or esbuild strips them before the provider sees them
- `DEBUG=vitest:coverage` when collection itself is what is slow

## Performance and Parallelism

See [performance-and-parallelism.md](./references/performance-and-parallelism.md) for:

- files across workers versus tests within a file, and which axis a given slowdown sits on
- `forks` as the compatible default, and `threads` producing worker-termination and segfault failures
- `isolate: false` as the biggest win, what module-level state survives it, and `vmThreads` forbidding it
- concurrency only helping tests that wait, since synchronous tests still share one thread
- reading the transform, collect, setup, and environment timings before changing any setting
- sharding splitting files rather than cases, so one slow file cannot be sharded

## Filtering and Tags

See [filtering-and-tags.md](./references/filtering-and-tags.md) for:

- a positional path filter, `-t`, and `file.test.ts:10` needing the full filename
- `allowOnly` at its default failing a CI run that contains `.only`
- declaring tags in config before use, with `timeout`, `retry`, and `priority` per tag
- `--tags-filter` expressions with `and`/`or`/`not`, wildcards, and `not` > `and` > `or` precedence
- `@module-tag` applying to a whole file rather than one test
- filters applying per file, so Vitest still loads every file to find matches

## Reporters and CI Output

See [reporters-and-ci.md](./references/reporters-and-ci.md) for:

- `minimal`, aliased `agent`, printing only failures and their errors
- its auto-selection on `std-env` AI-agent detection or an `AI_AGENT` variable
- any custom `reporters` array skipping that detection, and `github-actions` needing listing for the same reason
- `blob` with `--shard`, merged by `--merge-reports`, as the only correct way to report a sharded run
- `outputFile` as a path or a per-reporter map
- `context.annotate` severities, and the default reporter printing them only for failed tests

## Browser Mode

See [browser-mode.md](./references/browser-mode.md) for:

- CSS layout, computed style, and real event dispatch as the bug class a DOM shim cannot produce
- v4 providers being objects from `@vitest/browser-playwright`, `-webdriverio`, or `-preview`, not strings
- imports moving to `vitest/browser` from the removed `@vitest/browser/context`
- `await expect.element(...)` as the retrying assertion, where the synchronous `expect` does not
- `userEvent` from `vitest/browser` driving real input, distinct from Testing Library's synthetic events
- `alert`/`confirm` blocking the thread, and sealed ESM namespaces needing `{ spy: true }` to observe an export

## Visual Regression

See [visual-regression.md](./references/visual-regression.md) for:

- `toMatchScreenshot` writing a reference on first run and **failing**, into a committed `__screenshots__/`
- `allowedMismatchedPixelRatio` versus `allowedMismatchedPixels`, where the stricter limit wins
- stable-screenshot detection reshooting until two frames agree
- fonts, GPU, and headless mode making a local screenshot differ from CI's on an unchanged page
- `toMatchAriaSnapshot` asserting the accessibility tree instead, and surviving a font bump

## Type and In-Source Tests

See [types-and-in-source.md](./references/types-and-in-source.md) for:

- `*.test-d.ts` with `expectTypeOf`/`assertType`, run only under `--typecheck`
- type tests being analyzed rather than executed, so a `test.each` name is never evaluated
- `import.meta.vitest` with `includeSource`, and `"vitest/importMeta"` in the tsconfig types
- the production-build `define: { "import.meta.vitest": "undefined" }` without which those tests ship to users
- the documentation scoping in-source tests to small utilities, not components or e2e

## Debugging and Failure Modes

See [debugging-and-failure-modes.md](./references/debugging-and-failure-modes.md) for:

- `--inspect-brk --no-file-parallelism --test-timeout=0` together, and what each flag removes
- `--isolate false` keeping a debugger attached across watch reruns
- the `hanging-process` reporter and `--detect-async-leaks` for a run that will not exit
- `Failed to Terminate Worker` from Node's `fetch` under `threads`, fixed by `forks`
- segfaults from native modules under `threads`, fixed the same way
- `Cannot find module` from an unresolved path alias, and `ssr.resolve.conditions` for ignored export conditions

## Suite Hygiene

See [suite-hygiene.md](./references/suite-hygiene.md) for:

- `expect-expect`, `no-focused-tests`, and `valid-expect` from `@vitest/eslint-plugin`
- `allowOnly` and obsolete-snapshot failures as the two guards against an abandoned edit
- `restoreMocks`/`unstubEnvs`/`unstubGlobals` moving hygiene out of every author's memory
- `--detect-async-leaks` for a handle that outlives the test that opened it
- whether CI invokes `vitest run` rather than a form that can enter watch mode, and whether a changed config key still exists in the installed version

## Extending Vitest

See [extending-vitest.md](./references/extending-vitest.md) for:

- the removed v3 reporter hooks (`onCollected`, `onTaskUpdate`, `onFinished`) producing silence, not an error
- `viteEnvironment` in a custom environment, and the rewritten v4 pool interface
- `startVitest`, `createVitest`, and `vitest.state.getTestModules()` from `vitest/node`
- `experimental.openTelemetry` needing an `sdkPath` whose module default-exports an unstarted SDK
- the per-worker startup cost tracing adds unless the run is not isolated
