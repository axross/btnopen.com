# Version Discipline

Apply this reference before writing or reviewing any Vitest configuration, and whenever an option appears to have no effect.

Verified against Vitest 4.1.10, which requires Node >= 20 and Vite >= 6. Vitest 4.1 consumes the project's installed Vite rather than bundling its own, and supports Vite 8 — <https://vitest.dev/guide/migration>

## Renamed Options Fail Silently

This is the gotcha that governs everything else. Vitest 4 removed or renamed roughly two dozen configuration options, and an unrecognized key in the `test` block is **ignored rather than rejected**. The suite runs, the reporter is green, and the option does nothing.

The practical consequence is that a v3-era answer — from an older project, a blog post, or recall — produces a config that looks correct and is inert. `poolOptions.threads.singleThread: true` in a v4 config does not make anything single-threaded; it is a key nobody reads.

**Guidelines:**

- MUST check any config carrying the names below against the installed version before trusting that it does what it says.
- MUST NOT assume an option works because the suite passes; a silently ignored option changes nothing and breaks nothing.
- SHOULD verify a behavioral option by observing the behavior — worker count, isolation, coverage output — rather than by reading the config.

## What Moved

| v3                                                 | v4                                    |
| -------------------------------------------------- | ------------------------------------- |
| `workspace` (option or `vitest.workspace.ts`)      | `projects`                            |
| `maxThreads`, `maxForks`                           | `maxWorkers`                          |
| `singleThread`, `singleFork`                       | `maxWorkers: 1` plus `isolate: false` |
| `poolOptions.<pool>.*`                             | the same options at the top level     |
| `poolOptions.vmThreads.memoryLimit`                | `vmMemoryLimit`                       |
| `deps.external`, `deps.inline`, `deps.fallbackCJS` | `server.deps.*`                       |
| `deps.optimizer.web`                               | `deps.optimizer.client`               |
| `browser.testerScripts`                            | `browser.testerHtmlPath`              |
| `VITEST_MAX_THREADS`, `VITEST_MAX_FORKS`           | `VITEST_MAX_WORKERS`                  |
| `VITE_NODE_DEPS_MODULE_DIRECTORIES`                | `VITEST_MODULE_DIRECTORIES`           |

## What Was Removed

`poolMatchGlobs` and `environmentMatchGlobs` (use `projects`), `minWorkers`, `threads.useAtomics`, `coverage.all`, `coverage.extensions`, `coverage.ignoreEmptyLines`, `coverage.experimentalAstAwareRemapping` (now the default behavior), the `basic` reporter, the reporter hooks `onCollected` / `onSpecsCollected` / `onPathsCollected` / `onTaskUpdate` / `onFinished`, and test options passed as a **third** argument to `test` and `describe`.

**Guidelines:**

- MUST pass test options as the second argument; the third-argument form is gone, and a third argument is not read.
- MUST replace `poolMatchGlobs` and `environmentMatchGlobs` with projects rather than searching for a like-for-like option; none exists.
- MUST install a coverage provider package explicitly, since v4 no longer bundles one.

## Runtime Behavior That Changed

These pass type-check and change results:

- `vi.fn().getMockName()` returns `"vi.fn()"` where v3 returned `"spy"`. Every snapshot containing a mock is rewritten by the upgrade — a large, meaningless-looking diff that is nonetheless correct.
- `mock.invocationCallOrder` starts at `1` rather than `0`.
- `vi.restoreAllMocks()` restores only manually created spies, leaving automocked modules alone.
- Automocked getters return `undefined` instead of calling the original.
- The `verbose` reporter prints a flat list; `tree` produces v3's nested shape.
- Custom elements print shadow-root contents in snapshots unless `printShadowRoot: false` is set.
- An unawaited `.resolves` / `.rejects` assertion **fails** the test rather than passing silently.

**Guidelines:**

- MUST review a mass snapshot rewrite after a v4 upgrade for the mock-name change specifically, rather than accepting or rejecting it wholesale.
- MUST NOT treat a newly failing unawaited promise assertion as a v4 regression; it was a false pass before.

## Feature Gates

Features added within the 4.x line, each unavailable below its release: test tags, the `test.extend` builder form, `test.override`, `aroundEach` / `aroundAll`, `vi.defineHelper`, `mockThrow` / `mockThrowOnce`, `--detect-async-leaks`, and the `minimal` / `agent` reporter (**4.1.0**); `TestRunner.matchesTags()` (**4.1.1**); custom snapshot matchers (**4.1.3**); ARIA snapshots and custom snapshot domains (**4.1.4**).

**Guidelines:**

- MUST read the installed version from the project's manifest or lockfile before using a feature listed here, rather than assuming the latest.
- MUST consult the installed version's own documentation for any option this reference marks as moved; the surface demonstrably shifts between releases.
- SHOULD name the version a rule was verified against when recording a Vitest convention in a project, so a later reader can tell a stale rule from a current one.
