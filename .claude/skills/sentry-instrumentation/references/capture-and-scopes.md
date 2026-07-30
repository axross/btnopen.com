# Capture and Scopes

Apply this reference when reporting an error to Sentry, attaching context to an event, filtering what reaches the project, changing how events group into issues, or making sure a final event is sent before something exits.

Verified against `@sentry/react` and `@sentry/nextjs` 10.69.0 and `@sentry/react-native` 8.20.0.

This reference covers the **Sentry mechanism**. _Which_ failures deserve capture, where a `try`/`catch` belongs, and whether to report-and-rethrow or report-and-recover belong to a software instrumentation capability, which owns them vendor-neutrally.

## Capturing

`captureException` takes the error and an optional second argument carrying context for this event alone. `captureMessage` takes a string for a condition that is worth reporting but never threw. Both return an event identifier, which is what links a later user-feedback submission to the event that prompted it.

Passing a non-`Error` value works and produces a poor issue: Sentry has no stack to walk and groups by whatever it can stringify. Wrapping the value in an `Error` at the capture site costs a line and produces a usable trace.

**Example:**

```ts
const eventId = captureException(error, {
  tags: { subsystem: "sync" },
  extra: { attempt, queueDepth },
});
```

**Guidelines:**

- MUST pass an `Error` instance to `captureException`, wrapping a thrown non-`Error` at the capture site rather than forwarding it raw.
- MUST attach the identifiers that make the failure reproducible — the entity, the route, the operation — rather than the values the failure was operating on.
- SHOULD keep the returned event identifier when the surface can offer feedback or a support reference, and discard it otherwise.
- SHOULD capture a descriptive `Error` for an unexpected state that never threw — a contract violation, an impossible branch — rather than logging it and moving on.

## Filtering What Reaches the Project

Some events are guaranteed noise, and each has its own filter:

- **`ignoreErrors`** drops events whose message matches a string or pattern. It is the tool for known-benign browser and platform noise.
- **`denyUrls` and `allowUrls`** drop events by the script they originated in — the mechanism for browser extensions and injected third-party scripts.
- **Third-party error filtering** uses build-injected module metadata to distinguish your bundle's frames from everyone else's, which is more reliable than URL matching where a bundler has inlined dependencies.

Distinct from all of these is **framework control flow**. Several frameworks signal not-found and redirect by throwing. Those throws are routing, not failure; reporting them fills the project with events that describe normal navigation and buries the real failures underneath.

**Guidelines:**

- MUST filter a framework's control-flow interrupts out of error reporting, using the framework's own predicate where it provides one rather than matching on a message.
- MUST keep `ignoreErrors` patterns narrow enough that a real failure cannot match one; a broad pattern silently deletes signal.
- SHOULD prefer third-party error filtering to URL-based denial where the build can inject module metadata.
- SHOULD record why each filter entry exists, since an unexplained pattern is impossible to retire safely.

## Reshaping an Event

An **event processor** runs on every event and can modify or drop it. It is the general-purpose hook for something no option expresses — deriving a tag from an error subclass, redacting a project-specific field, dropping a category of event conditionally.

Modern SDKs take event processors as plain functions, and integrations as functions returning an integration object. The older class-based form with a lifecycle method is from a superseded major and does not work on current SDKs — worth recognising, because it is what an older codebase in the same organization will contain.

**Guidelines:**

- MUST write an event processor as a function; the class-with-lifecycle-method form belongs to a superseded SDK major.
- MUST keep a processor cheap and total — it runs on every event, and a throw inside one loses that event.
- SHOULD derive a searchable tag from an error's own type or code in a processor, rather than repeating the derivation at every capture site.

## Scopes, Tags, Context, and Attributes

Data attached to a scope applies to every event captured while that scope is active. There are three: a **global** scope for process-wide facts, an **isolation** scope for one request or one task, and a **current** scope for a narrow block. A server that writes request data to the global scope leaks it across concurrent requests; that is what the isolation scope exists to prevent.

What to attach where depends on how it will be used:

| Kind          | Indexed and searchable           | Use for                                                       |
| ------------- | -------------------------------- | ------------------------------------------------------------- |
| **Tag**       | Yes, low cardinality             | Filtering and grouping — environment, feature area, plan tier |
| **Context**   | No, structured blob              | Detail read while looking at one event                        |
| **Attribute** | Yes, on spans, logs, and metrics | Dimensions on non-error signals                               |

The failure mode is putting a high-cardinality value in a tag — a user identifier, a request identifier, a timestamp — which degrades search for everyone in the organization.

**Guidelines:**

- MUST attach request- or task-scoped data to the isolation scope on a server, never the global scope.
- MUST NOT place a high-cardinality value in a tag; it belongs in context, or as an attribute where the signal supports one.
- SHOULD use a temporary scope for a block that needs extra context, so the additions do not outlive it.
- SHOULD set process-wide facts once at initialization rather than re-setting them per event.

## Breadcrumbs

Breadcrumbs are the trail of recent activity attached to the next captured event — the difference between a bare stack trace and a sequence that explains it. Most arrive automatically: navigation, requests, console output, user interaction.

A project's own structured logger is the highest-value source, because logging well then produces a useful trail for free. Whether log lines are also sent to Sentry's log store is a separate decision, covered in [logs-and-metrics.md](./logs-and-metrics.md).

**Guidelines:**

- MUST keep breadcrumb messages and data inside the data-class rules in [data-collection.md](./data-collection.md), which owns them; breadcrumbs ship with the event.
- SHOULD populate the trail through ordinary logging rather than scattered manual breadcrumb calls.
- SHOULD reserve a manual breadcrumb for a non-log event worth placing on the timeline — a state transition, a deliberate user action.
- SHOULD attach a public identifier as breadcrumb data so the trail is filterable.

## Grouping and Fingerprints

Sentry groups events into issues by a fingerprint it derives from the stack trace and error type. The default is usually right. When it is wrong it is wrong in one of two directions: one issue that should be many — a generic wrapper error swallowing distinct causes — or many issues that should be one, where a varying value has leaked into the grouping key.

A custom fingerprint overrides the derivation. It is a blunt instrument and worth reaching for only after confirming the default is genuinely misgrouping.

**Guidelines:**

- MUST confirm the default grouping is wrong before overriding it, rather than fingerprinting pre-emptively.
- MUST keep a custom fingerprint free of high-cardinality values, or every event becomes its own issue.
- SHOULD fix the underlying error shape — a wrapper that loses the cause, a message built by interpolation — in preference to fingerprinting around it.

## Flushing

Events are queued and sent asynchronously. A context that is about to disappear — a serverless invocation ending, a script exiting, a process shutting down — can take the queue with it. Flushing awaits delivery with a timeout.

**Guidelines:**

- MUST flush before a short-lived execution context ends, wherever the platform does not do it for you.
- MUST bound the flush with a timeout, so telemetry delivery never blocks shutdown indefinitely.
- SHOULD NOT flush on every capture in a long-running process; it defeats batching for no benefit.
