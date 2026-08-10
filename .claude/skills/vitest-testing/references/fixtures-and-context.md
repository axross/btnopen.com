# Fixtures and Test Context

Apply this reference when a test needs per-test setup, when setup is duplicated across files, or when a fixture must outlive a single test.

Verified against Vitest 4.1.10; the builder form and `test.override` require 4.1.0+ — <https://vitest.dev/guide/test-context>

## The Built-In Context

Every test body receives a context object: `task` (read-only metadata), `expect` (bound to this test), `skip(condition?, note?)`, `annotate` , `signal` (an `AbortSignal` fired on timeout, cancellation, or bail), and `onTestFailed` / `onTestFinished`.

The bound `expect` matters for one specific reason: the global `expect` cannot reliably track snapshot state across concurrent tests, so a concurrent snapshot must use the context's.

**Guidelines:**

- MUST use the context's `expect` for snapshot assertions inside a concurrent test.
- SHOULD pass `signal` to real asynchronous work so a timed-out test actually stops it rather than leaving it running.

## Declaring Fixtures

The 4.1 builder form infers types from the return value, so nothing needs declaring twice:

```ts
export const test = baseTest
  .extend("config", { port: 3000 })
  .extend("server", async ({ config }) => `http://localhost:${config.port}`);
```

Teardown registers through `onCleanup`, which may be called **once per fixture**. A fixture needing two independent cleanups is two fixtures.

The Playwright-compatible object form with a `use()` callback is also supported, and suits a team that already knows it; it needs manual type annotations.

**Guidelines:**

- SHOULD prefer the builder form in a new project, for the type inference.
- MUST split a fixture rather than calling `onCleanup` twice; the second call is an error.
- MUST NOT mix the builder and object forms within one project.

## Scopes

A fixture is test-scoped by default, and may be file- or worker-scoped instead. The dependency rule: **a fixture may only depend on fixtures of its own scope or a longer-lived one.** A worker fixture cannot reach a file fixture; a test fixture can reach both.

Only test-scoped fixtures see test-specific context such as `task` and `expect`. Suite-level hooks on an extended test can reach file- and worker-scoped fixtures, not test-scoped ones.

Worker scope interacts with isolation: with `isolate: false`, a worker fixture is shared across every file that worker handles.

**Guidelines:**

- MUST keep anything a test mutates at test scope; a shared mutable fixture at worker scope couples every file in that worker.
- MUST reserve worker scope for expensive, read-only resources — a started container, a compiled artifact, a connection pool.

## Destructuring Is Load-Bearing

Vitest initializes only the fixtures a test actually destructures. Reaching them through the context object instead — `context.database` rather than `{ database }` — defeats the analysis and initializes fixtures the test does not use.

**Guidelines:**

- MUST destructure fixtures in the test signature rather than accessing them off the context object.

## Overriding and Injecting

`test.override` (replacing the deprecated `test.scoped`) changes a fixture's value for a suite, inherits into nested suites, and chains. It cannot introduce a new fixture, and cannot override `scope` or `auto`.

A fixture declared with `injected: true` takes its value from `config.provide`, so each project can supply its own — a base URL, a database name, a feature flag.

**Guidelines:**

- MUST use `extend` rather than `override` to introduce a fixture; `override` only changes an existing one.
- SHOULD use an injected fixture rather than an environment variable when a value differs per project, so the default lives with the fixture.
