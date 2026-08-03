# AI Instrumentation

Apply this reference when instrumenting a model client or an agent, reading AI spans, or deciding what a model call may send to Sentry.

Verified against `@sentry/react` and `@sentry/nextjs` 10.69.0 and `@sentry/react-native` 8.20.0.

## Instrumenting a Model Client

Sentry ships integrations for the major model providers and for the orchestration frameworks built on them. Each wraps the client's call path and emits a span per request carrying the operational dimensions: which model, how many tokens in and out, how long it took, whether it errored, and — for a framework integration — how the call sat within a larger chain.

Those dimensions are what make model usage answerable. Latency and cost are otherwise invisible in a trace, because from the application's side a model call is one opaque await.

An on-device model is a different case: no provider integration applies, and the work is a local computation. Instrument it with a custom span carrying the same shape of dimensions.

**Guidelines:**

- MUST use the provider's or framework's own integration where one exists, rather than hand-rolling spans around a client it already covers.
- MUST instrument an on-device or self-hosted model with a custom span carrying model identity, input and output sizes, and duration.
- SHOULD attach token counts wherever the client reports them, since cost questions are otherwise unanswerable from telemetry.
- SHOULD name model spans for the operation rather than the prompt, so spans aggregate.

## Agent Tracing

An agent's work is a tree — a plan, tool calls, retries, sub-agents — and a single span per model call flattens it into noise. Agent tracing preserves the structure so a slow or wrong run can be read as a sequence of decisions rather than a list of requests.

For a long-running agent, the delivery mode matters: buffered spans on a run lasting minutes arrive all at once at the end, which is exactly when they are least useful. The streaming option exists for this shape.

**Guidelines:**

- MUST keep the agent's structure in the span tree — a tool call is a child of the step that invoked it, not a sibling.
- SHOULD name each span for the step or tool rather than for its arguments.
- SHOULD consider streaming span delivery for an agent whose runs outlive a normal request, per the rules in [tracing.md](./tracing.md).

## Content Stays Out

Prompts and completions are user content in the strictest sense: a prompt is often the person's own words, and a completion is derived from them. Current SDKs collect them by default under the generative-AI collection category, which means an integration added without touching configuration will send them.

This is the single most consequential default in the AI surface, and it is easy to miss because it is enabled by the same integration that provides the useful dimensions.

**Guidelines:**

- MUST disable generative-AI input and output collection unless there is a stated, reviewed reason to send it, per the data-class rules in [data-collection.md](./data-collection.md).
- MUST verify what an integration collects by default when adding it, rather than assuming the diagnostic dimensions come without the content.
- SHOULD attach a prompt identifier, a template name, or a hash where the prompt itself would have been useful, so the span stays diagnosable without carrying the text.
- MUST NOT reintroduce prompt or completion text through a span attribute, a log line, or a breadcrumb after excluding it through the collection options.
