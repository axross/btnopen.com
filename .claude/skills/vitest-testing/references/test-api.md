# Test API

Apply this reference when declaring tests and suites, parametrizing them, or choosing a hook.

Verified against Vitest 4.1.10 — <https://vitest.dev/api/test>, <https://vitest.dev/api/describe>, <https://vitest.dev/api/hooks>

## Signatures and the Argument That Moved

`test` (aliased `it`) and `describe` take a name, then either a body or an options object followed by a body. A bare number in the third position is still a timeout shorthand.

**Options go in the second argument.** The v3 form that passed them third was removed in v4 and a third-argument object is not read — so options written that way apply nothing, silently.

```ts
test("retries a failed upload", { retry: 2, timeout: 10_000 }, async () => {});
```

**Guidelines:**

- MUST pass test options as the second argument; a third-argument options object is ignored.
- MUST pick one of `test` or `it` per project and use it consistently.

## Modifiers

The modifier set is in the linked reference and applies to both tests and suites. Two carry a catch: `sequential` is deprecated in favour of `concurrent: false`, and `fails` inverts the result — it passes when the body throws, so one left behind after a fix turns a working test into a failing one.

**Guidelines:**

- MUST NOT commit `only`; leave `allowOnly` at its default so CI rejects it.
- SHOULD prefer `skipIf` / `runIf` over a conditional inside the body, so the report shows the test as skipped rather than passing vacuously.
- MUST pair a `todo` with the work that will implement it, rather than using it as a permanent note.

## `each` versus `for`

Both parametrize. They differ in one respect that decides the choice: `test.each` **spreads** an array case into separate arguments, while `test.for` passes it as a single value and gives the body the test context.

That context is what concurrent snapshots require, so `for` is the right form whenever a parametrized case snapshots or runs concurrently.

**Guidelines:**

- MUST use `test.for` when a parametrized case needs the test context — concurrent execution or a snapshot assertion.
- SHOULD write a case table that reads as data rather than as a nested structure the body must unpack.

## Options That Change Semantics

`retry` re-runs a failing test; `repeats` runs a passing one again; `tags` attaches filterable labels; `meta` attaches data for reporters.

`retry` takes a count, a delay, and an optional error predicate, so it can be narrowed to the failure it is meant to absorb rather than applied to every error the test can produce.

**Guidelines:**

- SHOULD scope a `retry` with its error predicate so it absorbs only the non-deterministic failure it was added for, rather than masking every failure mode of the test.
- SHOULD consult the tool-agnostic unit-testing capability on whether a retried test should exist at all; this reference owns the option, not the decision.

## Hooks

`beforeEach` / `afterEach` run per test; `beforeAll` / `afterAll` per suite. A hook may return a teardown function, which Vitest calls at the matching point — usually cleaner than a paired `after*`.

Vitest 4.1 added `aroundEach` and `aroundAll`, which wrap execution and receive a `runTest` function. **That function must be called**, or nothing inside runs.

`onTestFinished` and `onTestFailed` register cleanup bound to the current test rather than to the file, which is what makes them correct under concurrency where a shared `afterEach` is not.

**Guidelines:**

- MUST call the provided `runTest` inside an `aroundEach` or `aroundAll` hook.
- MUST use `onTestFinished` rather than `afterEach` for cleanup belonging to one test in a concurrent suite.
- MUST NOT return a non-teardown value from a hook; the return position means teardown.

## Benchmarks

`bench` runs a performance comparison via tinybench, with `time`, `iterations`, `warmupTime`, and setup/teardown options, and supports `skip` / `only` / `todo`.

A benchmark is not a test: it reports numbers rather than asserting them, and its results move with the machine.

**Guidelines:**

- MUST keep benchmarks out of the suite that gates a merge; they measure rather than assert.
- SHOULD run benchmarks through `vitest bench` rather than mixing them into a normal run.
