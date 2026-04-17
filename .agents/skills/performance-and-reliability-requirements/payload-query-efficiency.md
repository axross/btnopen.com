# Payload Query Efficiency

Apply these rules to verify Payload CMS queries are bounded and N+1-free.

## Mandatory Query Bounds

Every `payload.find(…)` call MUST set these fields explicitly. The reviewer MUST flag a Major when any are missing:

| Field | Why required |
|---|---|
| `select: { … }` | Without an explicit projection, Payload returns every field on every document, including large `richText` `body` blobs. The existing `getBlogPosts` and `getBlogPost` use `select` to fetch only what the consumer renders. |
| `depth: <n>` | Default is `2`. The reviewer MUST flag a Critical for `depth: 0` removal when the consumer relies on populated relationships, AND a Major for `depth: > 3` (each depth level fans out joins). |
| `limit: <n>` | Without `limit`, Payload defaults to 10. Flag a Critical when the consumer expects all documents but `limit` is missing (the user will silently see 10). The existing `getBlogPosts` sets `limit: 50` — match the project's bounding pattern. |
| `where: { … }` | Required when fetching anything other than "all of this collection". MUST always include `_status: { equals: "published" }` for non-draft reads per [application-security-requirements › access-control](../application-security-requirements/access-control.md). |

## N+1 Patterns to Reject

- MUST flag a Critical when the diff iterates a list of records and calls `payload.find(…)` or `payload.findByID(…)` inside the loop. Use a single `where: { id: { in: [...ids] } }` query instead, or rely on `depth` to populate relationships in the original query.
- MUST flag a Critical when a Server Component renders a list and each list item awaits its own data fetch — pre-fetch in the parent and pass `Promise<T>` props per [rsc-client-boundary.md](./rsc-client-boundary.md).
- MUST flag a Major when a Payload `afterOperation` hook iterates `result.docs` and `fetch`-es a per-doc URL serially (i.e., without `Promise.all`). The existing `payload/collections/blog-post.ts` `afterOperation` already uses `Promise.all` over `docs.map(...)` — match the pattern.

## Singleton Payload Instance

- MUST flag a Major when the diff calls `getPayload({ config })` more than once inside the same request scope. Cache the instance to a local `const payload` and reuse it. The existing repositories all do this.
- MUST flag a Critical when the diff imports `getPayload` from anywhere other than `payload` (the canonical entry). The Payload runtime singleton is process-global; alternative imports break the singleton.

## Pagination

- MUST flag a Critical when a new repository function returns `result.docs` directly without a comment about whether `result.totalDocs > limit` will silently truncate. Either lift the limit, paginate, or document the intentional cap.
- SHOULD flag a Major when a new collection is created without a defined sort (`sort: ["-publishedAt"]` etc. on the consumer side) — unsorted queries return documents in DB-insertion order, which is not stable across migrations.

## Migration Cost

- MUST flag a Critical when a new Payload migration (under `payload/migrations/`) drops a column or renames a field on a collection that has production data, without a data-backfill step. Defer to the human owner per [code-review-guideline › escalation](../code-review-guideline/escalation.md).
- MUST flag a Major when a new collection adds an unindexed field used in a `where` filter — Payload's SQLite adapter will full-scan. Either add `index: true` to the field config or document the expected row count.

## Locale Handling

- MUST flag a Major when a new repository call omits `locale: "ja-JP"` for content collections (`blog-posts`, `tags`, `users`). The project default is `ja-JP` with English fallback — diverging from the pattern returns the wrong locale silently.
