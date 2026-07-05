# Caching Correctness

Apply these rules to verify that `"use cache"` + `cacheLife()` is applied with a deliberate lifetime and scope, never to per-user/per-request data, and that invalidation paths are wired on writes.

## `"use cache"` Placement

A cache entry outlives the request that created it, so placement decides whether the entry is shared computation or one user's private state replayed to strangers.

**Guidelines:**

- MUST flag a Critical when `"use cache"` appears in a Client Component file (one with `"use client"`). Caching is a server-only directive.
- MUST flag a Critical when `"use cache"` is used in a function that reads `cookies()`, `headers()`, request-specific `searchParams`, or any per-user state. The cached result will be served to other users.
- MUST flag a Major when `"use cache"` is missing from a new server function whose result is stable across requests for some non-trivial duration (e.g., a Payload read of published content). The existing repositories under `app/(app)/_/repositories/` all use `"use cache"`.
- MUST flag a Major when `"use cache"` is paired with a function whose arguments include a value that effectively makes the cache key unique per request (e.g., a timestamp, a random ID, the full request URL). Cardinality explosion is a memory leak.

## `cacheLife` Token Choice

A cache lifetime encodes a judgment about how long stale data is tolerable, and framework defaults shift between versions — an unstated judgment is one nobody validated.

**Guidelines:**

- MUST flag a Critical when `"use cache"` appears without a `cacheLife("seconds" | "minutes" | "hours" | "days" | "weeks")` call immediately after. The default cache lifetime is unsafe to assume.
- MUST flag a Major when the chosen `cacheLife` token is mismatched to the data's actual mutability:
  - `"seconds"` for data that changes only on Payload edits — too short, wastes Payload reads
  - `"days"` or `"weeks"` for data that the author edits multiple times per day — too long, stale UI
  - The existing pattern: blog post and webembed reads use `cacheLife("hours")` because Payload `afterOperation` invalidates explicitly. Match this when adding similar repositories.
- SHOULD flag a Minor when a new bespoke `cacheLife` profile is introduced for a one-off purpose without considering whether one of the standard tokens (`seconds`, `minutes`, `hours`, `days`, `weeks`) suffices.

## Invalidation Wiring

TTL expiry is the fallback, not the mechanism: freshness after an edit depends on the write actively evicting what it just made stale.

**Guidelines:**

- MUST flag a Critical when a new collection is added under `payload/collections/` that backs cached server reads, but no corresponding cache-invalidation `afterOperation` hook is added. Without it, edits in the admin UI leave stale UI for up to one cache lifetime.
- MUST flag a Critical when an `afterOperation` hook calls `revalidatePath(…)` instead of the project's pattern of `fetch`-ing the `/posts/caches` `route.ts` endpoint. The existing pattern centralizes invalidation in `app/(app)/posts/caches/route.ts`. Diverging means draft / preview / live-preview behavior differs from production. (Note: the route handler itself may use `revalidatePath`; the Payload-side hook should call the route, not call `revalidatePath` directly, since hooks may run in a different process than Next.js.)
- MUST flag a Major when a new `route.ts` invalidation endpoint is added without a corresponding Payload hook caller, or vice versa — they come in pairs.
- SHOULD point to the `posts/caches/route.ts` `revalidatePath("/", "page")` pattern as the reference. New endpoints should target the narrowest path that includes all stale routes.

## Per-Path Revalidation

Wrong scope fails in both directions — too broad discards warm cache for unaffected views, too narrow leaves shared UI stale past the edit.

**Guidelines:**

- MUST flag a Major when `revalidatePath(path)` is called without the second `"page" | "layout"` argument when the change affects only one or the other. Wrong scope either over-invalidates (perf) or under-invalidates (stale layout).
- MUST flag a Critical when the path argument to `revalidatePath` is built from user input — that is a cache-poisoning vector.

## Webembed Cache Specifics

The webembed cache exists to shield third-party metadata hosts from per-request traffic, and it only shields anything while many requests share one cache key. The `getWebEmbedMetadata` function is `cacheLife("hours")`.

**Guidelines:**

- MUST verify that `getWebEmbedMetadata` remains `cacheLife("hours")`; flag a Critical when a diff makes this function vary by request-time inputs (e.g., adds a `User-Agent` parameter that changes per visitor) because that explodes the cache key.
- SHOULD flag a Minor recommendation that newly-added `fetch`-based metadata helpers also wrap their Pino logs in `Started …` / `Completed …` pairs with `duration` so cache misses are observable. See [observability-guidelines › logging](../../observability-guidelines/references/logging.md).
