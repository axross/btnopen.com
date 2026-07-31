# Testing

Apply this reference when setting up a test runner for a Next.js application, deciding whether a behaviour belongs in a unit test, adding test hooks, or choosing what to run a suite against.

This reference owns only what is **Next-specific**. Assertion design, fixture quality, mocking seams, and coverage judgment belong to unit-testing, end-to-end-testing, and quality-assurance capabilities.

## What a Unit Runner Needs

A runner outside the framework's build sees JSX, path aliases, and framework-specific transforms it does not understand by default. Two pieces of configuration fix that:

1. **The framework's own transform**, so route modules, directives, and JSX compile the way the build compiles them.
2. **A module mapper derived from `tsconfig.json`'s `paths`**, so `@/...` imports resolve.

Deriving the mapper from `tsconfig.json` rather than restating it keeps the two from drifting — a new alias then works in tests without a second edit.

**Guidelines:**

- MUST configure the runner with the framework's supported transform rather than a hand-rolled JSX transform.
- SHOULD derive the module-name mapper from `tsconfig.json`'s `paths` programmatically, not by duplicating the alias list.
- MUST use a browser-like environment for component tests and a Node environment for server-module tests, rather than one environment for everything.
- SHOULD keep the environment declaration per file, so a test's environment is visible where the test is.

## Async Server Components Are Not Unit-Testable

An async Server Component is not a function a test renderer can call and assert on. It is compiled to something the framework's renderer resolves within a request context that a unit runner does not have. Attempting it produces confusing failures that look like bugs in the component.

The productive response is to move the assertable parts out.

**Guidelines:**

- MUST NOT attempt to unit-test an async Server Component by rendering it; cover it end-to-end instead.
- SHOULD extract the logic worth asserting — the query, the mapping to a transfer object, the branch conditions — into plain functions and unit-test those.
- SHOULD unit-test universal components and Client Components normally; both are ordinary React components.
- MUST cover the composed route through an end-to-end test when a rendered outcome matters, since no unit test reaches it.

What does belong in unit tests here: data-access functions against a fake or seeded store, transfer-object mappers, validation schemas, locale negotiation, cache-key builders, proxy matcher logic, and every pure helper.

## Test Hooks

Elements an end-to-end test must reach need a stable hook that does not move when copy or styling changes. The framework-specific part is the loading boundary: streamed content means the fallback and the loaded content are separate DOM states, and a test needs to distinguish "still loading" from "loaded and empty".

The convention is a `-loading` suffix on the fallback's hook, paired with the loaded element's hook.

```tsx
<Suspense fallback={<ArticleListSkeleton data-testid="article-list-loading" />}>
  <ArticleList data-testid="article-list" />
</Suspense>
```

**Guidelines:**

- MUST place a stable test hook on every element an end-to-end test needs to target, including each Suspense fallback.
- SHOULD name a fallback's hook as the loaded element's hook plus a `-loading` suffix, so a test can wait for one to replace the other.
- MUST give each state branch — loading, error, empty, loaded — its own distinct hook, so a test asserting "empty" cannot pass while the region is still loading.
- MUST follow the host repository's existing test-hook naming and scoping convention where it has one.

## Run Targets

The same suite exercises three different things, and only the second and third catch the failures that matter most here.

| Target               | Command shape              | Catches                                                      |
| -------------------- | -------------------------- | ------------------------------------------------------------ |
| Dev server           | `next dev`                 | Fast feedback; misses build-time and prerender behaviour     |
| Local production     | `next build && next start` | Prerendering, caching, bundling, environment inlining        |
| Deployed environment | Against a preview URL      | Platform behaviour, real caching, real headers, real latency |

Static rendering, cache lifetimes, `NEXT_PUBLIC_` inlining, and bundle composition simply do not behave the same in development. A suite that only ever ran against `next dev` has not tested them.

**Guidelines:**

- MUST run the end-to-end suite against a local production build before merging a change that touches rendering, caching, bundling, or environment reads.
- SHOULD run against a deployed preview for changes touching the proxy, cache invalidation, or platform configuration, since local runs cannot reproduce them.
- MUST wait on a readiness signal rather than a fixed sleep when starting a server for a test run.
- MUST NOT let the suite reach live external services; stub at the network boundary so runs are deterministic.
- MUST report which targets were exercised and which were skipped, rather than presenting a change as fully verified.

**Review checks:**

- A test that renders an async Server Component directly — **Major**; it fails for reasons unrelated to the component.
- A new Suspense fallback with no test hook, or one sharing its hook with the loaded content — **Major**; tests cannot distinguish loading from loaded.
- A change to caching, prerendering, or environment inlining verified only against the dev server — **Major**; those behaviours differ in a production build.
- A module mapper restating the alias list instead of deriving it from `tsconfig.json` — **Minor**; the two drift.
