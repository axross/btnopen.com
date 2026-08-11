# Payload

How a collection is configured here, how draft content stays gated, what bounds
a query, what invalidates a cache, and when a schema change needs a migration.

Access control as a discipline belongs to the installed application-security
capability; query cost and caching as disciplines belong to the installed Next.js
capability. This document records how this repository resolves both. What a
reader or an author actually *sees* — the draft lifecycle, the localized fields,
the agentic view — is in [../specs/blog-posts.md](../specs/blog-posts.md) and
[../specs/content-authoring.md](../specs/content-authoring.md).

## Collection Access Rules

Access rules are enforced at the data layer itself, so every route, handler, and
background job inherits whatever a collection's rules allow — a wrong rule is
wrong everywhere at once. A new collection under `payload/collections/` MUST
therefore be given an explicit `access` configuration. Payload's default (auth
required) is safe but silent: a public content collection left on the default
renders an empty route instead of failing loudly.

`access.read = () => true` MUST NOT be set on a collection holding non-public
data. Only `media`, `cover-images`, and `avatar-images` are intentionally
public-readable, as static assets. `access.update`, `access.delete`, and
`access.create` MUST stay admin-only on a new collection rather than allowing all
authenticated users, and `access.read` MUST consult `req.user` rather than
returning `true` unconditionally — even a public collection should return a query
filter excluding draft `_status` for unauthenticated requests.

A **field-level** `access` rule that returns `() => true` on an admin-only field
such as draft `_status` MUST be justified with an explicit comment. The
collection-level prohibition above is about the collection's own data; this is
the narrower case of one field being opened up inside an otherwise-gated
collection, and the comment is what separates a deliberate exposure from an
oversight.

Files under `app/(payload)/` MUST NOT be reviewed or hand-edited; Payload owns
that route segment.

## Draft and Published Gating

Draft content is only as private as the least-guarded code path able to request
it, so the authentication check belongs before the flag is forwarded, not
somewhere downstream. A repository function MUST verify the request is
authenticated to view drafts before it passes `draft: true` to
`payload.find(…)`. Callers gate on `searchParams.draft === "true"` **and** rely
on Payload's draft-API auth; both must be present.

The `_status: { equals: "published" }` filter MUST be included when `draft` is
`false`. `get-blog-post.ts` and `get-blog-posts.ts` add it conditionally —
diverging exposes draft slugs publicly. Draft-only fields (`_status`, localized
shadow fields) MUST NOT be injected into a public response or OG metadata.

`?preview=true` MUST NOT unlock draft content on its own. In
`posts/[slug]/page.tsx` it only selects whether `PayloadLivePreview` renders; the
draft fetch still relies on Payload's draft-API authentication. A new
`searchParams` flag that affects data visibility needs its own auth gate.

## Authentication and Sessions

Payload owns authentication in this project. Lockout settings are the only brake
on credential brute-forcing, and a weakened threshold looks like an innocuous
config tweak in a diff, so `payload/collections/user.ts`'s auth settings MUST NOT
be weakened: `lockTime` below `1000 * 60 * 5` (5 minutes), `maxLoginAttempts`
above `5`, or the `auth: { … }` block removed entirely (Payload then defaults to
no lockout).

A field that stores a credential MUST NOT be added to the `users` collection —
credentials belong in environment variables, not the database. `users` records
also carry email addresses and locked-out state, so `access.read` stays
admin-only.

Session cookies MUST NOT be read or written directly through `cookies()` from
`next/headers`. Payload owns cookie management; bypassing it desynchronizes auth
state. Derive identity from `req.user` on the `getPayload({ config })` context
instead.

A new `route.ts` mutation handler (`POST`, `PUT`, `PATCH`, `DELETE`) MUST
authenticate or origin-gate its caller. All three `caches/route.ts` `DELETE`
revalidation endpoints reject a cross-site caller through `isSameSiteRequest` —
the Payload hook's same-process `fetch` carries no browser origin headers and so
passes, while a browser-driven cross-site call does not. Their source comments
record that a shared-secret header was deferred deliberately, on the grounds that
the effect is an idempotent revalidation; an endpoint whose effect is not
idempotent does not get to inherit that reasoning.

## Query Bounds

Every `payload.find(…)` call makes its projection, relationship depth, result
bound, filter, and locale explicit.

| Field | Why it matters |
| --- | --- |
| `select: { … }` | Without a projection, Payload returns every field on every document, including large `richText` `body` blobs. |
| `depth: <n>` | Default is `2`. Dropping `depth: 0` breaks consumers relying on populated relationships; above `3`, each level fans out joins. |
| `limit: <n>` | Without `limit`, Payload defaults to 10 and the rest silently disappear. `getBlogPosts` sets `limit: 50`. |
| `where: { … }` | Required for anything other than "all of this collection". Non-draft reads include `_status: { equals: "published" }`. |
| `locale` | The project default is `ja-JP` with English fallback. Omitting it on a content collection returns the wrong locale silently, with no error. |

`select`, `depth`, `limit`, `where`, and — on content collections
(`blog-posts`, `tags`, `users`) — `locale` MUST therefore be set on every
`payload.find(…)` call.

`payload.find(…)` and `payload.findByID(…)` MUST NOT be called inside a loop over
records. Use a single `where: { id: { in: [...ids] } }` query, or let `depth`
populate the relationship in the original query. A parent MUST pre-fetch and pass
`Promise<T>` props rather than having each list item await its own fetch. One
`getPayload({ config })` result MUST be reused per request scope rather than the
client being acquired repeatedly, and `getPayload` MUST be imported from
`payload` — the runtime singleton is process-global, so an alternative import
breaks it.

A query SHOULD be given an explicit `sort` (such as `sort: ["-publishedAt"]`);
unsorted queries return documents in insertion order, which is not stable across
migrations. Code returning `result.docs` directly SHOULD state whether
`result.totalDocs > limit` can silently truncate — lift the limit, paginate, or
document the intentional cap. A field used in a `where` filter SHOULD be given
`index: true`, or the expected row count documented; the SQLite adapter
full-scans otherwise. Per-document work in a Payload `afterOperation` hook SHOULD
be parallelized with `Promise.all`, as `payload/collections/blog-post.ts` does
over `docs.map(...)`.

## Caching and Invalidation

A cache entry outlives the request that created it, and TTL expiry is the
fallback rather than the mechanism: freshness after an edit depends on the write
actively evicting what it made stale. `"use cache"` MUST therefore be paired with
an explicit `cacheLife(…)` call; the default lifetime is not safe to assume.
Repositories under `app/(app)/_/repositories/` use `cacheLife("hours")`, because
Payload `afterOperation` invalidates explicitly.

`"use cache"` MUST NOT be applied to a function reading `cookies()`, `headers()`,
request-specific `searchParams`, or any per-user state — the cached result would
be served to other users — nor to a function whose arguments make the cache key
unique per request.

A cache-invalidation `afterOperation` hook MUST be added alongside any new
collection that backs cached server reads; without one, admin edits leave stale
UI for up to a full cache lifetime. That hook MUST `fetch` the `posts/caches`
route handler rather than calling `revalidatePath(…)` directly — hooks may run in
a different process than Next.js. The route handler itself may call
`revalidatePath`, and should pass the `"page" | "layout"` scope argument. A
`revalidatePath` path argument MUST NOT be built from user input; that is a
cache-poisoning vector. A `route.ts` invalidation endpoint and its Payload hook
caller MUST be added together — they come in pairs.

`getWebEmbedMetadata` SHOULD stay on `cacheLife("hours")` and free of
request-varying inputs; the webembed cache exists to shield third-party metadata
hosts, which it only does while many requests share one key.

## Migrations

A migration runs against production data exactly once, and a dropped or renamed
column takes its data with it. A migration MUST be created when a change to
`payload/` alters the database schema — adding, removing, or renaming a field or
collection, or changing a field type. Hook, access-control, and admin-UI changes
alter no schema and need none.

A migration under `payload/migrations/` that drops a column or renames a field on
a collection holding production data MUST be paired with a data-backfill step,
and the change MUST be escalated to the maintainer rather than decided alone. The
release-splitting rule that governs such a change is in
[../decisions/2026-07-15-split-destructive-schema-changes-expand-then-contract.md](../decisions/2026-07-15-split-destructive-schema-changes-expand-then-contract.md).

An already-applied migration file MUST NOT be edited; create a new one instead.
The [README](../../README.md) records the migration commands.

## Generated Artifacts

Both generated Payload artifacts — `app/(payload)/admin/importMap.js` and
`payload/types.ts` — are committed, and neither is rewritten by `npm run build`.
The import map is regenerated at runtime only by the development server's hot
reload, so a stale one survives a restart and ships to production, where it
blanks the admin document edit view. CI's Payload Artifacts job regenerates both
and fails on any diff.

`npx payload generate:importmap` MUST be run after adding or upgrading a Payload
plugin, storage adapter, or custom admin component, and the result committed.
`npx payload generate:types` MUST be run after changing a collection, global, or
field, and the result committed.
