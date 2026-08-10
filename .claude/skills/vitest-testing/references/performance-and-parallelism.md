# Performance and Parallelism

Apply this reference when a suite is slow, when tests interfere with each other, or when choosing a pool.

Verified against Vitest 4.1.10 — <https://vitest.dev/guide/parallelism>

## Two Axes

Work is spread two ways, and a slowdown lives on one of them:

- **Across files** — multiple workers run different files simultaneously. This is the single biggest factor in suite speed.
- **Within a file** — tests run **sequentially by default**, in declaration order.

Confusing the two wastes effort: adding workers does nothing for one enormous file, and marking tests concurrent does nothing for a hundred small ones already spread across workers.

**Guidelines:**

- MUST identify which axis a slowdown is on before changing configuration; the fixes do not transfer.

## Pools

`forks` (default) and `vmForks` run each file in a child process; `threads` and `vmThreads` use worker threads.

`forks` is the default for compatibility rather than speed. Worker threads break in two documented ways: Node's `fetch` under `threads` produces `Failed to Terminate Worker`, and native modules that are not thread-safe produce segfaults and `thread panicked`. Both disappear under `forks`.

**Guidelines:**

- MUST switch to `forks` when a run reports `Failed to Terminate Worker`, a segfault, or a native-code panic.
- SHOULD measure before adopting `threads`; the gain is real on some suites and absent on others, and the stability cost is not.

## Isolation

Isolation gives each file a fresh environment, and it is the largest single cost in a typical run. `isolate: false` is the largest available win and the largest available footgun.

What survives without it is module-level state: singletons, caches, registries, module-scoped counters. Setup files still re-run, but the modules they import stay cached.

It is unavailable under `vmThreads`. And it does not have to be all-or-nothing — a project can disable it for the subset that provably cleans up.

**Guidelines:**

- MUST audit module-level state before disabling isolation, and scope the change to a project rather than the whole suite.
- MUST NOT disable isolation to fix flakiness; it is the mechanism preventing the class of flakiness it would introduce.

## Concurrent Tests

`test.concurrent`, `describe.concurrent`, and `sequence.concurrent` run tests within a file together, bounded by `maxConcurrency`.

The documented ceiling: **concurrency only helps tests that wait.** Purely synchronous tests still share one JavaScript thread, so marking them concurrent adds scheduling overhead and no speed.

Under concurrency, `beforeEach` / `afterEach` may run simultaneously, ordered by `sequence.hooks` (`stack` by default, `list`, or `parallel`), and a snapshot needs the context-bound `expect`.

**Guidelines:**

- MUST NOT mark synchronous tests concurrent; they cannot benefit and the ordering guarantee is lost for nothing.
- MUST use `onTestFinished` rather than a shared `afterEach` for per-test cleanup in a concurrent suite.

## Diagnose Before Changing

Vitest already reports transform, setup, collect, tests, and environment time. The bucket carrying the cost decides the fix, and guessing usually picks the wrong one.

| Bucket      | Usual cause                              | Fix                                                                            |
| ----------- | ---------------------------------------- | ------------------------------------------------------------------------------ |
| Transform   | barrel files pulling in a large graph    | `experimental.importDurations`, then a specific entry point or `resolve.alias` |
| Collect     | discovery scanning too much              | `test.dir`, tighter `include`                                                  |
| Setup       | expensive setup files                    | move work to a worker-scoped fixture                                           |
| Environment | a DOM shim on files that do not need one | route those files to a `node` project                                          |

`experimental.fsModuleCache` speeds watch-mode reruns.

**Guidelines:**

- MUST read the reported timing buckets before changing pool, worker count, or isolation.
- SHOULD import specific entry points rather than barrel files in test code; a barrel drags its whole graph through the transform.

## Sharding and Profiling

`--shard=1/4` with `--reporter=blob`, merged afterwards with `--merge-reports`, distributes a suite across machines. Vitest splits **files**, not cases, so one slow file cannot be sharded.

CPU and heap profiles come from `execArgv` (`--cpu-prof`, `--heap-prof`); `--prof` does not work under `threads`. `logHeapUsage` surfaces growth, `slowTestThreshold` flags outliers, and `--detect-async-leaks` (4.1+) finds the timer or handle keeping a worker alive.

**Guidelines:**

- MUST split an oversized test file before sharding; sharding cannot help within a file.
- SHOULD run `--detect-async-leaks` when a run finishes its tests but takes noticeably longer to exit.
