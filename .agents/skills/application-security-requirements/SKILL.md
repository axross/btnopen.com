---
name: application-security-requirements
description: Use this skill when reviewing security or privacy implications in this Next.js + Payload CMS + Vercel project. Covers secrets/env vars, `NEXT_PUBLIC_*`, input validation, Payload access control and drafts, public exposure, markdown XSS, SSRF/webembed/OG fetching, auth/session settings, Sentry/Mixpanel data capture, and npm supply-chain risk. Use for "is this safe", "security", "auth", "admin", "secret", "privacy", "PII", "XSS", "SSRF", or dependency reviews.
---

# Application Security Requirements

Apply these rules when reviewing the security implications of any code change in this project. The framing is OWASP Top 10 mapped onto this project's specific stack — Next.js App Router, Payload CMS (SQLite/Turso, Vercel Blob), Remark/Shiki markdown, Vercel hosting, Sentry, Mixpanel.

## Secret and Environment-Variable Handling

See [secret-handling.md](./secret-handling.md) for what to verify:

- No literal secret committed (Payload secret, Sentry DSN with auth token, Vercel Blob token, Turso auth token, test user password)
- `process.env.*` accessed only inside the project's whitelisted env-access files
- `NEXT_PUBLIC_*` prefix used only for values intentionally exposed to the browser
- `.env.local` is gitignored; example only in `.env.example`

**Guidelines:**

- SHOULD read the linked reference when work touches this topic.

## Input Validation

See [input-validation.md](./input-validation.md) for what to verify:

- All `route.ts` handlers validate and coerce request inputs before passing them to Payload or `fetch`
- All `params` / `searchParams` are treated as untrusted (they reach the server as `Promise<unknown>`-shaped at runtime)
- Repository `where` clauses receive sanitized values (no array-coercion bypass on `slug`)
- Repository return values are parsed through the Zod schemas in `app/(app)/_/repositories/payload-types.ts` before reaching components

**Guidelines:**

- SHOULD read the linked reference when work touches this topic.

## Access Control

See [access-control.md](./access-control.md) for what to verify:

- Each Payload collection / global has an explicit `access` configuration appropriate for its data sensitivity
- Draft content is gated by the `_status: { equals: "published" }` filter when `draft` is not requested
- The `users` collection's auth lock settings are not weakened
- New `route.ts` mutation endpoints (e.g., the `/posts/caches` revalidation route) are protected against unauthenticated abuse

**Guidelines:**

- SHOULD read the linked reference when work touches this topic.

## Privacy and Exposure Control

See [privacy-and-exposure.md](./privacy-and-exposure.md) for what to verify:

- Draft, preview, admin-only, and unpublished content cannot leak through public routes, metadata, JSON-LD, sitemap, robots, or image routes
- Public media URLs expose only intentionally public assets and do not reveal private storage tokens or internal identifiers
- Sentry and Mixpanel changes do not capture unnecessary PII, secrets, draft content, or CMS-authored private fields
- Client-exposed environment variables, analytics event properties, and error context are intentionally public

**Guidelines:**

- SHOULD read the linked reference when work touches this topic.

## XSS in Markdown Rendering

See [xss-in-markdown.md](./xss-in-markdown.md) for what to verify:

- The `remarkParse` `allowDangerousProtocol: true` setting in `app/(app)/_/helpers/markdown.ts` is acknowledged and any new HAST element mapping does not pass user-controlled URLs into `dangerouslySetInnerHTML` or unsanitized attributes
- Custom directive nodes (currently `webembed`) only emit attributes that React will encode
- New components added to the renderer's `defaultComponents` map encode untrusted children safely
- `rehypeReact` is not bypassed (no manual HAST-to-string interpolation that skips React's encoding)

**Guidelines:**

- SHOULD read the linked reference when work touches this topic.

## SSRF and Embed Fetching

See [ssrf-and-embeds.md](./ssrf-and-embeds.md) for what to verify:

- `getWebEmbedMetadata` (which `fetch`-es arbitrary URLs from CMS-authored content) does not let internal-network URLs through to production
- The `Image` component's `unoptimized` flag is not used when the URL is user-controlled and could point at internal hosts
- New CMS-author-controlled URLs that flow into a `fetch` call go through an allowlist or a hostname check
- New `images.remotePatterns` entries in `next.config.ts` are tightly scoped

**Guidelines:**

- SHOULD read the linked reference when work touches this topic.

## Auth and Session Management

See [auth-and-session.md](./auth-and-session.md) for what to verify:

- Payload's auth lockout settings (`lockTime`, `maxLoginAttempts` on the `users` collection) are not relaxed
- Live preview / draft state is reachable only through Payload's auth path, not via a query-string bypass
- Sentry `sendDefaultPii: true` exposure is acknowledged when adding new identifiers/contexts

**Guidelines:**

- SHOULD read the linked reference when work touches this topic.

## Supply Chain

See [supply-chain.md](./supply-chain.md) for what to verify:

- New npm dependencies justify their addition per [development-guidelines › change-management](../development-guidelines/change-management.md)
- New dependencies are reasonably popular, maintained, and platform-agnostic
- Lockfile is updated; transitive additions are inspected for known-vulnerable versions
- No `postinstall` / `prepare` script in a new dependency runs unexpected code

**Guidelines:**

- SHOULD read the linked reference when work touches this topic.
