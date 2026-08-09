# Profiling

Apply this reference when enabling profiling, diagnosing why profiles never appear, or choosing between profiling on demand and profiling alongside traces.

Verified against `@sentry/react` 10.69.0 (browser profiling requires 10.27.0+) and `@sentry/react-native` 8.20.0, checked against [Sentry's profiling documentation](https://docs.sentry.io/platforms/javascript/guides/react/profiling/) on **2026-08-02**.

## Browser Profiling Needs the Server's Permission

Browser profiling is built on a browser API that is unavailable unless the document is served with a specific permissions header. Without that header the integration initializes, reports no error, and produces nothing — the characteristic symptom being "profiling is configured and there are no profiles".

The header has to come from wherever the document is served: a hosting platform's header configuration, a web server directive, a middleware, or a CDN response-header policy. A host that does not allow custom response headers cannot support browser profiling at all.

The API is also currently Chromium-only, so profiles represent a subset of users rather than the whole population.

**Guidelines:**

- MUST configure the required document policy header at the serving layer before concluding that profiling is broken.
- MUST verify the header is present on the served document rather than only in configuration; a CDN or proxy can strip it.
- SHOULD treat browser profile data as a Chromium-only sample, and avoid drawing population-wide conclusions from it.

## Native Profiling

On mobile, profiling samples the JavaScript engine and native threads, and requires the modern JavaScript engine to be in use. There is no header equivalent — it is enabled through the integration and the sample-rate options.

**Guidelines:**

- MUST confirm the required JavaScript engine is enabled before expecting native profiles.
- SHOULD validate profiling on a release build; engine and build configuration differ enough from development that a development check proves little.

## Rates and Lifecycle

Current SDKs express profiling as a session sample rate plus a lifecycle mode. **Manual** mode profiles only between explicit start and stop calls, which suits profiling one known-expensive operation. **Trace** mode profiles automatically while a trace is active, which suits finding out where time goes without knowing in advance.

This pair supersedes an older single sample rate. That older option still appears in Sentry's own quickstart snippets, so which one the installed SDK accepts is a lookup rather than a memory.

**Guidelines:**

- MUST look up which profiling options the installed SDK accepts rather than copying a rate from a snippet.
- SHOULD start in trace mode when the question is "where does the time go", and manual mode when a specific operation is already suspect.
- MUST sample profiling well below full rate on any surface with real traffic; profiling is the most expensive signal per session.
- SHOULD treat production profiling as an aggregate tool; its sampling frequency is far below what a local profiler gives, and it is not a substitute for one.
