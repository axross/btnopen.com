# Access Control

Apply these rules to verify Payload CMS access rules and Next.js route handlers gate sensitive data correctly.

## Payload Collection `access` Rules

- MUST flag a Critical when a new Payload collection is added under `payload/collections/` without an explicit `access` configuration. The default Payload behavior (auth required) is safe, but a missing-by-omission rule on a public collection (e.g., a content collection that should be readable by anonymous browsers) means the rendered route returns empty.
- MUST flag a Critical when an existing collection's `access.read = () => true` is added to a collection that contains non-public data (anything other than `media`, `cover-images`, `avatar-images`, which are intentionally public-readable as static assets).
- MUST flag a Major when a new collection's `access.update`, `access.delete`, or `access.create` defaults to allowing all authenticated users — these should typically be admin-only.
- MUST flag a Major when a collection's `access.read` function ignores `req.user` and returns `true` unconditionally — even public collections SHOULD return a query filter that excludes draft `_status` for non-authenticated requests.

## Draft / Published Gating

- MUST flag a Critical when a repository function accepts a `draft: boolean` parameter and passes `draft: true` to `payload.find(…)` without first verifying the request is authenticated to view drafts. Current callers gate on `searchParams.draft === "true"` AND rely on Payload's draft-API auth — confirm both are present.
- MUST flag a Critical when a repository function omits the `_status: { equals: "published" }` filter when `draft` is `false`. The current pattern in `get-blog-post.ts` and `get-blog-posts.ts` adds the filter conditionally — diverging exposes draft slugs publicly.
- MUST flag a Critical when a server-side render injects draft-only fields (e.g., `_status`, `_localized` shadow fields) into a public response or OG metadata.

## Auth Settings on `users`

- MUST flag a Critical when the diff weakens `app/payload/collections/user.ts`'s auth settings:
  - `lockTime` reduced below 5 minutes
  - `maxLoginAttempts` raised above 5
  - `auth: { … }` block removed entirely (Payload defaults to no lockout)

## Route Handler Authentication

- MUST flag a Critical when a new `route.ts` mutation handler (`POST`, `PUT`, `PATCH`, `DELETE`) does not verify the caller's identity. The current `posts/caches/route.ts` is a `DELETE` revalidation endpoint that is unauthenticated — the reviewer SHOULD note that even cache-busting endpoints can be abused for DoS and recommend either rate-limiting or a shared-secret header for new ones.
- MUST flag a Major when a new server action or route handler reads from a Payload collection with sensitive access rules but does not pass a `req.user`-scoped Payload context.

## Live Preview / Preview Mode

- MUST flag a Critical when a new route uses `?preview=true` to bypass production gating without also requiring `?draft=true` and Payload auth. The existing `posts/[slug]/page.tsx` checks `preview === "true"` only to render the `PayloadLivePreview` component — preview mode does not itself unlock draft content.
- MUST flag a Major when a new route reads `cookies()` or `headers()` to derive auth state without going through Payload — Payload owns sessions in this project.

## Admin UI Surface

- MUST NOT review files under `app/(payload)/` per [code-review-guideline › scoping](../code-review-guideline/scoping.md). Payload owns that route segment.
- MUST flag a Critical when a Payload collection field is added with `admin.hidden: true` to "hide" sensitive data from the admin UI — `hidden` is a UI affordance, not access control. Use `access.read` to actually gate the field.
