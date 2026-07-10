# Privacy and Exposure Control

Apply these rules when reviewing whether a change exposes content, identifiers, environment values, analytics properties, or error context beyond the intended audience.

## Public Content Boundaries

The public website may render published blog content, public website profile data, public media assets, metadata, and search/discovery files. Drafts, preview-only content, admin-only fields, secrets, and operational identifiers are not public just because the author controls the CMS.

**Guidelines:**

- MUST flag a Critical when draft or preview content can be reached from a public route without the Payload-authenticated draft/preview path.
- MUST flag a Critical when `sitemap.ts`, `robots.ts`, JSON-LD, Open Graph image routes, or `generateMetadata` can expose unpublished posts or private fields.
- MUST flag a Major when a public response exposes internal storage keys, database IDs, raw Payload documents, stack traces, or environment-derived values that are not required for the user-facing feature.
- SHOULD verify that public media exposure is intentional for `media`, `cover-images`, `avatar-images`, and Vercel Blob-backed assets.

## Client and Environment Exposure

Values sent to the browser are public. The `NEXT_PUBLIC_*` prefix is a release decision, not only a typing convenience.

**Guidelines:**

- MUST flag any newly exposed `NEXT_PUBLIC_*` value unless it is safe for every visitor to read.
- MUST flag a Critical when secrets, tokens, DSNs with auth tokens, admin emails, session values, or database URLs can reach client bundles, HTML, metadata, logs, or analytics payloads.
- MUST verify `process.env.*` access remains limited to the env-access files allowed by [secret-handling](./secret-handling.md).
- SHOULD ask for a narrower public value when a client component only needs a derived boolean or public identifier.

## Preview Environment Data Exposure

Per-PR preview deployments branch the production Turso database (see the project's development guidelines, preview-deployments rules, for the pipeline). A branch is a full copy of production content, so it also copies sensitive rows — `users` (including hashed passwords) and `payload-mcp-api-keys` — into a database served from a publicly reachable preview URL whose Payload admin and MCP endpoints are live.

**Guidelines:**

- MUST flag a Major when a change would route production `LIBSQL_*` credentials to a preview/branch deployment, or otherwise let a preview reach the production database.
- MUST require a distinct Preview `PAYLOAD_SECRET` (see [secret-handling](./secret-handling.md)) so preview session cookies and tokens cannot interoperate with production.
- SHOULD prefer a read-only branch token, or sanitizing `users` / `payload-mcp-api-keys` after branching, when a preview only needs to render the public site rather than exercise write flows.
- SHOULD verify the Preview Vercel Blob token does not point at the production blob store, so preview CMS writes cannot mutate production media.

## Analytics and Error Reporting Exposure

Sentry and Mixpanel are third-party data processors. Event context should be useful for debugging or analytics without carrying raw private content.

**Guidelines:**

- MUST flag a Major when Mixpanel events include draft content, markdown body text, private CMS fields, auth/session data, or high-cardinality user-entered values.
- MUST flag a Major when Sentry context includes secrets, raw request bodies, raw markdown, access tokens, or CMS draft content.
- MUST treat Sentry `sendDefaultPii: true` as a privacy-sensitive default and require explicit justification when adding identifiers to Sentry context.
- SHOULD prefer stable non-sensitive identifiers such as route names, slugs for published posts, feature names, and boolean state over raw content values.
