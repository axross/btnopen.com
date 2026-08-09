# Delivery and Footprint

Apply this reference when events are not arriving, when the SDK's contribution to a bundle matters, or when deciding how much build-time work to spend on legible stack traces.

Verified against `@sentry/react` and `@sentry/nextjs` 10.69.0, `@sentry/react-native` 8.20.0, and the Sentry bundler plugins on `@sentry/bundler-plugin-core` 5.3.0, checked against [Sentry's configuration options](https://docs.sentry.io/platforms/javascript/guides/react/configuration/options/) on **2026-08-02**.

## Getting Past a Content Blocker

Browser content blockers filter requests to known telemetry hosts, so a meaningful share of client-side events never leave. Tunnelling answers this: the SDK sends events to a path on the application's own origin, and the server forwards them.

It is a real trade rather than a free win. Those requests become first-party, which means they pass through whatever the application applies to first-party requests — request-matching configuration, authentication middleware, rate limiting, logging — and they consume the application's own serving capacity. Two failures follow from forgetting that: a middleware matcher that intercepts the tunnel path and breaks it, and a content security policy that never learned about the destination.

**Guidelines:**

- MUST exclude the tunnel path from request-matching middleware, authentication, and any rate limiting that would drop telemetry.
- MUST account for tunnelled telemetry in the application's own capacity and logging, since it is now application traffic.
- SHOULD choose a tunnel path that does not read as telemetry, since a blocker list can learn an obvious one.
- MUST update the content security policy to permit the SDK's destination wherever tunnelling is not used.

## Surviving an Unreliable Connection

A mobile application is offline regularly and a browser tab closes without warning. Several mechanisms exist for this: an offline queue that persists envelopes until connectivity returns, a bounded cache size, client reports that tell Sentry what the SDK itself dropped and why, and an explicit flush for a context that is about to disappear.

Client reports are the least obvious and the most useful during an investigation — they distinguish "nothing went wrong" from "events were sampled, rate-limited, or dropped before sending".

**Guidelines:**

- MUST leave client reports enabled; without them a quiet project is indistinguishable from a broken integration.
- SHOULD bound the offline cache deliberately on mobile rather than accepting the default without checking it against the application's storage budget.
- MUST flush before a short-lived context ends, per the rules in [capture-and-scopes.md](./capture-and-scopes.md).
- SHOULD check the SDK's own debug output before concluding events are being blocked; a misconfigured DSN presents identically.

## Bundle Footprint

The SDK is not small, and several options trade capability for bytes: excluding debug and logging statements from the build, excluding tracing code where the application does not use it, and stripping the SDK's own build-time logger. Each works by replacing a flag the SDK guards that code with, so the whole saving is made during compilation and nothing is paid at runtime for turning one on ([tree shaking](https://docs.sentry.io/platforms/javascript/configuration/tree-shaking/)).

Costing nothing at runtime is not the same as being available, and these are build-plugin options: they reach the bundlers the SDK ships a plugin for and no others. Elsewhere the setting is accepted and silently does nothing — the same failure the annotation option below has, without annotation's consolation that the other bundler has an equivalent. The case that catches people is a meta-framework whose build wrapper accepts the option outside its bundler-scoped group, which reads as bundler-agnostic and is not: on Next.js it reaches a webpack build and not a Turbopack one, with nothing to migrate to. A build no plugin covers is a lookup for a framework-level replacement mechanism, not a rule that cannot be met — [nextjs.md](./nextjs.md) carries that route for the framework where this currently bites.

**Guidelines:**

- MUST strip debug and logging statements from production builds wherever the bundler actually building the application provides the option; they exist for development and ship otherwise.
- MUST confirm the SDK ships a plugin covering the build before counting one of these options as applied, and look up a framework-level route where it ships none — for Next.js, per the rules in [nextjs.md](./nextjs.md).
- SHOULD exclude tracing code from the bundle only where the application genuinely does not trace, since re-enabling it later is easy to forget.
- SHOULD measure the SDK's contribution before optimizing it, rather than assuming which option matters.

## Legible Names Cost Bytes

Minification renames functions and components, which makes breadcrumbs, spans, and profiles far less readable — a trail of anonymous frames rather than named components. Two mechanisms buy the names back at a cost.

On the web, a build-plugin option annotates components so their names survive into breadcrumbs and spans. It is bundler-specific: the established path covers one bundler, and the newer default bundler has its own experimental equivalent, so which option applies is a lookup.

On native, preserving function and class names is a minifier setting. It works, and it increases bundle size across the whole application rather than only the annotated parts.

**Guidelines:**

- MUST check which annotation option applies to the bundler actually building the application; an option for the other bundler is accepted and silently does nothing.
- SHOULD enable component annotation where breadcrumbs and spans are actually read during triage, and leave it off where they are not.
- SHOULD treat native name preservation as a deliberate size trade, measured rather than assumed.
- MUST NOT assume minified names in a report indicate a source-map failure; missing names and missing source maps are separate problems with separate fixes.
