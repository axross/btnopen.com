# React

Apply this reference when wiring Sentry into a React application that is not built on a meta-framework — a single-page application served from a bundler.

Verified against `@sentry/react` 10.69.0.

Where the application is built on Next.js, that framework's own reference owns initialization, and this file's error-boundary and component-tracking rules still apply.

## Initializing Before the Application

The SDK has to be initialized before the modules it instruments evaluate, which in a bundled application means before the application's own entry module runs. The conventional arrangement is a dedicated initialization module imported first from the entry point, so its side effect runs ahead of everything else.

Placing initialization inside a component — a root effect, a provider's body — is the common mistake. It is late by definition: anything that fails during module evaluation or before the first render happens with nothing listening, and startup is exactly when unrecoverable failures occur.

**Guidelines:**

- MUST initialize in a dedicated module imported first from the entry point, before the application's own imports.
- MUST NOT initialize inside a component, an effect, or a provider; those run after the window in which startup failures occur.
- SHOULD keep that module free of anything but initialization, so its import order is obviously load-bearing.

## Catching Render Errors

React does not surface a render error to a global handler — an uncaught one unmounts the tree silently unless a boundary catches it. Sentry provides a boundary component and a higher-order wrapper around it, both of which report what they catch and can render a fallback, optionally offering feedback.

Modern React additionally accepts error handlers when the root is created, covering uncaught errors, errors a boundary caught, and recoverable errors. These are complementary to a boundary rather than a replacement: the handlers report, and a boundary is still what renders something usable in place of the broken subtree.

A project that has its own boundary component does not need to adopt Sentry's — it can report from its own, using the SDK's React-specific capture call so the component stack is attached.

**Guidelines:**

- MUST report render errors, through Sentry's boundary, through the root's error handlers, or from the project's own boundary using the React-specific capture call.
- MUST keep a boundary that renders a usable fallback regardless of reporting; a reported error the user cannot recover from is still a broken screen.
- SHOULD place boundaries around subtrees that can fail independently rather than only at the root, so one failure does not blank the application.
- SHOULD pass the component stack when reporting from a custom boundary; without it the report loses the React context that makes it legible.

## Component Attribution

Two related capabilities attach component identity to telemetry. One records render timing for a wrapped component or subtree. The other replaces minified element names with component names in breadcrumbs and spans, and depends on build-time annotation covered in [delivery-and-footprint.md](./delivery-and-footprint.md).

Render-timing instrumentation is worth adding around a specific suspected subtree and not worth adding everywhere; it produces a span per render.

**Guidelines:**

- MUST NOT wrap every component in render-timing instrumentation; scope it to a subtree under investigation.
- SHOULD enable component-name annotation where breadcrumbs are actually read during triage, per the rules in [delivery-and-footprint.md](./delivery-and-footprint.md).
- SHOULD remove render-timing instrumentation once the question it was added to answer has been answered.

## Routing and Bundler Integrations

Two surfaces here are deliberately not enumerated in this skill, because both are version-specific enough that a written-down API name is a liability.

**Routing integration** is what produces parameterized transaction names — one transaction for a route pattern rather than one per concrete URL. Every router needs one, the SDK ships a family of them, and the correct export depends on both the router and its major version, with several routers supporting more than one wiring style.

**Source-map upload** is done by a bundler plugin, and the SDK ships one per bundler, plus a command-line path for toolchains without a plugin.

For both, the rule is the shape rather than the symbol.

**Guidelines:**

- MUST install a routing integration matching the router and its major version, looked up in the SDK's documentation for the installed versions rather than copied from a snippet of unknown vintage.
- MUST confirm transaction names arrive parameterized after wiring routing; an unparameterized name is the symptom of the wrong integration or the wrong wiring style, and it also leaks path content.
- MUST upload source maps through the plugin for the bundler in use, per the rules in [source-maps-and-tokens.md](./source-maps-and-tokens.md).
- SHOULD re-check the routing integration after a router major upgrade; it is a routine casualty of one.

## Non-Standard Environments

Three situations change the rules, and each has a documented path:

- **A shared page** — a browser extension, an embedded widget, an application rendered into someone else's document — where a default client would capture errors the host page caused. The SDK's guidance is to avoid installing global handlers and scope capture to your own code.
- **A worker**, which has its own global scope and needs its own arrangement.
- **A test run**, where the SDK should not reach the network at all.

**Guidelines:**

- MUST NOT install a default global client in a shared page or extension; scope capture to the code you own.
- MUST keep the SDK inert during tests, per the rules in [verification.md](./verification.md).
- SHOULD consult the SDK's documented path for workers rather than initializing a second client ad hoc.
