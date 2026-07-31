# Data Collection and PII

Apply this reference when configuring what Sentry is allowed to collect, adding context to an event, reviewing a change that touches captured data, or answering whether a telemetry payload carries user content.

Verified against `@sentry/react` and `@sentry/nextjs` 10.69.0 and `@sentry/react-native` 8.20.0.

## Two Data Classes

Everything Sentry can attach to an event falls into one of two classes, and they carry different risk.

**Diagnostic context** describes the shape of a failure: who it happened to (by identifier), where it happened, what the request looked like structurally. It is what makes an issue actionable, and it is proportionate to send.

**User content** is the payload itself: request and response bodies, model prompts and completions, raw form input, the values inside a stack frame. Sending it copies private data into a third-party system, permanently, for a diagnostic benefit that is usually available another way.

The default posture is therefore split rather than uniform: diagnostic context permitted, content denied. Enabling a content category is an exception that needs a stated reason, not a convenience.

**Guidelines:**

- MUST leave content categories disabled by default — request and response bodies, generative-AI inputs and outputs, and raw user input.
- MUST record a reason beside any content category that is enabled, naming what it buys that a diagnostic identifier does not.
- SHOULD prefer sending an identifier that resolves to the content over the content itself, so the data stays in the system that owns it.
- MUST treat enabling a content category as a privacy-sensitive change, reviewed as one; a security and privacy capability owns that review.

## The Collection Options

Current JavaScript SDKs express this through a structured `dataCollection` option with a field per category, each independently settable. The older single boolean — which turned on _every_ category at once, content included — is deprecated in its favour, and the structured option wins when both are present.

That deprecation is not uniformly reflected in Sentry's own material: the quickstart snippets still show the boolean, and the React Native options page still documents it without a deprecation marker. Which option the installed SDK accepts is therefore a lookup, not a memory.

**Example:**

```ts
Sentry.init({
  dsn,
  dataCollection: {
    userInfo: true, // diagnostic: identifies who hit it
    httpBodies: [], // content: nothing
    genAI: { inputs: false, outputs: false }, // content: nothing
  },
});
```

**Guidelines:**

- MUST check which option the installed SDK accepts before setting either; the two SDK lines differ and the docs disagree with themselves.
- MUST NOT set the deprecated boolean to true as a shortcut; it enables every content category, which is the opposite of the split posture.
- MUST set the option explicitly rather than relying on defaults, so the posture is visible in the diff that establishes it.
- SHOULD express a narrowing through the option's own allow and deny lists where the category supports them, rather than scrubbing the same fields later in a hook.

## What Arrives Without Configuration

Some collection is on before anything is configured, which is why "we never added user data" is not evidence that none is being sent. Depending on platform and SDK, an unconfigured client can already be attaching local variable values from stack frames, source lines around each frame, URL query strings and fragments, and log output captured as breadcrumbs.

Each is defensible as diagnostics and each can carry content — a query string with a token in it, a stack frame holding a decrypted payload, a log line that interpolated a request body.

**Guidelines:**

- MUST review what the installed SDK collects by default before treating a payload as safe, rather than reasoning only about what the project added.
- SHOULD reduce stack-frame variable capture and surrounding source context on any surface that handles credentials or regulated data.
- MUST NOT rely on a query-string convention to keep secrets out of telemetry; secrets do not belong in URLs regardless.

## Scrubbing on the Way Out

Each signal has a hook that runs before it is sent, and each can modify the payload or drop it entirely by returning nothing. They are the last line inside the application:

| Signal              | Hook                    |
| ------------------- | ----------------------- |
| Errors and messages | `beforeSend`            |
| Transactions        | `beforeSendTransaction` |
| Spans               | `beforeSendSpan`        |
| Logs                | `beforeSendLog`         |
| Metrics             | `beforeSendMetric`      |

A hook is the right tool for a project-specific field that no option covers. It is the wrong tool for a whole category the options already express, because a hook is code that can be refactored away while an option is configuration that stays visible.

**Guidelines:**

- MUST scrub a project-specific sensitive field in the hook for the signal that carries it, rather than assuming a default covers it.
- MUST keep every hook total — a throw inside one loses the event and can take the surrounding operation with it.
- SHOULD express a whole-category decision through the collection options rather than a hook, so it is configuration rather than logic.
- MUST NOT use a hook to re-add content the collection options excluded.

## Scrubbing on the Server

Sentry can also scrub after receipt, before storage. That path applies immediately across every client without a redeploy, which makes it the right response to a leak discovered in production — an in-application fix ships at the speed of the slowest mobile release, which is far too slow for data already flowing.

It is a complement, not a substitute: server-side scrubbing means the data still left the device.

**Guidelines:**

- MUST reach for server-side scrubbing first when sensitive data is already being sent in production, then fix the client.
- MUST NOT treat server-side scrubbing as sufficient where the data should not leave the device at all.
- SHOULD keep the server-side rules recorded in the repository alongside the client configuration, since a rule nobody can see is a rule nobody maintains.

## Identifying a User

Attaching a user makes an issue answerable — how many people hit this, is it one account or all of them. Attaching the wrong field makes the issue a copy of the user record.

An internal, opaque identifier answers every operational question. An email address answers none of them better and is directly identifying.

**Guidelines:**

- MUST identify a user by an internal identifier rather than an email address, username, or any directly identifying field.
- MUST clear the user from the scope on sign-out, so subsequent events are not attributed to someone who left.
- SHOULD attach role, plan, or tenant as separate low-cardinality fields when they help triage, rather than encoding them into the identifier.

## Content That Arrives Sideways

The obvious channels are the ones people configure. The leaks come from the ones they do not:

- **A route or transaction name** built from a path containing an identifier or a search term.
- **A navigation parameter** captured automatically by a mobile routing integration.
- **A breadcrumb** produced by a log line that interpolated a payload.
- **Free-text user feedback**, which is user-authored content by definition and passes through no scrubbing at all.

**Guidelines:**

- MUST parameterize route and transaction names so a dynamic segment appears as a placeholder rather than a value.
- MUST strip sensitive navigation parameters where a routing integration captures them automatically, either in the appropriate hook or through server-side rules.
- MUST apply the same content rules to breadcrumb messages and data as to event context; breadcrumbs ship with the event.
- SHOULD treat free-text feedback as unscrubbable and account for it in the project's privacy documentation rather than trying to filter it.

## Platform Privacy Declarations

Where a platform requires an application to declare what it collects, error and performance telemetry is collectible data and has to appear in that declaration. This is a store-review failure rather than a runtime one, so it surfaces late and blocks a release.

**Guidelines:**

- MUST declare crash, performance, and other diagnostic data in the platform's privacy manifest where one is required.
- MUST revisit the declaration when a new signal is enabled — replay, profiling, and feedback each collect something the previous declaration may not cover.
