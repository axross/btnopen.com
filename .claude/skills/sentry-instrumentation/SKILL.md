---
name: sentry-instrumentation
description: A change touching Sentry — `Sentry.init`, `@sentry/react`, `@sentry/nextjs`, `@sentry/react-native`, `withSentryConfig`, `getSentryExpoConfig`, a DSN, an auth token, source maps, `sendDefaultPii`, `tracesSampleRate`, `replaysOnErrorSampleRate`, `enableLogs`, `beforeSend`, `captureException`, `onRequestError`, a tunnel route, a release, or an unsymbolicated stack trace. For log levels, catch placement, and which failures are worth capturing at all, use a software instrumentation capability instead. The vendor layer — SDK choice, identity, source maps, data-collection posture, sampling, and per-platform init. Lookup-first on versions.
user-invocable: false
---

# Sentry Instrumentation

Use this capability whenever a change touches Sentry — its packages, its initialization, its build-time wiring, or the data it is allowed to collect. It owns the **vendor layer**: which package, which option, which file, which token, and what each one costs.

It does **not** own what to instrument. Which failures deserve capture, where a `try`/`catch` belongs, what a log level means, and whether an event's context is appropriate belong to a software instrumentation capability, which is vendor-neutral and applies whatever tracker a project uses. This skill assumes those decisions are made and says how Sentry carries them out. Where a rule here has a counterpart there, this skill states the Sentry mechanism and names the other as owner.

It also does not own the **framework hook** an integration occupies. That there is a bundler config to wrap, a server-startup hook to register in, or a root component to wrap is a framework fact owned by that framework's own capability; what goes inside the hook is owned here.

**Version discipline.** Sentry ships two independent release lines — the JavaScript SDK (`@sentry/react`, `@sentry/nextjs`) and the React Native SDK — and the React Native line trails the JavaScript one, so an option documented for one may not exist in the other yet. Options also move within a major: `sendDefaultPii` is deprecated in favour of `dataCollection`, and `profilesSampleRate` in favour of `profileSessionSampleRate`. Every version-sensitive statement here names what it was verified against, and where a surface is known to move the rule is a **lookup** — consult the installed SDK's own options page — rather than a frozen option name. Treat an unversioned claim about a Sentry option, in this skill or anywhere else, as suspect.

**Verified against** `@sentry/react` and `@sentry/nextjs` 10.69.0, `@sentry/react-native` 8.20.0, `@sentry/wizard` 6.13.0, and `@sentry/cli` 3.6.2, checked against [Sentry's JavaScript](https://docs.sentry.io/platforms/javascript/) and [React Native](https://docs.sentry.io/platforms/react-native/) SDK documentation on **2026-08-02**.

**Out of scope.** Sentry's product and organization configuration — alert rules, notification routing, ownership rules, inbound filters, spike protection, retention, and dashboards — is configured in Sentry's own interface, not in a repository, and no rule here was derived for it. When a task reaches one of those, say so rather than extrapolating from the rules below.

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119.html).

## SDK and Wrapper

See [sdk-and-wrapper.md](./references/sdk-and-wrapper.md) for:

- picking the package that matches the framework, and the lower-level ones that wire runtimes wrongly
- confining the vendor import to one module, and what that module owes its callers
- which files are exempt from that confinement, and why
- keeping a test suite away from a real client
- reading a rule's verified-against marker, and what to do when the installed SDK disagrees

## Identity and Releases

See [identity-and-releases.md](./references/identity-and-releases.md) for:

- what the DSN is safe to expose and what it is not
- deriving an environment that separates production signal from everything else
- deriving a release, and keeping the same value in the app and the upload
- deciding when a build needs a distribution identifier as well
- creating and finalizing a release, and attaching the commits that went into it

## Source Maps and Debug Symbols

See [source-maps-and-tokens.md](./references/source-maps-and-tokens.md) for:

- how a minified frame is linked back to source, and the two mechanisms that do it
- uploading from a web build, a native build, and an over-the-air update
- the build-time token, where it lives per pipeline, and the prefix that would leak it
- the environment variables that disable, tolerate, or redirect an upload
- confirming symbolication rather than assuming the upload worked

## Data Collection and PII

See [data-collection.md](./references/data-collection.md) for:

- separating diagnostic context from user content, and which option expresses each
- what the SDK collects when nothing is configured
- the hooks that scrub each signal on its way out
- scrubbing on the server when redeploying the app is too slow
- identifying a user without sending their identity
- content that arrives through a route name, a navigation parameter, or a query string

## Capture and Scopes

See [capture-and-scopes.md](./references/capture-and-scopes.md) for:

- reporting an error with the context that makes it actionable
- filtering noise that is not yours, and framework control flow that is not failure
- reshaping or dropping an event before it leaves
- choosing where a tag, a context, or an attribute belongs
- overriding how events are grouped into issues
- flushing before a process or a screen goes away

## Tracing

See [tracing.md](./references/tracing.md) for:

- choosing a sample rate, and recording why it is what it is
- deciding which outgoing requests carry trace headers, and what that asks of the receiver
- measuring an operation the SDK does not already instrument
- dropping spans that add volume without adding answers
- the two span-delivery modes and when the choice matters

## Session Replay

See [session-replay.md](./references/session-replay.md) for:

- the web integration recording the DOM and the mobile one recording the view hierarchy, whose option names never transfer
- what masking hides by default, and what turning it off exposes
- recording every session versus recording only the ones that failed
- capturing network detail without capturing bodies
- the platform-specific capture caveats and the cost of leaving replay on

## Logs and Metrics

See [logs-and-metrics.md](./references/logs-and-metrics.md) for:

- when a log line belongs on the breadcrumb trail, in Sentry's log store, or both
- the logger's levels, its template helper, and the console bridge
- counting, gauging, and distributing a measurement
- attaching dimensions that stay queryable
- filtering either signal before it is billed

## Profiling

See [profiling.md](./references/profiling.md) for:

- what browser profiling requires from the server before it works at all
- profiling a native app, and the engine that has to be running
- choosing between profiling on demand and profiling alongside traces
- the session sample rate and lifecycle mode that superseded the single rate Sentry's quickstart still shows

## User Feedback

See [user-feedback.md](./references/user-feedback.md) for:

- the widget on the web, the form on native, and the gesture that opens it
- collecting feedback from an interface you built yourself
- attaching feedback to the event that prompted it
- what opening the widget starts recording

## Cron Monitors

See [cron-monitors.md](./references/cron-monitors.md) for:

- reporting a scheduled job's start and outcome
- describing the schedule the monitor should expect
- the hosting-platform shortcut and the router it does not cover

## Feature Flags

See [feature-flags.md](./references/feature-flags.md) for:

- attaching evaluated flags to an error event
- the providers with a ready integration, and tracking evaluations without one
- recording flag changes as well as flag reads

## AI Instrumentation

See [ai-instrumentation.md](./references/ai-instrumentation.md) for:

- instrumenting a model client, and what the resulting spans carry
- tracing an agent across its steps and tool calls
- keeping prompt and completion content out of the telemetry

## Delivery and Footprint

See [delivery-and-footprint.md](./references/delivery-and-footprint.md) for:

- getting events past a content blocker, and what that changes about the request
- keeping events through an offline period, and flushing before shutdown
- shrinking what the SDK adds to a bundle
- trading bundle size for legible component and function names

## React

See [react.md](./references/react.md) for:

- initializing before the application's own modules evaluate
- catching render errors, and the root-level handlers a modern React exposes
- attributing spans and breadcrumbs to the component they came from
- routing and bundler integrations, which are version-specific enough to look up
- running the SDK in a shared page, a worker, or a test

## Next.js

See [nextjs.md](./references/nextjs.md) for:

- the initialization files, and which runtime each one serves
- the hook that sees every server error, and the one that follows client navigation
- the build wrapper's options, which of them the default bundler ignores, and the one framework-level replacement that exists for any of them
- instrumenting server functions and route handlers
- the tunnel route's interaction with request-matching configuration

## React Native

See [react-native.md](./references/react-native.md) for:

- what the SDK covers beyond JavaScript, and the crash classes that implies
- the two setup routes, and what each leaves you to do
- the bundler wrapper without which no source map exists
- uploading native symbols, and the build-tool conflict that blocks it
- the automatic instrumentation a mobile app gets, and the documented failure modes

## Expo

See [expo.md](./references/expo.md) for:

- the two wirings a managed app needs, and why one does not substitute for the other
- where initialization goes, and what that placement does and does not achieve
- instrumenting the router, including imperative navigation
- the update context attached to every event, and the failure it reports on its own
- what a build-service pipeline supplies, and what the general-purpose client app cannot do

## Agent Tooling

See [agent-tooling.md](./references/agent-tooling.md) for:

- connecting Sentry's own server so an agent can read issues directly
- narrowing what that connection exposes
- what the automated analysis is worth, and how far to trust it
- driving releases and uploads from the command line
- handling what an issue contains once you have read it

## Verifying the Integration

See [verification.md](./references/verification.md) for:

- proving an event arrives, symbolicated, tagged with the right build
- keeping the SDK inert while tests run
- asserting that application code reported what it should have
- what no amount of local checking can establish
