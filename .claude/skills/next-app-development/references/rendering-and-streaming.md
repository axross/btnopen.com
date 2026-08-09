# Rendering and Streaming

Apply this reference when deciding how a route renders, adding a loading file or a Suspense boundary, pregenerating dynamic segments, or diagnosing a route that turned dynamic unexpectedly.

## Static and Dynamic

A route is static when the framework can produce its HTML without a request, and dynamic when it cannot. Nothing declares this — it is inferred from what the route touches. Reading `cookies()`, `headers()`, `searchParams`, `connection()`, or any uncached data makes the route dynamic from that point outward.

The cost of an accidental bailout is invisible in development and total in production: a route that should have been served from the edge as a file now runs the whole render on every request.

**Guidelines:**

- MUST know which request-time APIs a route touches before claiming it is static; the inference is silent in both directions.
- SHOULD contain a request-time read behind its own Suspense boundary so the rest of the route can still prerender, rather than letting one read make the whole page dynamic.
- SHOULD NOT force `dynamic = "force-dynamic"` to work around a bailout you have not diagnosed; find what made it dynamic first.
- MUST NOT use `dynamic = "force-static"` on a route that reads request data; it does not make the read safe, it makes it wrong.

## Cache Components

[`cacheComponents`](https://nextjs.org/docs/app/api-reference/config/next-config-js/cacheComponents) changes the model rather than tuning it. With it enabled, the boundary between prerendered and per-request content is drawn by `"use cache"` scopes and Suspense boundaries: what is cached goes into the static shell, what is not streams in per request. It replaced the experimental partial-prerendering flag and the route-level `experimental_ppr` segment config, both removed in v16, and supersedes the earlier `experimental.dynamicIO` and `experimental.useCache` flags.

```ts
// next.config.ts
const nextConfig: NextConfig = { cacheComponents: true };
```

**Guidelines:**

- SHOULD enable `cacheComponents` in a new application and design around cached scopes plus Suspense from the start.
- MUST NOT carry `experimental.ppr`, `experimental_ppr`, `experimental.dynamicIO`, or `experimental.useCache` into a v16 codebase; they are removed or deprecated in favour of `cacheComponents`.
- MUST treat enabling `cacheComponents` on an existing application as its own migration with its own review, not as a flag flipped inside a feature change.

## `loading.tsx`

A `loading.tsx` wraps the segment below it in a Suspense boundary automatically. It is the cheapest possible streaming setup and the bluntest: it covers everything in the segment, so the whole subtree waits behind one fallback.

**Guidelines:**

- SHOULD add `loading.tsx` at the segment whose data is genuinely slow, not at the root where it blanks the application on every navigation.
- SHOULD prefer explicit Suspense boundaries around the slow components when a page has both fast and slow regions; a segment-level loading file gives up the fast region's head start.
- MUST make the fallback structurally similar to the loaded content — matching the eventual layout — so streaming in the real content does not shift the page.

## Suspense Granularity

Each boundary is a place the page can commit. Too few, and one slow query holds the entire route; too many, and the page arrives in visible stages that read as jank.

**Guidelines:**

- SHOULD draw a boundary around each independently-loading region, so a slow sidebar does not delay the article body.
- SHOULD group regions that must appear together inside one boundary, rather than letting them pop in separately.
- MAY use a boundary with a `null` fallback to isolate a bailout without showing a placeholder — useful for a below-the-fold region whose absence is not noticeable.
- MUST place a boundary around any component calling `useSearchParams` or reading a promise with `use()`.

## `generateStaticParams`

`generateStaticParams` tells the build which dynamic segments to pregenerate. Params it does not list are still served — rendered on demand — unless the segment opts out.

```tsx
export async function generateStaticParams() {
  const articles = await getPublishedArticleSlugs();
  return articles.map((slug) => ({ slug }));
}
```

**Guidelines:**

- SHOULD pregenerate the params that are known, popular, and stable — published content, locale segments, top-level categories.
- MUST NOT pregenerate an unbounded set; enumerate a bounded, meaningful subset and let the rest render on demand.
- SHOULD set `dynamicParams = false` when the listed params are genuinely exhaustive, so an unlisted param produces a not-found rather than an on-demand render.
- MUST NOT read request data inside `generateStaticParams`; it runs at build time, where none exists.

## `after()`

`after()` schedules work to run once the response has been sent. It is the right tool for anything the user should not wait on — logging, analytics, cache warming, a webhook.

**Guidelines:**

- SHOULD move non-essential post-response work into `after()` rather than awaiting it in the render or handler path.
- MUST NOT perform work inside `after()` that the response's correctness depends on; the response is already gone.
- MUST NOT read request data inside `after()` that was not captured before the callback was scheduled.
- SHOULD keep `after()` work bounded; on a serverless platform the instance may be reclaimed, and long tails are dropped rather than reported.

**Review checks:**

- A request-time API read at the top of a route or a widely-scoped layout with no Suspense boundary containing it — **Major**; the route stops prerendering.
- `dynamic = "force-dynamic"` added with no stated reason — **Major**; it usually masks an undiagnosed bailout.
- `generateStaticParams` enumerating an unbounded collection — **Major**; build time grows with the data set.
- A `loading.tsx` added at the root segment for one slow page — **Minor**; every navigation now blanks.
- A fallback whose shape does not match the loaded content — **Minor**; it shifts layout on stream-in.
