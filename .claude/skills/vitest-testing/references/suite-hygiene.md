# Suite Hygiene

Apply this reference when setting up a suite's guardrails, or when reviewing a Vitest change.

Verified against Vitest 4.1.10 — <https://github.com/vitest-dev/eslint-plugin-vitest>

## Lint Rules That Catch What Review Misses

`@vitest/eslint-plugin` (formerly `eslint-plugin-vitest`) catches mistakes that read as correct in a diff:

| Rule                   | Catches                                                             |
| ---------------------- | ------------------------------------------------------------------- |
| `expect-expect`        | a test body with no assertion in it                                 |
| `no-focused-tests`     | `.only` left behind, which silently skips the rest of the file      |
| `valid-expect`         | a malformed `expect` that asserts nothing or throws at runtime      |
| `no-conditional-tests` | a test whose existence depends on a runtime condition               |
| `no-identical-title`   | two tests with the same name, where one report line hides the other |

A test that asserts nothing passes, and passes forever. Nothing else in the toolchain notices.

**Guidelines:**

- SHOULD enable the plugin's recommended configuration in any project with a lint step.
- MUST NOT disable `expect-expect` for a test that "obviously works"; a test with no assertion verifies nothing.

## The Abandoned-Edit Guards

Two Vitest behaviors catch work someone stopped halfway, and both are on by default:

- `allowOnly` at its default fails a CI run containing `.only`.
- Obsolete snapshots — stored output no test claims — fail CI.

Both look like pedantry until they catch a deleted test whose snapshot stayed, or a debugging session that reached the default branch.

**Guidelines:**

- MUST leave `allowOnly` at its default in CI.
- MUST delete obsolete snapshots in the change that orphaned them.

## Hygiene as Configuration

Anything relying on every author remembering a hook eventually meets an author who did not. `restoreMocks`, `unstubEnvs`, and `unstubGlobals` move that burden into config, where it applies to files nobody thought about.

`expect.hasAssertions()` covers the case configuration cannot: an assertion inside a callback that may never run.

**Guidelines:**

- MUST configure mock and stub restoration rather than relying on per-file hooks.
- MUST call `expect.hasAssertions()` in a test whose assertions live inside a callback or a `.then` chain.

## Work That Outlives Its Test

`--detect-async-leaks` (4.1+) reports timers and handles still alive when a test finishes. A leaked handle slows the suite, and can make an unrelated later test fail.

**Guidelines:**

- SHOULD run `--detect-async-leaks` periodically rather than only when a run visibly hangs.

## Reviewing a Vitest Change

These are the runner-specific questions. What to assert, how a spec is named, and whether a behavior belongs in a unit test at all are owned by a tool-agnostic unit-testing capability.

- Does CI invoke `vitest run` rather than a form that can enter watch mode?
- Is any `.only` reachable, and is `allowOnly` still at its default?
- Does every non-default timeout carry a stated reason?
- Is each mock replacing something slow, non-deterministic, or side-effecting — or merely something inconvenient?
- Would anyone read this snapshot, or is it large enough to be approved unread?
- Are `.resolves` / `.rejects` assertions awaited?
- Does a new config key exist in the installed version, or is it a v3 name that does nothing?
- Does a raised coverage threshold reflect work done, or was it lowered to pass?

**Guidelines:**

- MUST check a new or changed config key against the installed version's documentation during review; a silently ignored option looks correct in a diff.
- SHOULD ask what a mock is standing in for whenever one is added, since over-mocking is invisible in a passing run.
