---
name: application-security-requirements
description: The security and privacy review lens for changes in this Next.js + Payload CMS + Vercel project. Covers secrets/env vars, the `NEXT_PUBLIC_*` boundary, input validation, Payload access control and drafts, public exposure, preview deployment data exposure, markdown XSS, SSRF/webembed/OG fetching, auth/session settings, Sentry/Mixpanel data capture, and npm dependency supply-chain risk.
when_to_use: Use when reviewing security or privacy implications of a change — "is this safe", "security", "auth", "admin", "secret", "privacy", "PII", "XSS", "SSRF", "preview deployment", or dependency reviews. This is the security lens code review delegates to; for the general review method/severity/reporting, use code-review-guideline.
user-invocable: false
---

# Application Security Requirements

Apply these rules when reviewing the security implications of any code change in this project. The framing is OWASP Top 10 mapped onto this project's specific stack — Next.js App Router, Payload CMS (SQLite/Turso, Vercel Blob), Remark/Shiki markdown, Vercel hosting, Sentry, Mixpanel.

## Secret and Environment-Variable Handling

See [secret-handling.md](./references/secret-handling.md) for:

- No literal secret committed (Payload secret, Sentry DSN with auth token, Vercel Blob token, Turso auth token, test user password)
- `process.env.*` accessed only inside the project's whitelisted env-access files
- `NEXT_PUBLIC_*` prefix used only for values intentionally exposed to the browser
- `.env.local` is gitignored; example only in `.env.example`

## Input Validation

See [input-validation.md](./references/input-validation.md) for:

- All `route.ts` handlers validate and coerce request inputs before passing them to Payload or an outbound `fetch`
- All `params` / `searchParams` are treated as untrusted (their static types do not guarantee their runtime shape)
- Repository `where` clauses receive sanitized values (no array-coercion bypass on `slug`)
- Repository return values are parsed through the Zod schemas in `app/(app)/_/repositories/payload-types.ts` before reaching components

## Access Control

See [access-control.md](./references/access-control.md) for:

- Each Payload collection / global has an explicit `access` configuration appropriate for its data sensitivity
- Draft content is gated by the `_status: { equals: "published" }` filter when `draft` is not requested
- The `users` collection's auth lockout / rate-limit settings are not weakened
- New `route.ts` mutation endpoints are protected against unauthenticated abuse

## Privacy and Exposure Control

See [privacy-and-exposure.md](./references/privacy-and-exposure.md) for:

- Draft, preview, admin-only, and unpublished content cannot leak through public routes, metadata, JSON-LD, sitemap, robots, or image routes
- Public media URLs expose only intentionally public assets and do not reveal private storage tokens or internal identifiers
- Sentry and Mixpanel changes do not capture unnecessary PII, secrets, draft content, or CMS-authored private fields
- Client-exposed environment variables, analytics event properties, and error context are intentionally public
- Preview deployments run on a fresh seeded database and a dedicated media store, receiving no production credentials or data; the risk to guard is a regression that reintroduces production data or credentials into a publicly reachable preview

## XSS in Markdown Rendering

See [xss-in-markdown.md](./references/xss-in-markdown.md) for:

- The markdown pipeline's rendering of CMS-authored content does not pass user-controlled values into `dangerouslySetInnerHTML` or unsanitized attributes
- Dangerous URL protocols (e.g., `javascript:`) are neutralized before reaching a rendered attribute
- Custom directive nodes (currently `embed`) only emit attributes that React will encode
- `rehypeReact` is not bypassed (no manual string interpolation of untrusted content into markup)

## SSRF and Embed Fetching

See [ssrf-and-embeds.md](./references/ssrf-and-embeds.md) for:

- `getWebEmbedMetadata` (which `fetch`-es arbitrary URLs from CMS-authored content) cannot be steered at internal-network hosts in production
- The `Image` component's `unoptimized` flag is not used when the URL is user-controlled and could point at internal hosts
- New CMS-author-controlled URLs that flow into a `fetch` call go through an allowlist or a hostname check
- New `images.remotePatterns` entries in `next.config.ts` are tightly scoped

## Auth and Session Management

See [auth-and-session.md](./references/auth-and-session.md) for:

- Payload's auth lockout settings (`lockTime`, `maxLoginAttempts` on the `users` collection) are not relaxed
- Live preview / draft state is reachable only via Payload's authentication path, not via a query-string bypass
- Sentry `sendDefaultPii: true` exposure is acknowledged when adding new identifiers/contexts

## Supply Chain

See [supply-chain.md](./references/supply-chain.md) for:

- New npm dependencies justify their addition per the project's development guidelines (change-management rules)
- New dependencies are reasonably popular, maintained, and platform-agnostic
- Lockfile is updated; transitive additions are inspected for known-vulnerable versions
- No `postinstall` / `prepare` script in a new dependency runs unexpected code
