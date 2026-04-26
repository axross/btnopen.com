---
name: application-security-requirements
description: Use this skill when reviewing security implications of any code change in this Next.js + Payload CMS + Vercel project — secret and environment-variable handling (the `process.env` whitelist of `app/(app)/_/runtime.ts`, `payload/config.ts`, `next.config.ts`, `playwright.config.ts`; never committing `.env.local`; the `NEXT_PUBLIC_*` boundary), input validation at server actions / `route.ts` handlers / Payload `where` clauses (Zod-parsed view types from `app/(app)/_/repositories/payload-types.ts`, search-param coercion, slug bypass), Payload CMS access control (collection-level `access` rules, the draft-aware filter on `_status`, the public-read on `media` / `cover-images` / `avatar-images`), XSS in the markdown rendering pipeline (Shiki / Remark / `rehypeReact` chain, custom `webembed` directive, `allowDangerousProtocol`), SSRF in webembed and OG image fetching (`metascraper` fetching arbitrary URLs from CMS-authored content), Payload session/auth handling (the `users` collection's `lockTime` / `maxLoginAttempts`), the Sentry `sendDefaultPii: true` exposure, and supply-chain risks of newly added npm dependencies. This is the **reviewer's** lens — what to flag for security — and is the OWASP Top 10 framing applied to this specific stack. Use even when the user only says "is this safe", "any security concerns", or "look at this auth/admin/secret code".
---

# Application Security Requirements

Apply these rules when reviewing the security implications of any code change in this project. The framing is OWASP Top 10 mapped onto this project's specific stack — Next.js App Router, Payload CMS (SQLite/Turso, Vercel Blob), Remark/Shiki markdown, Vercel hosting, Sentry, Mixpanel.

## Secret and Environment-Variable Handling

See [secret-handling.md](./secret-handling.md) for what to verify:

- No literal secret committed (Payload secret, Sentry DSN with auth token, Vercel Blob token, Turso auth token, test user password)
- `process.env.*` accessed only inside the project's whitelisted env-access files
- `NEXT_PUBLIC_*` prefix used only for values intentionally exposed to the browser
- `.env.local` is gitignored; example only in `.env.example`

## Input Validation

See [input-validation.md](./input-validation.md) for what to verify:

- All `route.ts` handlers validate and coerce request inputs before passing them to Payload or `fetch`
- All `params` / `searchParams` are treated as untrusted (they reach the server as `Promise<unknown>`-shaped at runtime)
- Repository `where` clauses receive sanitized values (no array-coercion bypass on `slug`)
- Repository return values are parsed through the Zod schemas in `app/(app)/_/repositories/payload-types.ts` before reaching components

## Access Control

See [access-control.md](./access-control.md) for what to verify:

- Each Payload collection / global has an explicit `access` configuration appropriate for its data sensitivity
- Draft content is gated by the `_status: { equals: "published" }` filter when `draft` is not requested
- The `users` collection's auth lock settings are not weakened
- New `route.ts` mutation endpoints (e.g., the `/posts/caches` revalidation route) are protected against unauthenticated abuse

## XSS in Markdown Rendering

See [xss-in-markdown.md](./xss-in-markdown.md) for what to verify:

- The `remarkParse` `allowDangerousProtocol: true` setting in `app/(app)/_/helpers/markdown.ts` is acknowledged and any new HAST element mapping does not pass user-controlled URLs into `dangerouslySetInnerHTML` or unsanitized attributes
- Custom directive nodes (currently `webembed`) only emit attributes that React will encode
- New components added to the renderer's `defaultComponents` map encode untrusted children safely
- `rehypeReact` is not bypassed (no manual HAST-to-string interpolation that skips React's encoding)

## SSRF and Embed Fetching

See [ssrf-and-embeds.md](./ssrf-and-embeds.md) for what to verify:

- `getWebEmbedMetadata` (which `fetch`-es arbitrary URLs from CMS-authored content) does not let internal-network URLs through to production
- The `Image` component's `unoptimized` flag is not used when the URL is user-controlled and could point at internal hosts
- New CMS-author-controlled URLs that flow into a `fetch` call go through an allowlist or a hostname check
- New `images.remotePatterns` entries in `next.config.ts` are tightly scoped

## Auth and Session Management

See [auth-and-session.md](./auth-and-session.md) for what to verify:

- Payload's auth lockout settings (`lockTime`, `maxLoginAttempts` on the `users` collection) are not relaxed
- Live preview / draft state is reachable only through Payload's auth path, not via a query-string bypass
- Sentry `sendDefaultPii: true` exposure is acknowledged when adding new identifiers/contexts

## Supply Chain

See [supply-chain.md](./supply-chain.md) for what to verify:

- New npm dependencies justify their addition per [development-guidelines › change-management](../development-guidelines/change-management.md)
- New dependencies are reasonably popular, maintained, and platform-agnostic
- Lockfile is updated; transitive additions are inspected for known-vulnerable versions
- No `postinstall` / `prepare` script in a new dependency runs unexpected code
