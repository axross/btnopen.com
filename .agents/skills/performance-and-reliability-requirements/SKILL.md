---
name: performance-and-reliability-requirements
description: Use this skill when reviewing runtime cost or failure-mode behavior in this Next.js + Payload CMS + Vercel project. Covers Payload query efficiency, N+1 risk, RSC/client boundary cost, async waterfalls, `Promise<T>` props, Suspense loading splits, `"use cache"`/`cacheLife()` correctness, image optimization, bundle weight, React Compiler impact, and observability hooks. This is the reviewer's lens. Use for "fast", "cache", "scale", "slow", "bundle", or "what happens when this fails".
---

# Performance and Reliability Requirements

Apply these rules when reviewing the runtime cost and failure-mode behavior of any code change. This is the reviewer's lens — flag risks and link to the developer-facing rule rather than restating it.

## Payload Query Efficiency

See [payload-query-efficiency.md](./payload-query-efficiency.md) for what to verify:

- `depth`, `select`, `limit` are explicitly set on every `payload.find(…)` and `payload.findByID(…)` call
- No N+1 pattern: iterating a list of records and re-fetching each related record one at a time
- `getPayload({ config })` is reused inside a request rather than re-invoked in tight loops
- Draft-aware queries do not over-fetch by omitting the `_status` filter

**Guidelines:**

- SHOULD read the linked reference when work touches this topic.

## RSC / Client Component Boundary Cost

See [rsc-client-boundary.md](./rsc-client-boundary.md) for what to verify:

- Async work is parallelized via `Promise.all` or by passing `Promise<T>` props per [react-component-guidelines › client-vs-server-components](../react-component-guidelines/client-vs-server-components.md), not awaited sequentially
- `<Suspense>` boundaries are placed around independently slow units so streaming actually streams
- Loading skeletons (`*-loading.tsx`) do not depend on the loaded data shape
- New Client Components are justified — not promoting an entire RSC subtree into the client just for one event handler

**Guidelines:**

- SHOULD read the linked reference when work touches this topic.

## Caching Correctness

See [caching-correctness.md](./caching-correctness.md) for what to verify:

- `"use cache"` is paired with an appropriate `cacheLife("seconds" | "minutes" | "hours" | "days" | "weeks")` token
- Cache is never applied to per-user / per-request data (no `cookies()`, `headers()`, or auth context inside a cached function)
- Invalidation paths are wired correctly — Payload `afterOperation` hooks call the `posts/caches` revalidation endpoint; new collections need equivalent invalidation
- `revalidatePath(…)` calls target the right path scope ("page" / "layout")

**Guidelines:**

- SHOULD read the linked reference when work touches this topic.

## Image Optimization

See [image-optimization.md](./image-optimization.md) for what to verify:

- Payload upload collections use `webpFormatOptions` and `resizeOptions` (matching the existing `media`, `cover-images`, `avatar-images` collections)
- `next/image` is used over raw `<img>` for any DOM-rendered image
- `unoptimized` is used only when the image dimensions are unknown or the host is not in `images.remotePatterns`
- New external image hosts added to `next.config.ts` `images.remotePatterns` are tightly scoped per [application-security-requirements › ssrf-and-embeds](../application-security-requirements/ssrf-and-embeds.md)

**Guidelines:**

- SHOULD read the linked reference when work touches this topic.

## Bundle Weight

See [bundle-weight.md](./bundle-weight.md) for what to verify:

- New Client Components do not import heavyweight packages (e.g., `metascraper`, `payload`, `unified`)
- Server-only modules are not imported from a `"use client"` file (Next.js will error, but the reviewer MUST flag the cause early)
- Path-aliased imports (`@/components/…`) resolve to the intended tier and do not pull in transitive client-incompatible code
- The `serverExternalPackages` list in `next.config.ts` is not bloated by new entries that could ship to the browser

**Guidelines:**

- SHOULD read the linked reference when work touches this topic.

## Error Handling and Observability

See [error-and-observability.md](./error-and-observability.md) for what to verify:

- `try`/`catch` is at the root call site (route handler / RSC / `route.ts`), not in nested helpers, per [observability-guidelines › error-handling](../observability-guidelines/error-handling.md)
- `captureException()` is called before any early `notFound()` / `redirect()` / return
- Slow or external operations are bracketed by Pino `Started …` / `Completed …` log pairs per [observability-guidelines › logging](../observability-guidelines/logging.md)
- New routes have `error.tsx` boundaries when they need custom error UI, and `global-error.tsx` is not bypassed

**Guidelines:**

- SHOULD read the linked reference when work touches this topic.
