# Observability Wiring

Apply this reference when connecting an error tracker, a logger, tracing, or analytics to a Next.js application, or reviewing whether a change leaves its failures visible.

This reference owns only the **framework wiring** — which file, which hook, which runtime. Log levels, capture semantics, breadcrumb design, and PII boundaries belong to a software instrumentation capability, and its rules apply in full to whatever is passed through these hooks.

## `instrumentation.ts`

`instrumentation.ts` sits beside `app/` and exports `register()`, called once per server process before anything serves. It is where SDK initialization belongs.

The file is loaded in more than one runtime, so initialization has to be branched — a Node-only SDK imported unconditionally breaks a non-Node runtime, and a static import runs before the branch can guard it.

```ts
// instrumentation.ts
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./instrumentation.node");
  }
}
```

**Guidelines:**

- MUST initialize server-side telemetry SDKs in `register()`, not at module scope of an arbitrary file.
- MUST branch on `process.env.NEXT_RUNTIME` and load runtime-specific SDKs through dynamic `import()`, so the guard is evaluated before the module is.
- MUST place the file beside `app/` — inside `src/` when `app/` is there; elsewhere it never runs.
- MUST keep `register()` fast and failure-tolerant; it blocks server startup, and a throw there takes the process with it.
- MUST NOT read request data in `register()`; there is no request.

## `onRequestError`

`onRequestError`, exported from the same file, receives every server-side error the framework catches — from Server Components, route handlers, server functions, and the proxy — along with the request and the context that produced it.

```ts
export async function onRequestError(error, request, context) {
  await reportServerError(error, {
    path: request.path,
    method: request.method,
    routerKind: context.routerKind,
    routePath: context.routePath,
    renderSource: context.renderSource,
  });
}
```

**Guidelines:**

- MUST export `onRequestError` in any application with an error tracker; it is the only hook that sees server errors uniformly.
- MUST attach the route and request context it provides, since the tracker cannot reconstruct it later.
- MUST NOT report framework control-flow interrupts — `notFound()`, `redirect()` — as errors; filter them out or they bury real failures.
- MUST redact request headers and bodies according to the project's PII rules before sending them anywhere.
- MUST NOT let the hook throw; a failing reporter must not turn a handled error into an unhandled one.

## Client Instrumentation

`instrumentation-client.ts`, beside `app/`, runs before the application's own client code. It is where a browser SDK initializes. It may also export `onRouterTransitionStart`, which fires as a client navigation begins — the hook a tracker needs to scope errors and spans to the right route.

**Guidelines:**

- MUST initialize the browser SDK in `instrumentation-client.ts` rather than in a root layout effect, so errors before hydration are captured.
- SHOULD export `onRouterTransitionStart` to start a navigation span and close the previous route's scope.
- MUST NOT put a secret in client instrumentation; everything there ships to the browser. A public DSN or write-only key is fine, an API secret is not.
- SHOULD keep the client SDK's payload small; it loads on every page.

## What an Error Tracker Needs from the Build

Stack traces from a production bundle are unreadable without source maps, and useless without a release to attach them to.

**Guidelines:**

- MUST upload source maps at build time using the tracker's build plugin, and MUST NOT serve them publicly — upload and delete, rather than shipping them in the output.
- MUST supply an auth token for the upload from a build-time secret, never from a `NEXT_PUBLIC_` variable.
- MUST tag each build with a release identifier the tracker can group by, and use the same identifier as the deployment id where the platform exposes one.
- SHOULD configure a tunnel route when ad blockers would otherwise drop client-side reports, and account for the fact that it makes those requests first-party.
- SHOULD sample traces and session replay rather than capturing everything; the right rate is a project decision, and 100% in production is rarely it.

## Third-Party Scripts

A third-party tag pasted into the markup blocks rendering while it loads, from a domain the project does not control. `next/script` makes the loading strategy an explicit choice instead of an accident of where the tag was pasted.

**Guidelines:**

- MUST load third-party scripts with `next/script` rather than a raw `<script>` tag, so loading strategy is explicit.
- SHOULD use `afterInteractive` for analytics and `lazyOnload` for anything non-essential; reserve `beforeInteractive` for scripts that genuinely must run before hydration.
- MUST NOT inline a third-party tag in the root layout's markup; it blocks rendering and bypasses the loading strategy.
- SHOULD gate an analytics script on consent where the project's privacy posture requires it, rather than loading and then suppressing.

## Web Vitals

Field data is the only measurement that reflects real devices and networks; a local Lighthouse run reflects the machine it ran on. `useReportWebVitals` is the framework's hook into that data, and it costs almost nothing to wire.

**Guidelines:**

- SHOULD report Core Web Vitals with `useReportWebVitals` in a small Client Component mounted once in the root layout.
- SHOULD send vitals to the analytics tool the project already uses rather than adding a second pipeline.
- MUST NOT attach personally identifying data to a vitals event.

**Review checks:**

- A new `error.tsx` or `global-error.tsx` with no path to the project's error tracker — **Major**; failures become invisible.
- An application with an error tracker configured but no `onRequestError` export — **Major**; server errors go unreported.
- A Node-only SDK imported statically in `instrumentation.ts` with no runtime branch — **Critical**; it breaks the non-Node runtime.
- A source-map upload token in a `NEXT_PUBLIC_` variable — **Critical**.
- Source maps served publicly in the production output — **Major**.
- `notFound()` or `redirect()` interrupts reported as errors — **Minor**; noise that hides real failures.
- A raw `<script>` tag for a third-party integration where `next/script` belongs — **Minor**.
