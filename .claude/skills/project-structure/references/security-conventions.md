# Security Conventions

Apply this reference when touching environment access, an outbound fetch, a route handler's input, or an upload. The OWASP-level discipline belongs to the application security capability; this records where each of those surfaces actually lives in this repository and what already guards it.

## Environment Access

Values reach the browser or the server through exactly one barrel, so a review only has to look in one place to know what is exposed. The table below is the complete set of files that read `process.env` outside a Biome override — every one of them carries a directive naming its reason.

| File | Why it may read `process.env` |
| --- | --- |
| `app/(app)/_/runtime.ts` | The app realm's sanctioned barrel, exporting `urlOrigin`, `vercelEnvironment`, `sentryDsn`, `mixpanelToken`, and friends |
| `payload/helpers/runtime.ts` | The Payload realm's counterpart, exporting `urlOrigin` and `vercelBlobToken`. It exists so the realm never imports `app/`, and resolves the origin through the same `shared/url-origin.ts` the app barrel uses |
| `payload/config.ts` | The Payload realm needs database and storage credentials at build time |
| `next.config.ts` | Config-time access to `CI`, `SENTRY_ORG`, `SENTRY_PROJECT` |
| `playwright.config.ts` | Test config-time access to `CI`, `PLAYWRIGHT_BASE_URL`, `VERCEL_AUTOMATION_BYPASS_SECRET` |
| `app/(app)/_/components/markdown.tsx` | The one sanctioned `NODE_ENV` check in application code — see below |
| `e2e/helpers/api/auth.ts`, `e2e/helpers/api/mcp.ts`, `e2e/tests/routes/posts/comments.test.ts` | Test credentials and env-driven gates, reaching the real environment on purpose |

**`markdown.tsx` is the one component in that table, and it is deliberate.** It compares `process.env.NODE_ENV` to `"development"` to decide whether to `await import("react/jsx-dev-runtime")`. Routing that through `runtime.ts` would defeat the branch: bundlers prune the dev-only import by substituting the literal and eliminating dead code, which requires the comparison to be statically visible at the call site. An imported boolean is opaque to that pass, so the dev runtime would ship to production. This is why the rule below is scoped to *runtime configuration* rather than to `process.env` as a token.

**Guidelines:**

- MUST read runtime configuration through `app/(app)/_/runtime.ts` from any component, repository, helper, or route handler, and through `payload/helpers/runtime.ts` from anything inside `payload/`.
- MAY compare `process.env.NODE_ENV` inline where a bundler must see the literal to eliminate a branch, as `app/(app)/_/components/markdown.tsx` does. This is the only exemption to the rule above; it does not extend to any other variable, since `NODE_ENV` alone is build-time-substituted rather than deployment configuration.
- MUST carry a `// biome-ignore lint/style/noProcessEnv:` directive with a reason on any sanctioned direct `process.env` access. That comment — not a config whitelist — is what exempts every file in the table above, and it is the marker a review looks for.
- MUST NOT rely on lint to catch a stray `process.env`. `biome.jsonc` sets `noProcessEnv` to `warn`, and its `off` overrides cover only `*.config.js`, `*.config.cjs`, `e2e/reporters/*.ts`, `e2e/check-scenario-coverage.mjs`, and `scripts/*.mjs` — none of the files above. An unsanctioned access therefore surfaces as a warning while `npm run lint` still exits successfully.
- MUST NOT add a `biome.jsonc` override to exempt application code from `noProcessEnv`; the directive-per-site rule is what keeps the sanctioned set enumerable.
- MUST NOT assign a `PAYLOAD_SECRET` literal outside `payload/config.ts`, and MUST NOT write a `PAYLOAD_TEST_USER_PASSWORD` literal anywhere but `.env.example`.
- MUST treat a new `NEXT_PUBLIC_*` variable as a publication decision, not a typing convenience — everything prefixed ships to every visitor. Prefer exposing a derived boolean or public identifier over the underlying value.
- MUST NOT read `CLERK_SECRET_KEY` from anywhere in this repository, and MUST NOT add it to a `runtime.ts` barrel to "complete" the pair. `@clerk/nextjs` reads it from the environment itself; only its public counterpart passes through `app/(app)/_/runtime.ts`, as `clerkPublishableKey`. A file here reading the secret is a finding, not the missing half of a convention.

## Outbound Fetch and SSRF

`app/(app)/_/repositories/get-webembed-metadata.ts` performs an unauthenticated `fetch(url)` where the URL originates from a CMS-authored markdown link. That is the principal SSRF surface here, and `URL.canParse(href)` inside `remarkEmbeds` (in `app/(app)/_/helpers/markdown.ts`) is currently the only filter keeping malformed URLs out of it.

**Why the two avatar hosts are whole-origin.** `https://img.clerk.com/**` and `https://avatars.githubusercontent.com/**` are the one `images.remotePatterns` pair without a path scope, and the reason is that no path scope is pinnable rather than that none was attempted. A comment row stores Clerk's `imageUrl` verbatim and renders it through `next/image`, so the pattern gates a string this repository never constructs or parses. Clerk's image-optimization guide documents the query parameters for `img.clerk.com` and not its path structure, so any prefix would be pinned to an undocumented, vendor-controlled shape that can change without a release note — and a mismatch surfaces as a broken avatar at runtime, not as a build failure. Nothing here produces an `avatars.githubusercontent.com` URL either: that entry exists to accept a Clerk-returned URL pointing at GitHub's host, and the e2e avatar fixtures are local. Narrow them once Clerk documents a stable prefix, or once this repository constructs the URL itself.

**Guidelines:**

- MUST NOT remove the `URL.canParse(href)` validation in `remarkEmbeds` without replacing it with a stricter check.
- MUST keep every `next.config.ts` `images.remotePatterns` entry scoped to a single origin, and prefer a path scope within it. Of the four existing entries, `http://localhost:3000/api/**` and `https://cdn.hashnode.com/res/hashnode/**` are the pattern to copy; the two avatar hosts are whole-origin for the reason above, and MUST NOT be narrowed on the strength of an observed URL. A wildcard hostname (`**`) is never acceptable.
- MUST NOT let an OG image route (`thumbnail.png`, or a future `route.tsx`) accept a `src` query parameter that flows into `fetch(src)` without an allowlist; this is the canonical Next.js OG-image SSRF shape.
- MUST keep `sitemap.ts` and `robots.ts` fetching only Payload data through the repository layer, never an unbounded fetch to a CMS-controlled URL.
- MUST check `Origin` or `Sec-Fetch-Site` on a `route.ts` mutation handler, through `isSameSiteRequest` from `app/(app)/_/helpers/request-origin.ts`. Even an idempotent endpoint such as `posts/caches` `DELETE` can be abused — here, to flush caches.
- MUST additionally carry a double-submit token on a mutation handler that acts on an authenticated user's behalf, as `app/(app)/_/helpers/comment-csrf.ts` does for the comment write path. That helper is this repository's worked CSRF example: `GET .../comments/token` mints a token, returns it in the body, and pins it in an `HttpOnly`, `SameSite=Strict` cookie; the `POST` handler accepts the write only when the header matches the cookie, compared in constant time. Reuse it rather than writing a second token scheme.
- MUST NOT treat `app/(payload)/` as in scope for this lens; the Payload admin routes own their own CSRF and request validation.

## Input Validation

Everything crossing into the app from a URL, a request body, or an upload is attacker-controlled until something proves otherwise, and the proof has to run before the value is used rather than after.

**Guidelines:**

- MUST compare a `searchParams` flag by value, not truthiness — `params.draft === "true"`, as `app/(app)/(index)/page.tsx` and `app/(app)/posts/[slug]/page.tsx` do. A truthy check treats `?draft=false` as enabled.
- MUST do that comparison at the route boundary rather than in the data layer. `app/(app)/_/repositories/get-blog-post.ts` takes `draft` as an already-parsed `boolean`, so a repository re-parsing a query string is a sign the boundary leaked.
- MUST validate `request.json()`, `request.formData()`, or `request.url` in a `route.ts` handler with a Zod schema or equivalent runtime check before use. `CommentSubmission` from `shared/comments.ts`, parsed in the comment write path, is the worked example — it is what bounds the only body a member of the public can send this application.
- MUST parse Payload documents through the matching schema in `shared/payload-types.ts` before returning them from a route handler or server action; returning them directly leaks fields the consumer never requested, including draft-only ones.
- MUST validate attribute values in a new custom MDAST directive, as `remarkEmbeds` does with `URL.canParse(href)`.
- MUST sanitize uploaded filenames in a new upload collection by adding `createUploadFilenameHook(<collection label>)` from `payload/helpers/upload-filename.ts` to its `beforeOperation` hooks. It rewrites `req.file.name` to `${uuid}.${ext}`; reuse it rather than copying the body, so the sanitization keeps one definition to audit.

## Dependencies

A package excluded from the bundler keeps running from `node_modules` at runtime, so the list is a standing exception rather than a preference.

**Guidelines:**

- MUST justify a new entry in `next.config.ts` `serverExternalPackages`. The existing entries — `re2`, `pino`, `pino-pretty` — are there because they are native or stream-based and incompatible with Next's bundler; the list should stay minimal.
- MUST NOT prune an entry merely because no file imports it. `re2` is declared nowhere in `package.json` and imported nowhere in this repository, yet removing it fails `npm run build` with `non-ecmascript placeable asset`: it is a native binding reached transitively through `@metascraper/helpers` → `metascraper-title` → `app/(app)/_/repositories/get-webembed-metadata.ts`. Trace an entry's provenance through the lockfile before concluding it is dead.
