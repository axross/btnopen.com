# Logs and Metrics

Apply this reference when deciding whether log lines should reach Sentry, wiring a project logger to it, emitting a counter or a measurement, or reviewing the cost of either signal.

Verified against `@sentry/react` and `@sentry/nextjs` 10.69.0 and `@sentry/react-native` 8.20.0. Logs require SDK 9.41.0+, the console bridge 10.13.0+, metrics 10.25.0+, and shared attributes 10.61.0+.

## Breadcrumbs First, Logs by Decision

There are two ways a log line can reach Sentry, and they are different products.

**As a breadcrumb**, it joins the trail attached to the next captured event. It costs nothing extra, it is retained only as part of an event, and it exists to explain a failure.

**As a Sentry log**, it is stored and independently searchable, outliving any error. It is a separately billed data category.

Breadcrumbs are the default because they are what makes an error report legible, which is the reason the SDK is installed. Sentry Logs is an addition that answers a different question — searching production behaviour when nothing threw — and a project that already runs a structured logger with its own destination may already have that answer.

Sending every line as both is defensible when the two destinations serve genuinely different purposes, but it doubles the volume of the noisiest signal in an application, so it is a decision to make rather than a default to drift into.

**Guidelines:**

- MUST mirror log lines into breadcrumbs as the baseline, so a captured event arrives with the sequence that led to it.
- MUST treat enabling Sentry Logs as an opt-in with a recorded reason naming what it adds over the project's existing log destination.
- MUST NOT send every line to both breadcrumbs and Sentry Logs without recording that the duplication is deliberate and what each half is for.
- SHOULD route both through the project's existing logger transport rather than adding Sentry calls at each log site.

## The Logger API

When enabled, the SDK exposes a logger with six severity levels — trace, debug, info, warn, error, and fatal — each taking a message and optional structured attributes.

A template helper turns interpolated values into searchable attributes rather than baking them into the message string, which is what keeps messages aggregatable. `"User 4821 purchased Widget"` is a unique string; the same line through the helper is one template with two queryable parameters.

**Example:**

```ts
Sentry.logger.info(Sentry.logger.fmt`User ${userId} purchased ${productName}`);
```

**Guidelines:**

- MUST use the template helper for any message with an interpolated value, so the message aggregates and the value stays queryable.
- MUST keep log messages and attributes within the content rules in [data-collection.md](./data-collection.md); logs ship to a third party like any other signal.
- SHOULD map the project logger's levels onto Sentry's explicitly rather than passing a level string through and hoping they align.
- SHOULD reserve the two highest levels for conditions that genuinely warrant waking someone, so severity keeps its meaning.

## The Console Bridge

An integration can capture `console` calls as Sentry logs, filtered by level. It is the fastest way to get logs from a codebase that never adopted a structured logger, and the fastest way to flood a project in one that did — every dependency's console output is captured too. Note that automatic console capture is on by default on some platforms, so it may already be active.

**Guidelines:**

- MUST check whether the installed SDK enables console capture by default before adding the integration; enabling it twice doubles the volume.
- SHOULD restrict captured console levels to warnings and errors rather than capturing everything.
- SHOULD prefer routing a structured logger to Sentry over capturing console output, wherever the project has one.

## Metrics

Metrics answer aggregate questions that logs and spans answer badly: how often, how many, how big. Three types cover it — a counter for occurrences, a gauge for a current value, and a distribution for a spread of measurements with a unit.

This is a distinct API from an earlier metrics offering Sentry withdrew. Guidance written against that one does not apply, which matters because it is still findable.

Attributes are the dimensions a metric is grouped and filtered by, and they can be set per metric or shared across every metric and log through a scope.

Whether a signal earns a metric at all, which instrument type fits it, and what a dimension may contain are not Sentry questions — a software instrumentation capability owns them, vendor-neutrally, and its rules apply in full to everything emitted here. What follows is only the part Sentry decides.

**Example:**

```ts
Sentry.metrics.count("orders_created", 1, { attributes: { tier: "pro" } });
Sentry.metrics.distribution("api_latency", 187, { unit: "millisecond" });
```

**Guidelines:**

- MUST declare the unit through the SDK's own `unit` option rather than encoding it in the metric name, since that is the field the product reads.
- MUST respect the 2KB attribute limit, and check what the installed SDK does when a metric exceeds it rather than assuming truncation.
- SHOULD set dimensions that apply to every metric once through the scope rather than repeating them at each call site.
- MUST keep metric names and attributes inside the data-class rules in [data-collection.md](./data-collection.md), which owns them.

## Filtering Either Signal

Both signals have a send hook — one for logs, one for metrics — that can modify the payload or drop it by returning nothing. Both are billed, so filtering is a cost control as much as a privacy one.

**Guidelines:**

- MUST scrub project-specific sensitive attributes in the relevant hook, since neither signal is covered by the error-side hooks.
- SHOULD drop high-volume, low-value entries at the hook rather than paying to store them.
- MUST keep both hooks total; a throw loses the signal and can disturb the surrounding operation.
- SHOULD flush explicitly before a short-lived context exits, since both signals are buffered, per the rules in [capture-and-scopes.md](./capture-and-scopes.md).
