# Test Environment

Apply this reference when choosing an environment, when a test needs a DOM, or when an import fails only under a DOM shim.

Verified against Vitest 4.1.10 — <https://vitest.dev/guide/environment>

## Pick the Cheapest That Answers the Question

Four environments ship: `node` (the default), `jsdom`, `happy-dom`, and `edge-runtime`. A DOM environment is per-file startup cost paid on every file that uses it, so the choice is a budget decision as much as a capability one.

`happy-dom` is faster than `jsdom` and implements fewer APIs. Neither is a browser: both are JavaScript reimplementations that approximate one, and the gap is where a whole class of bug lives.

**Guidelines:**

- MUST leave `environment` at `node` for code that does not touch the DOM.
- SHOULD prefer `happy-dom` over `jsdom` where the APIs a suite touches are covered, and record which was chosen and why.
- SHOULD route DOM-heavy files into their own project rather than switching the whole suite to a DOM environment.

## Overriding One File

A docblock comment at the top of a file overrides the environment for that file alone:

```ts
// @vitest-environment jsdom
```

This is the right tool when a handful of files need a DOM and the rest do not — it avoids both a suite-wide switch and a project split.

**Guidelines:**

- SHOULD use the docblock for a small number of files, and a project once the DOM-needing set is large enough to configure once.
- MUST place the docblock before any import; it is read from the top of the file.

## The Import Failure Under a DOM Shim

The documented failure: a dependency that imports CSS or an asset throws an unknown-extension error under `jsdom` or `happy-dom`, because those environments do not go through Vite's asset handling the way the browser build does.

The fix is `server.deps.inline`, and it needs **the whole import chain** — inlining the package that threw is not enough if it is reached through another package.

**Guidelines:**

- MUST add every package in the import chain to `server.deps.inline`, not only the one named in the error.
- SHOULD check whether the dependency needs to be in the unit test at all before inlining it; a boundary fake is often the better answer.

## Custom Environments

A custom environment is a package named `vitest-environment-<name>` or a path to a module exporting an `Environment` object: a `name`, a `viteEnvironment` field (`"ssr"`, `"client"`, or a custom Vite environment name), a `setup()` returning a teardown callback, and optionally `setupVM()` for the VM pools.

`viteEnvironment` is v4's replacement for v3's `transformMode`.

**Guidelines:**

- MUST set `viteEnvironment` rather than `transformMode` in any environment written for v4.
- SHOULD exhaust the built-in environments and `environmentOptions` before writing a custom one.

## When a Shim Stops Being Enough

"It passes under jsdom and breaks in the browser" is a real and common category: CSS layout, computed styles, genuine event dispatch and bubbling, focus management, and APIs the shim stubs approximately.

Environments run in Node only. When the question is about rendering or real event behavior, the answer is Browser Mode rather than a better shim.

**Guidelines:**

- MUST NOT extend a DOM shim with hand-written stubs to answer a question about real browser behavior; move the test to Browser Mode.
- SHOULD treat a growing pile of `vi.stubGlobal` calls for browser APIs as the signal that the suite has outgrown its environment.
