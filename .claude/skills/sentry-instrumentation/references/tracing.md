# Tracing

Apply this reference when enabling tracing, choosing a sample rate, connecting a trace across a service boundary, instrumenting an operation the SDK does not cover, or reducing span volume.

Verified against `@sentry/react` and `@sentry/nextjs` 10.69.0 and `@sentry/react-native` 8.20.0, checked against [Sentry's tracing documentation](https://docs.sentry.io/platforms/javascript/guides/react/tracing/) on **2026-08-02**.

## Sampling Is a Cost Decision

`tracesSampleRate` is a flat proportion; `tracesSampler` is a function receiving the sampling context and returning a rate, so different routes can be sampled differently.

There is no correct default. Full sampling is entirely reasonable for a low-traffic application and ruinous for a hot endpoint, and the right value depends on traffic and quota rather than on principle. What is not reasonable is a rate nobody chose — an inherited `1.0` on a service that has since grown, or a rate lowered incidentally during unrelated work, which makes a project look healthy when it has actually gone blind.

**Guidelines:**

- MUST set the sample rate explicitly, with a comment stating the reasoning — traffic level, quota, or a specific noisy path.
- MUST NOT change a sample rate as an incidental side effect of unrelated work; a quieter project reads as healthier and is not.
- SHOULD use a sampler function once any single route needs a different rate from the rest, rather than lowering the flat rate for everything.
- SHOULD keep tracing enabled at some rate rather than off entirely; a trace that was never sampled cannot be reconstructed after an incident.

## Propagation Across Boundaries

A trace spans services because the SDK adds trace headers to outgoing requests and the receiver continues the trace from them. `tracePropagationTargets` controls which outgoing requests get those headers.

The default differs by platform for a reason. On the web it is same-origin and relative URLs, because adding headers to a cross-origin request the receiver does not expect triggers a CORS preflight failure. On mobile there is no such constraint, so the default is permissive.

Widening the list on the web is therefore a two-sided change: the receiving service must accept the trace headers in its CORS configuration, or the request breaks outright. That is a real outage, not a missing trace.

**Guidelines:**

- MUST confirm the receiving service accepts Sentry's trace headers before adding its origin to the propagation targets on the web.
- MUST NOT widen propagation to a third-party API you do not control; the headers leak trace identifiers and may break the request.
- SHOULD keep the mobile default rather than narrowing it without cause; the CORS constraint that motivates the web default does not apply.
- SHOULD enable the standards-based trace header alongside Sentry's own where a receiving service expects it.

## Custom Spans

The SDK instruments what it can see — navigation, requests, renders, framework boundaries. Anything else is invisible until measured: a local computation, a database transaction, a queue round trip, an on-device model call.

Sentry's span API covers the three shapes this needs. A callback-scoped span for an operation with a clear beginning and end; a manually ended span for one whose end is not lexically scoped; and a detached span for work that runs alongside rather than within the current operation.

Attributes on a span are what make it queryable afterwards. A span named for its operation with a size, a count, or a result attached answers questions later; a bare span only says how long something took.

**Guidelines:**

- MUST name a span for the operation rather than the call site, so spans from different call paths aggregate.
- MUST attach the dimensions that make a slow span explicable — a batch size, an item count, a cache outcome — as attributes, subject to the content rules.
- MUST NOT put user content in a span name or attribute; span names are aggregated and content leaks into the aggregate.
- SHOULD instrument the operation a user waits on rather than every internal step; span volume is billed and reviewed by humans.

## Reducing Volume

Once tracing is on, the usual problem is not too little data but too much of one kind — a health check on every interval, a polling request, an instrumented library emitting a span per internal call.

Three filters exist at different granularities: dropping whole transactions by name, dropping spans by name or attribute, and reshaping or dropping a span in the send hook. Prefer the declarative option over the hook, for the same reason as elsewhere: an option is visible configuration, a hook is code that gets refactored.

**Guidelines:**

- MUST drop routine noise — health checks, polling, static asset requests — rather than paying to sample it.
- SHOULD use the declarative span- and transaction-ignoring options in preference to the send hook where they express the rule.
- MUST NOT drop a span category to reduce volume without checking what it was answering; the noisiest instrumentation is sometimes the load-bearing one.

## Span Delivery

Current SDKs offer two delivery modes: the established one, where spans are held and sent as a single transaction when the root finishes, and a streaming one, where spans are sent as they complete. Streaming suits a long-running operation whose spans would otherwise be buffered for its whole duration, at the cost of a different shape in the product.

**Guidelines:**

- SHOULD keep the default delivery mode unless a specific long-running operation is losing spans to buffering.
- MUST verify how the chosen mode presents in Sentry before adopting it project-wide; the two produce different structures for the same code.
