# Data-Access Efficiency

Apply these rules to verify that reads against Payload CMS are bounded and N+1-free.

## Mandatory Query Bounds

Every `payload.find(…)` call should make its projection, relationship depth, result bound, and filter explicit:

| Field | Why it matters |
|---|---|
| `select: { … }` | Without an explicit projection, Payload returns every field on every document, including large `richText` `body` blobs. The existing `getBlogPosts` and `getBlogPost` use `select` to fetch only what the consumer renders. |
| `depth: <n>` | Default is `2`. Removing `depth: 0` is Critical when the consumer relies on populated relationships; `depth: > 3` is Major because each depth level fans out joins. |
| `limit: <n>` | Without `limit`, Payload defaults to 10. Flag a Critical when the consumer expects all documents but `limit` is missing (the user will silently see 10). The existing `getBlogPosts` sets `limit: 50` — match the project's bounding pattern. |
| `where: { … }` | Required when fetching anything other than "all of this collection". Non-draft reads include `_status: { equals: "published" }` per the project's application-security requirements (access-control rules). |

**Guidelines:**

- MUST flag a Major when a `payload.find(…)` call omits `select`, `depth`, `limit`, or `where`.
- MUST flag a Critical when a query removes `depth: 0` while the consumer relies on populated relationships.
- MUST flag a Major when a query sets `depth` above `3`.
- MUST require `_status: { equals: "published" }` in `where` for non-draft content reads.

## N+1 Patterns to Reject

A per-record read inside a loop multiplies round-trip latency by result-set size, so a page that is instant with ten records collapses at a thousand.

**Guidelines:**

- MUST flag a Critical when the diff iterates a list of records and calls `payload.find(…)` or `payload.findByID(…)` inside the loop. Use a single `where: { id: { in: [...ids] } }` query instead, or rely on `depth` to populate relationships in the original query.
- MUST flag a Critical when a Server Component renders a list and each list item awaits its own data fetch — pre-fetch in the parent and pass `Promise<T>` props per [server-client-boundary.md](./server-client-boundary.md).
- MUST flag a Major when a Payload `afterOperation` hook iterates `result.docs` and `fetch`-es a per-doc URL serially (i.e., without `Promise.all`). The existing `payload/collections/blog-post.ts` `afterOperation` already uses `Promise.all` over `docs.map(...)` — match the pattern.

## Singleton Payload Instance

Acquiring the Payload client carries real setup cost — connections, config, auth — and paying it repeatedly within one request buys nothing.

**Guidelines:**

- MUST flag a Major when the diff calls `getPayload({ config })` more than once inside the same request scope. Cache the instance to a local `const payload` and reuse it. The existing repositories all do this.
- MUST flag a Critical when the diff imports `getPayload` from anywhere other than `payload` (the canonical entry). The Payload runtime singleton is process-global; alternative imports break the singleton.

## Pagination

Silent truncation is invisible in development, where collections are small; in production, records simply stop appearing once the dataset outgrows the default limit.

**Guidelines:**

- MUST flag a Critical when a new repository function returns `result.docs` directly without a comment about whether `result.totalDocs > limit` will silently truncate. Either lift the limit, paginate, or document the intentional cap.
- SHOULD flag a Major when a new collection is queried without a defined sort (`sort: ["-publishedAt"]` etc. on the consumer side) — unsorted queries return documents in DB-insertion order, which is not stable across migrations.

## Migration Cost

A migration runs against production data exactly once, and a dropped or renamed column takes its data with it — there is no second pass to recover an oversight.

**Guidelines:**

- MUST flag a Critical when a new Payload migration (under `payload/migrations/`) drops a column or renames a field on a collection that has production data, without a data-backfill step. Defer to the human owner per the project's code-review guideline (escalation rules).
- MUST flag a Major when a new collection adds an unindexed field used in a `where` filter — Payload's SQLite adapter will full-scan. Either add `index: true` to the field config or document the expected row count.

## Locale Handling

Locale fallback makes an omitted `locale` succeed with plausible-looking content, so the wrong locale ships without any error to catch it.

**Guidelines:**

- MUST flag a Major when a new repository call omits `locale: "ja-JP"` for content collections (`blog-posts`, `tags`, `users`). The project default is `ja-JP` with English fallback — diverging from the pattern returns the wrong locale silently.
