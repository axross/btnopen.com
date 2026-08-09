# Feature Flags

Apply this reference when connecting a feature-flag provider to Sentry, recording flag evaluations without a provider integration, or investigating whether a flag change caused a failure.

Verified against `@sentry/react` and `@sentry/nextjs` 10.69.0 and `@sentry/react-native` 8.20.0, checked against [Sentry's feature-flags documentation](https://docs.sentry.io/platforms/javascript/guides/react/feature-flags/) on **2026-08-02**.

## Why Flags Belong on an Event

An error that only occurs for the ten percent of users behind a new flag looks, from the outside, like an error that occurs intermittently. Attaching evaluated flags to the event turns that into a visible correlation: the issue's events all share one flag state, and the cause is one line rather than a day.

The value is entirely in the correlation, so partial coverage is worth little — a flag that is not recorded cannot be correlated against.

**Guidelines:**

- MUST record flag evaluations wherever the application gates behaviour on flags, rather than instrumenting only some of them.
- SHOULD treat flag context as diagnostic rather than content; a flag name and a boolean carry no user data.
- MUST NOT encode a user identifier or segment membership into a flag name to make it more informative; that turns diagnostic context into an identifying value.

## Provider Integrations and the Generic Path

Sentry ships integrations for several flag providers, each hooking that provider's evaluation callback so reads are captured automatically. Where a project uses one of those, the integration is strictly better than hand-rolling: it captures every evaluation including ones in library code.

Where a project uses a provider without an integration — or its own flag mechanism, a configuration file, an environment variable — a generic integration accepts evaluations reported manually. That path requires the application to report each read, so it is only as complete as the calls placed.

**Guidelines:**

- MUST use the provider's own integration where one exists, rather than reporting evaluations manually alongside it.
- MUST report through the generic integration at the point of evaluation, not at flag definition, or the record says what exists rather than what was read.
- SHOULD wrap a home-grown flag mechanism's read path once so reporting cannot be forgotten at a call site.

## Change Tracking

Evaluation tracking records what the application read. Change tracking records what someone changed, by registering a webhook with the provider, and is what turns "this started failing at 14:20" into "this flag was flipped at 14:18".

It is configured on the provider's side rather than in application code, so it is a setup step rather than a code change — and one that is easy to leave undone because nothing in the application depends on it.

**Guidelines:**

- SHOULD register change tracking alongside evaluation tracking; each answers half the question and the second half is usually the actionable one.
- MUST record in the project's own documentation that the webhook exists and where it is configured, since nothing in the repository reveals it.
