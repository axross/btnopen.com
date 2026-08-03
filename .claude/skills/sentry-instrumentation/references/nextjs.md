# Next.js

Apply this reference when wiring Sentry into a Next.js application, configuring the build plugin, capturing server errors, or investigating why client and server events do not share a trace.

Verified against `@sentry/nextjs` 10.69.0 against Next.js 16, where Turbopack is the default bundler for both development and production builds.

The framework's own hooks — the server-startup registration file, the client instrumentation entry, the global error boundary — are framework surfaces owned by a Next.js capability. What Sentry puts inside them is owned here.

## The Initialization Files

Next.js runs code in more than one runtime, and each needs its own initialization. The conventional layout is four files:

| File                             | Runtime                            |
| -------------------------------- | ---------------------------------- |
| The client instrumentation entry | Browser                            |
| A server configuration module    | Node.js                            |
| An edge configuration module     | Edge                               |
| The server registration file     | Loads whichever of the two applies |

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
- MUST keep registration fast and total — it blocks server startup and a throw there takes the process.
- MUST NOT put a secret in the client instrumentation entry; everything there ships to the browser. The DSN is fine, an auth token is not.

## The Two Framework Hooks

Two exports do most of the work, and both are easy to omit because the application runs fine without them.

**The server error hook** receives every server-side error the framework catches — from server components, route handlers, server functions, and request-time middleware — with the request and routing context that produced it. It is the only place server errors are seen uniformly, and the SDK exports a ready implementation to assign to it.

**The router transition hook** fires as a client navigation begins, which is what lets the SDK scope errors and spans to the right route rather than attributing them to wherever the user happened to start.

**Guidelines:**

- MUST export the server error hook in any application with Sentry configured; without it server errors go unreported.
- MUST export the router transition hook so client navigation is scoped correctly.
- MUST NOT report the framework's control-flow interrupts as errors, per the rules in [capture-and-scopes.md](./capture-and-scopes.md).
- MUST NOT let either hook throw; a failing reporter must not turn a handled error into an unhandled one.

## The Build Wrapper and the Bundler Split

The build wrapper handles source maps, releases, and a set of behavioural options. Its option surface is partitioned by bundler, and this is where Next.js 16 changes the answer.

Options nested under the wrapper's webpack key — automatic instrumentation of server functions, middleware, and the application directory; route exclusion; the hosting platform's automatic monitors; component annotation; tree-shaking controls — apply **only** to a webpack build. On Next.js 16 the default is Turbopack, so unless the build explicitly opts back into webpack, that entire block is inert. It is accepted without complaint, the build succeeds, and nothing it asked for happens.

Turbopack has its own, currently experimental, equivalents for part of that surface, and the source-map upload path differs too.

**Guidelines:**

- MUST determine which bundler actually builds the application before setting any bundler-specific option; a plain build command on Next.js 16 means Turbopack.
- MUST NOT leave a webpack option block in a Turbopack-built application; delete it or migrate it, rather than leaving dead configuration that reads as active.
- MUST verify the effect of any auto-instrumentation option rather than inferring it from the option being set — the failure mode here is silence, not an error.
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
