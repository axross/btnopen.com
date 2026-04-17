# Caching Correctness

Apply these rules to verify `"use cache"` + `cacheLife()` is applied correctly and invalidation paths are wired.

## `"use cache"` Placement

- MUST flag a Critical when `"use cache"` appears in a Client Component file (one with `"use client"`). Caching is a server-only directive.
- MUST flag a Critical when `"use cache"` is used in a function that reads `cookies()`, `headers()`, request-specific `searchParams`, or any per-user state. The cached result will be served to other users.
- MUST flag a Major when `"use cache"` is missing from a new server function whose result is stable across requests for some non-trivial duration (e.g., a Payload read of published content). The existing repositories under `app/(app)/_/repositories/` all use `"use cache"`.
- MUST flag a Major when `"use cache"` is paired with a function whose arguments include a value that effectively makes the cache key unique per request (e.g., a timestamp, a random ID, the full request URL). Cardinality-explosion is a memory leak.

## `cacheLife` Token Choice

- MUST flag a Critical when `"use cache"` appears without a `cacheLife("seconds" | "minutes" | "hours" | "days" | "weeks")` call immediately after. The default cache lifetime is unsafe to assume.
- MUST flag a Major when the chosen `cacheLife` token is mismatched to the data's actual mutability:
  - `"seconds"` for data that changes only on Payload edits — too short, wastes Payload reads
  - `"days"` or `"weeks"` for data that the author edits multiple times per day — too long, stale UI
  - The existing pattern: blog post and webembed reads use `cacheLife("hours")` because Payload `afterOperation` invalidates explicitly. Match this when adding similar repositories.
- SHOULD flag a Minor when a new `cacheLife` token is introduced for a one-off purpose without considering whether one of the existing four (`seconds`, `minutes`, `hours`, `days`, `weeks`) suffices.

## Invalidation Wiring

- MUST flag a Critical when a new collection is added under `payload/collections/` that backs cached server reads, but no corresponding cache-invalidation `afterOperation` hook is added. Without it, edits in the admin UI leave stale UI for up to one cache lifetime.
- MUST flag a Critical when an `afterOperation` hook calls `revalidatePath(…)` instead of the project's pattern of `fetch`-ing the `/posts/caches` `route.ts` endpoint. The existing pattern centralizes invalidation in `app/(app)/posts/caches/route.ts`. Diverging means draft / preview / live-preview behavior differs from production. (Note: the route handler itself may use `revalidatePath`; the Payload-side hook should call the route, not call `revalidatePath` directly, since hooks may run in a different process than Next.js.)
- MUST flag a Major when a new `route.ts` invalidation endpoint is added without a corresponding Payload hook caller, or vice versa — they come in pairs.
- SHOULD flag the `posts/caches/route.ts` `revalidatePath("/", "page")` pattern as the reference. New endpoints should target the narrowest path that includes all stale routes.

## Per-Path Revalidation

- MUST flag a Major when `revalidatePath(path)` is called without the second `"page" | "layout"` argument when the change affects only one or the other. Wrong scope either over-invalidates (perf) or under-invalidates (stale layout).
- MUST flag a Critical when the path argument to `revalidatePath` is built from user input — that is a cache-poisoning vector.

## Webembed Cache Specifics

- The `getWebEmbedMetadata` function is `cacheLife("hours")`. The reviewer MUST flag a Critical when a diff makes this function vary by request-time inputs (e.g., adds a `User-Agent` parameter that changes per-visitor) — that explodes the cache key.
- SHOULD flag a Minor recommendation that newly-added `fetch`-based metadata helpers also wrap their Pino logs in `Started …` / `Completed …` pairs with `duration` so cache misses are observable.
