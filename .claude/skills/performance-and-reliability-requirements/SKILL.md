---
name: performance-and-reliability-requirements
description: The runtime-cost and failure-mode review lens for changes in this Next.js + Payload CMS + Vercel project. Covers Payload query efficiency and N+1 risk, RSC/client boundary cost and async waterfalls, `Promise<T>` props, Suspense loading splits, `"use cache"`/`cacheLife()` caching correctness (lifetime, scope, invalidation), image optimization, client bundle and dependency weight, React Compiler impact, and error-handling/observability hooks (Sentry, Pino).
when_to_use: Use when reviewing runtime cost or failure-mode behavior of a code change — "fast", "cache", "scale", "slow", "bundle", or "what happens when this fails". Not for how to write the component itself (the React component guidelines) or general design quality (the maintainable code guidelines).
user-invocable: false
---

# Performance and Reliability Requirements

Apply these rules when reviewing the runtime cost and failure-mode behavior of any code change. This is the reviewer's lens — flag risks and link to the developer-facing rule rather than restating it.

## Data-Access Efficiency

See [data-access-efficiency.md](./references/data-access-efficiency.md) for:

- `select`, `depth`, `limit`, and `where` are explicitly set on every `payload.find(…)` and `payload.findByID(…)` call
- No N+1 pattern: iterating a list of records and re-fetching each related record one at a time
- `getPayload({ config })` is acquired once per request and reused, not re-invoked in tight loops
- Draft-aware queries do not over-fetch by omitting the `_status` filter

## Server / Client Boundary Cost

See [server-client-boundary.md](./references/server-client-boundary.md) for:

- Independent async work is parallelized via `Promise.all` or deferred as `Promise<T>` props to the components that consume it per the project's React component guidelines (client-vs-server-components rules), not awaited sequentially into a waterfall
- `<Suspense>` boundaries are placed around independently slow units so streaming actually streams
- Loading skeletons (`*-loading.tsx`) do not depend on the loaded data shape
- New Client Components are justified — not promoting an entire RSC subtree into the client just for one event handler

## Caching Correctness

See [caching-correctness.md](./references/caching-correctness.md) for:

- `"use cache"` is paired with a deliberately chosen `cacheLife("seconds" | "minutes" | "hours" | "days" | "weeks")` token
- Caching is never applied to per-user / per-request data (no `cookies()`, `headers()`, or auth context inside a cached function)
- Invalidation is wired on writes — Payload `afterOperation` hooks call the `posts/caches` revalidation endpoint; new collections need equivalent invalidation
- `revalidatePath(…)` calls target the right path scope ("page" / "layout")

## Asset and Image Optimization

See [image-optimization.md](./references/image-optimization.md) for:

- Payload upload collections use `webpFormatOptions` and `resizeOptions` (matching the existing `media`, `cover-images`, `avatar-images` collections)
- `next/image` is used over raw `<img>` for any DOM-rendered image, with intrinsic dimensions so optimization can apply
- Above-the-fold imagery is prioritized; below-the-fold imagery is lazy-loaded; `unoptimized` is a fallback, not a default
- New external image hosts added to `next.config.ts` `images.remotePatterns` are tightly scoped per the project's application-security requirements (ssrf-and-embeds rules)

## Bundle and Dependency Weight

See [bundle-weight.md](./references/bundle-weight.md) for:

- New Client Components do not import heavyweight or server-only packages (e.g., `payload`, `unified`, `metascraper`, `pino`, Sentry server entries, `node:*` builtins)
- server-only modules imported from a `"use client"` file, and the likely Next.js build-error cause
- Path-aliased imports (`@/components/…`) resolve to the intended tier and do not pull in transitive client-incompatible code
- The `serverExternalPackages` list in `next.config.ts` is not bloated by new entries that could ship to the browser

## Error Handling and Observability

See [error-and-observability.md](./references/error-and-observability.md) for:

- `try`/`catch` is at the root call site (route handler / RSC / `route.ts`), not in nested helpers, per the project's observability guidelines (error-handling rules)
- `captureException()` is called before any early `notFound()` / `redirect()` / return
- Slow or external operations are bracketed by Pino `Started …` / `Completed …` log pairs per the project's observability guidelines (logging rules)
- New routes have `error.tsx` boundaries when they need custom error UI, and `global-error.tsx` is not bypassed
