---
name: next-app-development
description: The ability to build and review a Next.js App Router application on the version 16 baseline — project layout, route files and route modules, navigation, the universal/server/client boundary, the three directives, rendering and streaming, data fetching, mutations, route handlers, caching, error handling, metadata, images and fonts, the proxy, configuration and environment, authentication, internationalization, observability wiring, bundling, testing, deployment, and version discipline. Covers `src/` feature directories under thin `app/` entrypoints, `server-only` fencing versus `"use server"` exposure, `"use cache"` with `cacheLife`/`cacheTag` under `cacheComponents`, `proxy.ts` on the Node.js runtime, server functions that authenticate and authorize inside every call, and the review finding each surface earns when it goes wrong. The Pages Router is out of scope.
when_to_use: Use when writing or reviewing any Next.js App Router change — "app router", "server component", "use client", "use cache", "server action", "server function", "route handler", "proxy", "middleware", "generateMetadata", "revalidateTag", "next/image", "next.config", "instrumentation", "cacheComponents", a hydration or serialization error, or a route that renders dynamically when it should be static. For a component's own composition, props, and state use a React component development capability; for CSS, tokens, and themes use a React component styling capability.
user-invocable: false
---

# Next.js App Development

Use this capability whenever you write or review a Next.js application built on the App Router. It owns **the framework's conventions**: where files live and what their names mean to the router, which code runs on the server and which ships to the browser, how data is fetched and cached, how a mutation is exposed and secured, how errors surface, and how the app is configured, instrumented, bundled, tested, and deployed.

It carries **both voices**. Every reference states the authoring rule — what to write — and, where the surface has a known failure mode, the review check: what to look for in a diff and how severe it is when found. A reviewer loads this one skill to know what to review on a Next.js change; there is no separate review skill to pair it with.

## Baseline and Scope

**Next.js 16 is the baseline.** Every rule here is written against v16 semantics and verified against the 16.2.x documentation. No rule is qualified as holding only on 14 or 15 — where a v16 rule inverts an older one, the older behaviour appears solely in the arrival checklist in [version-and-tooling.md](./references/version-and-tooling.md).

**The App Router is the only router in scope.** The Pages Router — `pages/`, `getServerSideProps`, `getStaticProps`, API Routes — is out of scope entirely: no rule, no migration path, no comparison.

**Experimental and canary APIs are taught, not hidden**, each marked with the flag it requires and the channel it ships on, so a reader can weigh the risk deliberately rather than discover it in production.

**No vendor SDK is named as required.** Integrations are named by role — your auth provider, your error tracker, your analytics tool, your CMS — and a managed platform and a self-hosted pipeline are treated as two adapters of one deployment contract. Where a rule needs a concrete example, it is an example, not a dependency.

## Boundaries

This skill stops where another capability owns the subject:

- **A component's own mechanics** — composition, props contracts, logic extraction, state placement, memoization, list virtualization — belong to a React component development capability. This skill governs only which side of the server/client boundary a component sits on and what that costs.
- **CSS, design tokens, themes, container queries, and stylesheet structure** belong to a React component styling capability.
- **Log levels, capture semantics, breadcrumbs, and PII boundaries** belong to a software instrumentation capability. This skill owns only the Next-specific wiring that hands those signals to it — `instrumentation.ts`, `onRequestError`, `instrumentation-client.ts`.
- **Assertion design, fixture quality, and coverage judgment** belong to unit-testing, end-to-end-testing, and quality-assurance capabilities. This skill owns only what is Next-specific about testing an App Router app.
- **The OWASP lens itself** — injection, SSRF, secret handling, access-control modelling — belongs to an application security capability. This skill applies it to Next's own surfaces: server functions, route handlers, the proxy, image remote patterns, and environment inlining.

**The host repository's existing convention wins.** Every rule states a default for a project that has not decided yet. Where the surrounding codebase has already answered a question — the source root, barrel files, filename suffixes, the import alias — match what is there rather than migrating the codebase toward this skill as a side effect of an unrelated change.

## Project Structure

See [project-structure.md](./references/project-structure.md) for:

- placing a source root and organizing feature directories beneath it
- keeping `app/` as thin route entrypoints that import from feature directories
- choosing the import alias, and the kebab-case file naming default
- deciding whether barrel files belong in this repository
- which files stay at the repository root even when a source root exists
- restructuring an existing tree without a rewrite

## Route Files

See [route-files.md](./references/route-files.md) for:

- the special files the router recognizes, including the experimental global not-found
- the order they nest in, and what each one wraps
- dynamic, catch-all, and optional catch-all segments; route groups, private folders, parallel slots, and intercepting routes
- colocating non-route files inside `app/`, and segment naming
- the pairs that cannot share a directory, and the slot files a build now requires

## Route Modules

See [route-modules.md](./references/route-modules.md) for:

- the default export every route module owes the router
- awaiting `params` and `searchParams`, and the generated type helpers that describe them
- treating route parameters as untrusted input
- reading a route promise from a synchronous component
- choosing between a layout and a template, and what a layout does not re-render
- the streaming cost of awaiting request data at the top of a layout

## Navigation

See [navigation.md](./references/navigation.md) for:

- linking between routes, and when an imperative navigation is the right tool
- prefetching defaults, and turning prefetch down on a large or costly route
- surfacing pending state on a link
- the search-params hook that opts a route out of static rendering, and how to contain it
- typed routes and History API updates
- building a modal from parallel and intercepting routes

## Component Boundaries

See [component-boundaries.md](./references/component-boundaries.md) for:

- the three categories a component can occupy, and the decision tree that picks one
- universal components as the default, and the four constraints that define them
- what belongs on the server as a positive catalogue, not just a prohibition
- placing the client boundary as low as possible, and what crosses it
- serializable props, interleaving, and why an async client component is invalid
- the two composition patterns this skill recommends, with the hydration mistakes they avoid

## Directives

See [directives.md](./references/directives.md) for:

- the fence that keeps a module out of the client graph
- the directive that exposes a function as a callable endpoint, and why the two are not interchangeable
- the caching directive and its private and remote variants
- the client-side mirror of the server fence
- the read-only repository marked as a server module, named as an anti-pattern

## Rendering and Streaming

See [rendering-and-streaming.md](./references/rendering-and-streaming.md) for:

- what makes a route static or dynamic, and the flag that changes the model
- the loading file, and what it costs to declare one
- choosing Suspense granularity, and when a boundary wants no fallback
- pregenerating dynamic segments
- deferring work until after the response is sent

## Data Fetching

See [data-fetching.md](./references/data-fetching.md) for:

- the approaches available, and why a codebase should not mix them
- a fenced data-access layer that returns transfer objects rather than rows
- removing waterfalls with parallel awaits, promise props, and preloading
- deduplicating a query that a page and its metadata both need
- fetching from the client, and where that leaves validation

## Mutations

See [mutations.md](./references/mutations.md) for:

- server functions as the default mutation path, and the form integration around them
- the three checks every server function performs before it writes
- keeping the exposed function thin over a fenced module
- what a mutation may return, and where navigation calls belong relative to error handling
- closure encryption, allowed origins, and mutating during render
- calling an external backend instead, and what that changes

## Route Handlers

See [route-handlers.md](./references/route-handlers.md) for:

- the method exports a route file recognizes, and the typed context helper
- when a handler is the right tool and when a server function is
- the environment functions supported inside a handler
- shaping a response — JSON, redirects, status and headers, streaming
- preferring Web-standard APIs while permitting Node.js ones
- cross-origin and replay protection on authenticated writes
- generating images from a handler

## Caching

See [caching.md](./references/caching.md) for:

- applying the caching directive at route, component, and function level
- declaring a cache lifetime explicitly instead of inheriting the default profile
- why runtime request data cannot be read inside a cached scope, and the pattern that replaces it
- how a cache key is built, and the cardinality trap in closure capture
- tagging entries, and the three invalidation APIs and what distinguishes them
- path-based invalidation and why user input must never reach it
- wiring invalidation to the write that causes it

## Error Handling

See [error-handling.md](./references/error-handling.md) for:

- the error boundary files, their scope, and the one that replaces the root layout
- the not-found files, including the experimental global variant
- the navigation interrupts, and the canary auth interrupts behind their flag
- how an error bubbles, and where a `try`/`catch` belongs
- rethrowing framework control-flow errors that a `catch` would otherwise swallow
- why a not-found interrupt is not an error to report

## Metadata

See [metadata.md](./references/metadata.md) for:

- static metadata versus the generated variant, and when each applies
- the base URL, title templates, robots directives, and Open Graph fields
- the viewport export that is no longer part of metadata
- the metadata file conventions the router picks up automatically
- sitemaps and robots files, including the sharded variant
- generating Open Graph images, and embedding structured data

## Images, Fonts, and Assets

See [images-fonts-and-assets.md](./references/images-fonts-and-assets.md) for:

- the image component and the props that prevent layout shift
- scoping remote patterns and enumerating local ones
- the v16 image defaults that changed, and what each one breaks
- falling back to an unoptimized image
- loading fonts through the built-in loader instead of a stylesheet link
- the public directory and serving assets from a CDN prefix

## Proxy

See [proxy.md](./references/proxy.md) for:

- the file, the exported function, and the config object beside it
- the runtime it pins, and the documentation page that still disagrees
- writing a matcher, and what runs when you omit one
- what belongs in the proxy and what does not
- why it runs on prefetches and data routes
- why it is never the only authorization check

## Authentication

See [authentication.md](./references/authentication.md) for:

- session strategies and the cookie flags each one needs
- an optimistic check at the edge of the app versus the authoritative check at the data layer
- a deduplicated session verifier, and calling it in every server function and route handler
- the layout caveat that makes a layout check insufficient
- degrading gracefully when the auth provider is unconfigured

## Internationalization

See [internationalization.md](./references/internationalization.md) for:

- a locale segment versus single-URL negotiation, and what each costs
- negotiating from the request header with quality values, and letting a cookie override it
- loading dictionaries on the server rather than shipping them
- locale metadata in the document and in Open Graph
- pregenerating locales, and how locale interacts with the cache key

## Configuration and Environment

See [configuration-and-environment.md](./references/configuration-and-environment.md) for:

- a typed config file, and the options that change behaviour rather than tune it
- the default bundler and the config that makes a build fail
- environment file precedence, and the prefix that inlines a value into client bundles
- why an inlined variable must be read by its full literal name
- centralizing environment reads, and forcing a read to happen at runtime
- reading environment outside the running app, and the runtime config that no longer exists

## Observability Wiring

See [observability-wiring.md](./references/observability-wiring.md) for:

- the server instrumentation file and splitting registration by runtime
- the request-error hook and what it receives
- client instrumentation and the router-transition hook
- the build plugin, source-map upload, tunnel, and release tagging an error tracker needs
- loading third-party scripts, and reporting web vitals

## Bundling

See [bundling.md](./references/bundling.md) for:

- why the client boundary is transitive, and how a server-only package reaches a client bundle
- externalizing a server package, and transpiling one that ships untranspiled
- barrels and namespace imports that defeat tree-shaking, and the option that mitigates them
- dynamic imports, disabling server rendering on one, and the SEO trap that follows
- what the compiler changes about hand-written memoization
- the build-output metrics that no longer exist, and what to measure instead

## Testing

See [testing.md](./references/testing.md) for:

- the transform and module mapper a unit runner needs for this framework
- why an async Server Component is not unit-testable, and what to cover instead
- the test-hook contract across loading and loaded states
- running the suite against dev, a local production build, and a deployed target

## Deployment

See [deployment.md](./references/deployment.md) for:

- what the application declares regardless of where it runs
- a managed platform and a self-hosted pipeline as two adapters of one contract
- the output modes and what each one gives up
- version skew across a deploy, and the identifier that pins it
- cache headers at a CDN, and the shape of a CI pipeline

## Version and Tooling

See [version-and-tooling.md](./references/version-and-tooling.md) for:

- reading documentation at the version the project actually runs
- the upgrade command and the codemods it applies
- the arrival checklist for a codebase coming from the previous major
- the runtime and language versions this major requires
- the DevTools MCP server and the in-app endpoint, and what they answer
- diagnosing which routes a build spent its time on
