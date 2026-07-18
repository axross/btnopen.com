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

Per-PR preview deployments run on a fresh, empty Turso database seeded from the repository's own fixtures, and write media to a dedicated preview Blob store (see the project's development guidelines, preview-deployments rules, for the pipeline). By construction a preview holds no production content — no production `users`, `payload-mcp-api-keys`, or blog data — even though its Payload admin and MCP endpoints are live on a publicly reachable URL. The exposure to guard is therefore a regression that reintroduces production data or credentials into a preview, not the steady state.

**Guidelines:**

- MUST flag a Major when a change would route production `LIBSQL_*` credentials to a preview deployment, branch or copy the production database into a preview, or otherwise let a preview reach the production database.
- MUST flag a Major when a change would point a preview's `BLOB_PAYLOAD_READ_WRITE_TOKEN` at the production Blob store, so preview CMS writes cannot mutate or read production media.
- MUST require a distinct Preview `PAYLOAD_SECRET` (see [secret-handling](./secret-handling.md)) so preview session cookies and tokens cannot interoperate with production.
- MUST treat the `PAYLOAD_TEST_USER_*` seed credentials as Preview-only: a public preview intentionally exposes a known throwaway admin login, but those variables set in Production would seed a real admin user — flag a Major if they can reach Production.
- SHOULD verify preview media stays namespaced under the per-PR `pr-<n>/` prefix and is pruned on teardown, so one preview cannot read or clobber another's uploads within the shared preview store.

## Analytics and Error Reporting Exposure

Sentry and Mixpanel are third-party data processors. Event context should be useful for debugging or analytics without carrying raw private content.

**Guidelines:**

- MUST flag a Major when Mixpanel events include draft content, markdown body text, private CMS fields, auth/session data, or high-cardinality user-entered values.
- MUST flag a Major when Sentry context includes secrets, raw request bodies, raw markdown, access tokens, or CMS draft content.
- MUST treat Sentry `sendDefaultPii: true` as a privacy-sensitive default and require explicit justification when adding identifiers to Sentry context.
- SHOULD prefer stable non-sensitive identifiers such as route names, slugs for published posts, feature names, and boolean state over raw content values.
