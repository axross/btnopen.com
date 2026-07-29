# Metrics and Product Analytics

Apply this reference when instrumenting or reviewing code that emits a metric or a product/usage event. "Metrics" is the third observability signal type; product analytics is the same act of measurement pointed at user behavior instead of system health. This file uses `trackEvent(...)` for the emit call; substitute your project's analytics or metrics API (e.g. Mixpanel, Amplitude, PostHog, Segment, StatsD, OpenTelemetry metrics).

## What to Instrument

An event or metric earns its place by answering a question someone will actually ask — a funnel step, an adoption signal, a latency or error rate — so instrument the decisions the data will drive, not every interaction that happens to be reachable.

**Guidelines:**

- SHOULD emit a metric for the health signals a dashboard or alert watches (request rate, latency, error rate, saturation) and an event for the product decisions someone tracks (a feature used, a funnel step reached, a conversion).
- SHOULD NOT fire an event on every incidental interaction; high-cardinality noise dilutes the signal and inflates cost.
- SHOULD prefer counters and durations over logs for anything counted or aggregated — a metric is cheap to roll up, where re-deriving the same number from logs is not.
- MUST NOT let an analytics or metrics failure break the user-facing path; emitting telemetry is a side effect and must not throw into the caller.

## Centralized, Typed Event API

Routing every event through one wrapper keeps naming consistent, makes the vendor swappable from a single file, and lets the type system reject a misspelled event name or a wrong property shape before it ships.

**Guidelines:**

- MUST emit events through one project wrapper rather than calling the vendor SDK directly from feature code, so the SDK is imported in exactly one module.
- SHOULD constrain event names and their properties with a type (a mapping of event name to its allowed properties) so an unknown event or malformed payload is a compile-time error.
- SHOULD normalize names and property keys to one casing at the wrapper boundary (many analytics tools convention on `snake_case`), so call sites stay idiomatic while the emitted schema stays uniform.

```typescript
// One typed wrapper — event names and their properties are checked at compile time.
interface Events {
  "sign in": { method: string };
  "post shared": { post_id: string };
}

export function trackEvent<Name extends keyof Events>(
  name: Name,
  properties: Events[Name],
) {
  if (!analyticsEnabled) return; // gated — see below
  analytics.track(normalizeName(name), normalizeKeys(properties));
}
```

## Stable Naming

Event and metric names are a schema that dashboards, funnels, and alerts are built on top of, so a rename silently breaks every downstream chart that referenced the old name.

**Guidelines:**

- MUST treat an event/metric name and its property keys as a stable contract; renaming one is a breaking change to every dashboard, funnel, and alert built on it.
- SHOULD name events for the user-or-system fact they record (`post shared`, `checkout completed`) rather than the UI element that triggered them (`blue button clicked`), so the name survives a redesign.
- SHOULD keep metric labels/dimensions low-cardinality (a route template, not a full URL with ids) so time-series storage and queries stay bounded.

## Consent, Gating, and PII

Analytics data is user data leaving your system for a third party, so it lives under the same privacy rules as any other export — and often under an explicit consent obligation the code must honor.

**Guidelines:**

- MUST gate emission behind a runtime flag so telemetry is disabled where it should be off (local development, tests, environments without a configured key).
- MUST honor user consent where required — do not emit tracking events for a user who has not opted in, when the project's privacy model requires opt-in.
- MUST NOT put secrets, credentials, raw content, or unnecessary PII into event properties; prefer stable public identifiers and enums, per your project's security and privacy conventions.
- SHOULD send a pseudonymous, stable user/session identifier rather than directly identifying fields (email, name) when a per-user dimension is needed.
