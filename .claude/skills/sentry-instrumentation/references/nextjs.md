# Next.js

Apply this reference when wiring Sentry into a Next.js application, configuring the build plugin, capturing server errors, or investigating why client and server events do not share a trace.

Verified against `@sentry/nextjs` 10.69.0 on Next.js 16 — documentation read at 16.2.12 — where Turbopack is the default bundler for both development and production builds, checked against [Sentry's Next.js guide](https://docs.sentry.io/platforms/javascript/guides/nextjs/) on **2026-08-02**.

The framework's own hooks — the server-startup registration file, the client instrumentation entry, the global error boundary — are framework surfaces owned by a Next.js capability. What Sentry puts inside them is owned here.

## The Initialization Files

Next.js runs code in more than one runtime, and each needs its own initialization. [Sentry's Next.js manual setup](https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/) names the files: a client instrumentation entry for the browser, a server configuration module for Node.js, an edge configuration module for the Edge runtime, and a server registration file that loads whichever of the last two applies.

The registration file is where the branch lives, and the branch has to be a dynamic import rather than a static one — a static import of a Node-targeting module evaluates before any runtime check can guard it, which breaks the other runtime outright.

**Example:**

```ts
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}
```

**Guidelines:**

- MUST branch on the runtime and load each configuration module through a dynamic import; a static import runs before the guard.
- MUST place the instrumentation files where the framework looks for them relative to the application directory; elsewhere they never run.
- MUST NOT put a secret in the client instrumentation entry; everything there ships to the browser. The DSN is fine, an auth token is not.

What the registration function owes the server process, whatever runs inside it, is a property of the framework export rather than of Sentry: a **Next.js app development capability** owns it under its observability-wiring topic. Consult that capability alongside this section.

## The Two Framework Hooks

Two exports do most of the work, and both are easy to omit because the application runs fine without them.

**The server error hook** receives every server-side error the framework catches — from server components, route handlers, server functions, and request-time middleware — with the request and routing context that produced it. It is the only place server errors are seen uniformly, and the SDK exports a ready implementation to assign to it.

**The router transition hook** fires as a client navigation begins, which is what lets the SDK scope errors and spans to the right route rather than attributing them to wherever the user happened to start.

**Guidelines:**

- MUST export the server error hook in any application with Sentry configured; without it server errors go unreported.
- MUST export the router transition hook so client navigation is scoped correctly.
- MUST NOT report the framework's control-flow interrupts as errors, per the rules in [capture-and-scopes.md](./capture-and-scopes.md).

What each hook owes the framework when the reporting inside it fails holds whichever tracker fills the role, so a **Next.js app development capability** owns it under its observability-wiring topic rather than this reference.

## The Build Wrapper and the Bundler Split

The build wrapper handles source maps, releases, and a set of behavioural options. Its option surface is partitioned by bundler, and this is where Next.js 16 changes the answer.

Options nested under the wrapper's webpack key — automatic instrumentation of server functions, middleware, and the application directory; route exclusion; the hosting platform's automatic monitors; component annotation; tree-shaking controls — apply **only** to a webpack build, as the wrapper's own option reference states ([build options](https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/build/)). On Next.js 16 the default is Turbopack, so unless the build explicitly opts back into webpack, that entire block is inert. It is accepted without complaint, the build succeeds, and nothing it asked for happens.

Turbopack has its own, currently experimental, equivalents for a _small_ part of that surface, and the source-map upload path differs too. Of the groups above, only component annotation has one. Auto-instrumentation, route exclusion, the automatic monitors, and the tree-shaking controls have no Turbopack path at all, so for most of that block there is nothing to migrate to and the option simply goes unread.

Tree-shaking is the case where that gap is easiest to miss, because the wrapper's bundle-size option looks like the bundler-agnostic substitute — it sits outside the webpack-scoped group — but on a Turbopack build it reaches only the hook that runs after compilation, which never applies it and by then could not.

What is left is outside the SDK: the framework compiler's own build-time variable replacement can set the same flags the SDK guards its debug and tracing code with ([replacing variables during build](https://nextjs.org/docs/architecture/nextjs-compiler#define-replacing-variables-during-build)). That is a mechanism the project maintains itself rather than an option to turn on, and the SDK's guard keeps the code whenever the flag is absent — so a replacement that quietly failed to land looks exactly like one that worked.

**Guidelines:**

- MUST determine which bundler actually builds the application before setting any bundler-specific option; a plain build command on Next.js 16 means Turbopack.
- MUST NOT leave a webpack option block in a Turbopack-built application; delete it or migrate it, rather than leaving dead configuration that reads as active.
- MUST verify the effect of any auto-instrumentation option rather than inferring it from the option being set — the failure mode here is silence, not an error.
- MUST confirm a framework-level flag replacement against the built output rather than against the configuration, since the SDK's guard defaults to retaining the code it protects.
- SHOULD reach for that framework-level replacement to strip the SDK's debug and tracing code from a Turbopack build, since no wrapper option reaches it, and treat the resulting maintenance as the cost of the saving.
- SHOULD supply the auth token and organization and project slugs to the wrapper from build-time configuration, per the rules in [source-maps-and-tokens.md](./source-maps-and-tokens.md).
- SHOULD silence the plugin's build output outside continuous integration, where it is noise rather than signal.

## Server Functions and Route Handlers

A server function is a public endpoint, and a failure inside one is a server error the framework's hook will see. Sentry additionally provides an instrumentation wrapper that names the operation and can record headers and the response, which is what makes a server function legible in a trace rather than an anonymous request.

Route handlers are instrumented automatically under webpack's auto-instrumentation and need explicit spans where that does not apply.

**Guidelines:**

- MUST subject anything the instrumentation wrapper records — headers, form data, the response — to the content rules; recording a response body sends user content by default.
- SHOULD name a server function's instrumentation for the operation rather than the exported symbol, so the trace reads as behaviour.
- SHOULD add explicit spans to route handlers where automatic instrumentation does not apply, rather than assuming coverage.

## Error Boundaries

The framework's global error boundary catches what escapes every other boundary, including errors in the root layout. It is a client component and does not report on its own — reporting is an explicit capture call in it.

Per-route boundaries catch nearer the failure and keep the rest of the application usable, which is a better user experience and a more precise report.

**Guidelines:**

- MUST report from the global error boundary explicitly; the framework does not report on its behalf.
- MUST render something usable from every boundary, not only a report call.
- SHOULD add per-route boundaries around independently failing surfaces rather than relying on the global one.

## The Tunnel Route

Tunnelling routes events through the application's own origin. In Next.js the consequence that bites is request-matching configuration: a matcher that covers the tunnel path sends telemetry through authentication and middleware, which breaks it in ways that look like Sentry being down.

**Guidelines:**

- MUST exclude the tunnel path from request-matching configuration when tunnelling is enabled.
- MUST verify events arrive after enabling tunnelling, since the failure is silent from the application's side.
- SHOULD account for the added first-party traffic, per the rules in [delivery-and-footprint.md](./delivery-and-footprint.md).

## Distributed Tracing

Requests the application makes to its own origin, and server functions invoked with headers forwarded, continue the trace automatically. Anything crossing to another origin depends on the propagation targets and the receiver accepting the headers, per the rules in [tracing.md](./tracing.md).

**Guidelines:**

- MUST forward headers where a server function's instrumentation accepts them, or the client and server halves of the trace are unlinked.
- SHOULD verify a single trace spans browser and server after wiring, rather than assuming propagation.
