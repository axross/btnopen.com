# Payload

Read this when changing a Payload collection, a repository that reads through
Payload, a route handler that mutates content, or anything touching drafts and
preview. Access control as a discipline belongs to the installed
application-security capability; query cost and caching as disciplines belong to
the installed Next.js capability. This document records how this repository
resolves both. What a reader or an author actually *sees* — the draft lifecycle,
the localized fields, the agentic view — is in
[../specs/blog-posts.md](../specs/blog-posts.md) and
[../specs/content-authoring.md](../specs/content-authoring.md).

## Collection Access Rules

Access rules are enforced at the data layer itself, so every route, handler, and
background job inherits whatever a collection's rules allow — a wrong rule is
wrong everywhere at once.

**Rules:**

- MUST give a new collection under `payload/collections/` an explicit `access`
  configuration. Payload's default (auth required) is safe but silent: a public
  content collection left on the default renders an empty route instead of
  failing loudly.
- MUST NOT set `access.read = () => true` on a collection holding non-public
  data. Only `media`, `cover-images`, and `avatar-images` are intentionally
  public-readable, as static assets.
- MUST keep `access.update`, `access.delete`, and `access.create` admin-only on a
  new collection rather than allowing all authenticated users.
- MUST have `access.read` consult `req.user` rather than returning `true`
  unconditionally — even a public collection should return a query filter
  excluding draft `_status` for unauthenticated requests.
- MUST justify, with an explicit comment, a **field-level** `access` rule that
  returns `() => true` on an admin-only field such as draft `_status`. The
  collection-level prohibition above is about the collection's own data; this is
  the narrower case of one field being opened up inside an otherwise-gated
  collection, and the comment is what separates a deliberate exposure from an
  oversight.
- MUST give a field-level `access` rule to a field holding a secret inside a
  collection whose documents are readable — the inverse case, closing a field
  rather than opening one. A collection's `read` rule is a **document** filter,
  not a field filter: `blog-posts` returns every field of every published post
  to an anonymous caller, so a secret added without one is published alongside
  the post it protects. `shareToken` is the worked example, and the shape it
  establishes is `read` consulting `req.user` with `create` and `update` both
  returning `false`, so no value a REST, GraphQL, or MCP caller sends is ever
  honoured and a server-side `beforeChange` hook owns the stored value alone.
- MUST NOT review or hand-edit files under `app/(payload)/`, with one exception:
  `app/(payload)/custom.scss` is this repository's hand-authored admin
  stylesheet and always has been. Payload generates and owns everything else in
  that segment, `app/(payload)/admin/importMap.js` included — that one is
  regenerated rather than edited, per Generated Artifacts below.

## Draft and Published Gating

Draft content is only as private as the least-guarded code path able to request
it, so the authentication check belongs before the flag is forwarded, not
somewhere downstream.

**Rules:**

- MUST verify the request is authenticated to view drafts before a repository
  function passes `draft: true` to `payload.find(…)`. Callers gate on
  `searchParams.draft === "true"` **and** rely on Payload's draft-API auth; both
  must be present.
- MUST include the `_status: { equals: "published" }` filter when `draft` is
  `false`. `get-blog-post.ts` and `get-blog-posts.ts` add it conditionally —
  diverging exposes draft slugs publicly.
- MUST NOT inject draft-only fields (`_status`, localized shadow fields) into a
  public response or OG metadata.
- MUST NOT let `?preview=true` unlock draft content on its own. In
  `posts/[slug]/page.tsx` it only selects whether `PayloadLivePreview` renders;
  the draft fetch still relies on Payload's draft-API authentication. A new
  `searchParams` flag that affects data visibility needs its own auth gate.

## Authentication and Sessions

Payload owns authentication in this project. Lockout settings are the only brake
on credential brute-forcing, and a weakened threshold looks like an innocuous
config tweak in a diff.

**Rules:**

- MUST NOT weaken `payload/collections/user.ts`'s auth settings: `lockTime` below
  `1000 * 60 * 5` (5 minutes), `maxLoginAttempts` above `5`, or the `auth: { … }`
  block removed entirely (Payload then defaults to no lockout).
- MUST NOT add a field to the `users` collection that stores a credential —
  credentials belong in environment variables, not the database. `users` records
  also carry email addresses and locked-out state, so `access.read` stays
  admin-only.
- MUST NOT read or write session cookies directly through `cookies()` from
  `next/headers`. Payload owns cookie management; bypassing it desynchronizes
  auth state. Derive identity from `req.user` on the `getPayload({ config })`
  context instead.
- MUST authenticate or origin-gate the caller in a new `route.ts` mutation
  handler (`POST`, `PUT`, `PATCH`, `DELETE`). All three `caches/route.ts`
  `DELETE` revalidation endpoints reject a cross-site caller through
  `isSameSiteRequest` — the Payload hook's same-process `fetch` carries no
  browser origin headers and so passes, while a browser-driven cross-site call
  does not. Their source comments record that a shared-secret header was deferred
  deliberately, on the grounds that the effect is an idempotent revalidation; an
  endpoint whose effect is not idempotent does not get to inherit that reasoning.

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

**Rules:**

- MUST set `select`, `depth`, `limit`, `where`, and — on content collections
  (`blog-posts`, `tags`, `users`) — `locale` on every `payload.find(…)` call.
- MUST NOT call `payload.find(…)` or `payload.findByID(…)` inside a loop over
  records. Use a single `where: { id: { in: [...ids] } }` query, or let `depth`
  populate the relationship in the original query.
- MUST pre-fetch in the parent and pass `Promise<T>` props rather than having
  each list item await its own fetch.
- MUST reuse one `getPayload({ config })` result per request scope rather than
  acquiring the client repeatedly, and MUST import `getPayload` from `payload` —
  the runtime singleton is process-global, so an alternative import breaks it.
- SHOULD give a query an explicit `sort` (such as `sort: ["-publishedAt"]`);
  unsorted queries return documents in insertion order, which is not stable
  across migrations.
- SHOULD state, when returning `result.docs` directly, whether
  `result.totalDocs > limit` can silently truncate — lift the limit, paginate, or
  document the intentional cap.
- SHOULD add `index: true` to a field used in a `where` filter, or document the
  expected row count; the SQLite adapter full-scans otherwise.
- SHOULD parallelize per-document work in a Payload `afterOperation` hook with
  `Promise.all`, as `payload/collections/blog-post.ts` does over `docs.map(...)`.

## Caching and Invalidation

A cache entry outlives the request that created it, and TTL expiry is the
fallback rather than the mechanism: freshness after an edit depends on the write
actively evicting what it made stale.

**Rules:**

- MUST pair `"use cache"` with an explicit `cacheLife(…)` call; the default
  lifetime is not safe to assume. Repositories under
  `app/(app)/_/repositories/` use `cacheLife("hours")`, because Payload
  `afterOperation` invalidates explicitly.
- MUST NOT apply `"use cache"` to a function reading `cookies()`, `headers()`,
  request-specific `searchParams`, or any per-user state — the cached result
  would be served to other users — nor to a function whose arguments make the
  cache key unique per request.
- MUST add a cache-invalidation `afterOperation` hook alongside any new
  collection that backs cached server reads; without one, admin edits leave stale
  UI for up to a full cache lifetime.
- MUST have that hook `fetch` the `posts/caches` route handler rather than
  calling `revalidatePath(…)` directly — hooks may run in a different process
  than Next.js. The route handler itself may call `revalidatePath`, and should
  pass the `"page" | "layout"` scope argument.
- MUST NOT build a `revalidatePath` path argument from user input; that is a
  cache-poisoning vector.
- MUST add a `route.ts` invalidation endpoint and its Payload hook caller
  together — they come in pairs.
- SHOULD keep `getWebEmbedMetadata` on `cacheLife("hours")` and free of
  request-varying inputs; the webembed cache exists to shield third-party
  metadata hosts, which it only does while many requests share one key.

## Migrations

A migration runs against production data exactly once, and a dropped or renamed
column takes its data with it.

**Rules:**

- MUST create a migration when a change to `payload/` alters the database schema
  — adding, removing, or renaming a field or collection, or changing a field
  type. Hook, access-control, and admin-UI changes alter no schema and need none.
- MUST pair a migration under `payload/migrations/` that drops a column or
  renames a field on a collection holding production data with a data-backfill
  step, and escalate the change to the maintainer rather than deciding it alone.
  The release-splitting rule that governs such a change is in
  [../decisions/2026-07-15-split-destructive-schema-changes-expand-then-contract.md](../decisions/2026-07-15-split-destructive-schema-changes-expand-then-contract.md).
- MUST NOT edit an already-applied migration file; create a new one instead. The
  [README](../../README.md) records the migration commands.

## Generated Artifacts

Both generated Payload artifacts — `app/(payload)/admin/importMap.js` and
`payload/types.ts` — are committed, and neither is rewritten by `npm run build`.
The import map is regenerated at runtime only by the development server's hot
reload, so a stale one survives a restart and ships to production, where it
blanks the admin document edit view. CI's Payload Artifacts job regenerates both
and fails on any diff.

**Rules:**

- MUST run `npx payload generate:importmap` after adding or upgrading a Payload
  plugin, storage adapter, or custom admin component, and commit the result.
- MUST run `npx payload generate:types` after changing a collection, global, or
  field, and commit the result.
