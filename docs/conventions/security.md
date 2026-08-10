# Security

Read this when touching environment access, an outbound fetch, a route handler's
input, an upload, or a `uses:` entry in a GitHub Actions workflow. The OWASP-level
discipline belongs to the installed application-security capability; this
document records where each of those surfaces actually lives in this repository
and what already guards it.

## Environment Access

Each realm — the app under `app/`, Payload under `payload/` — reads runtime
configuration through one barrel: `app/(app)/_/runtime.ts` for the app,
`payload/helpers/runtime.ts` for Payload. A value belongs in its realm's barrel
however few modules consume it, and `clerkPublishableKey` — which has no
consumer outside `app/(app)/_/runtime.ts` at all — still lives there.

Two files inside those realms read `process.env` directly anyway. Each is an
exception bounded to a named list of variables rather than to the whole file:
`app/(app)/_/components/markdown.tsx` for `NODE_ENV`, and `payload/config.ts`
for the six the table names. The root `next.config.ts` and
`playwright.config.ts` and the modules under `e2e/` read directly for a
different reason — they have no barrel to read through — so they appear in the
table as well.

A deployment build needs all six of the values `payload/config.ts` reads, not
only the running server: that build reads the real database, rendering
`/sitemap.xml` and running the `onInit` seed against it. Both deploy pipelines
make the six available to the `vercel build` step;
[production-deployment.md](../operations/production-deployment.md) and
[preview-deployment.md](../operations/preview-deployment.md) make that a MUST
and own where each value comes from. None of the six is required for
`payload/config.ts` to resolve, though: `PAYLOAD_SECRET` falls back to
`"local"`, the two libSQL values to a local SQLite file, `BLOB_PAYLOAD_PREFIX`
to `""`, and the seed runs only when both `PAYLOAD_TEST_USER_*` values are set.
What a deployment build needs is their real values, not their presence. The six
are read at run time as well, since every server process that imports
`payload/config.ts` evaluates the same module.

Those six stay direct because nothing else in the Payload realm reads them:
routing them through the barrel would add six exports with one caller each.
Reader count is the history behind the list rather than a test to apply — the
list is closed at these six, and a seventh direct read here belongs in the
barrel whatever its reader count. `vercelBlobToken` is the value that went the
other way: `payload/config.ts` and `payload/helpers/image.ts` both read it, so
it lives in `payload/helpers/runtime.ts` and both import it from there.

The table below is the complete set of source files Biome lints that read
`process.env` outside an override — every one of them carries a directive naming
its reason. To check what a realm reads from the environment, look in two
places: that realm's barrel, and that realm's rows here.

| File | Why it may read `process.env` |
| --- | --- |
| `app/(app)/_/runtime.ts` | The app realm's sanctioned barrel, and the authoritative list of its own exports — `urlOrigin`, `vercelEnvironment`, `sentryDsn`, and `mixpanelToken` are four examples, not the whole set |
| `payload/helpers/runtime.ts` | The Payload realm's counterpart, exporting `urlOrigin` and `vercelBlobToken`. It exists so the realm never imports `app/`, and resolves the origin through the same `shared/url-origin.ts` the app barrel uses |
| `payload/config.ts` | `PAYLOAD_SECRET`, `LIBSQL_PAYLOAD_TURSO_DATABASE_URL`, `LIBSQL_PAYLOAD_TURSO_AUTH_TOKEN`, `BLOB_PAYLOAD_PREFIX`, `PAYLOAD_TEST_USER_EMAIL`, and `PAYLOAD_TEST_USER_PASSWORD` — the closed list a deployment build needs, read nowhere else in the Payload realm |
| `next.config.ts` | Config-time access to `CI`, `SENTRY_ORG`, `SENTRY_PROJECT`, `DEPLOYMENT_ID`, and `NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA` |
| `playwright.config.ts` | Test config-time access to `CI`, `PLAYWRIGHT_BASE_URL`, `PLAYWRIGHT_SERVER_MODE`, and `VERCEL_AUTOMATION_BYPASS_SECRET` |
| `app/(app)/_/components/markdown.tsx` | `NODE_ENV`, which no other source file reads — see below |
| `e2e/helpers/api/auth.ts`, `e2e/helpers/api/mcp.ts`, `e2e/tests/routes/posts/comments.test.ts` | Test credentials and env-driven gates, reaching the real environment on purpose |
| `e2e/helpers/api/clerk.ts` | The `+clerk_test` reader identity (`TEST_CLERK_READER_EMAIL`) the Clerk-authenticated comment tests sign in as; unset skips them rather than substituting an account |
| `e2e/global-setup.ts` | The Clerk availability gate (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`), read once before the suite runs so a credential-less run skips Clerk setup and stays green |

**`markdown.tsx` is the one component in that table, and it is deliberate.** It
compares `process.env.NODE_ENV` to `"development"` to decide whether to
`await import("react/jsx-dev-runtime")`. Routing that through `runtime.ts` would
defeat the branch: bundlers prune the dev-only import by substituting the literal
and eliminating dead code, which requires the comparison to be statically visible
at the call site. An imported boolean is opaque to that pass, so the dev runtime
would ship to production. That static-visibility requirement is why the rule
below is scoped to *runtime configuration* rather than to `process.env` as a
token.

**Rules:**

- MUST read runtime configuration through `app/(app)/_/runtime.ts` from any
  component, repository, helper, or route handler, and through
  `payload/helpers/runtime.ts` from anything inside `payload/`. Two exceptions
  stand, each bounded to the variables the table names for it. The six
  `payload/config.ts` reads are one, so a seventh direct read there belongs in
  the barrel like any other. The inline `process.env.NODE_ENV` comparison a
  bundler must see literally to eliminate a branch, as
  `app/(app)/_/components/markdown.tsx` has, is the other; it reaches `NODE_ENV`
  and no further variable, because it is build-time substitution rather than
  deployment configuration.
- MUST carry a `noProcessEnv` suppression with a reason on any sanctioned direct
  `process.env` access, in whichever of Biome's three forms fits the site: a
  single-line `// biome-ignore lint/style/noProcessEnv:` above one access, as
  `app/(app)/_/components/markdown.tsx` has; a file-wide
  `// biome-ignore-all lint/style/noProcessEnv:`, as both barrels have; or a
  `// biome-ignore-start` / `// biome-ignore-end` pair around a block, as
  `payload/config.ts` has. Whichever form is used — not a config whitelist — is
  what exempts every file in the table above, and it is the marker a review
  looks for.
- MUST keep `noProcessEnv` at `"error"` in `biome.jsonc`, so an unsanctioned
  access fails `npm run lint` instead of scrolling past as a warning. That
  severity is what makes the rule above literal rather than aspirational: every
  file in the table passes on its directive alone, and deleting one fails the
  check. The `off` overrides cover only `*.config.js`, `*.config.cjs`,
  `e2e/reporters/*.ts`, `e2e/check-scenario-coverage.mjs`, and `scripts/*.mjs` —
  no file in the table above.
- MUST NOT add a `biome.jsonc` override that exempts a file under `app/`,
  `payload/`, or `shared/` from `noProcessEnv`; the directive-per-site rule is
  what keeps the sanctioned set enumerable.
- MUST NOT assign a `PAYLOAD_SECRET` literal outside `payload/config.ts`, and
  MUST NOT write a `PAYLOAD_TEST_USER_PASSWORD` literal anywhere but
  `.env.example`.
- MUST treat a new `NEXT_PUBLIC_*` variable as a publication decision, not a
  typing convenience — everything prefixed ships to every visitor. Prefer exposing
  a derived boolean or public identifier over the underlying value.
- MUST NOT read `CLERK_SECRET_KEY` from anywhere in this repository, and MUST NOT
  add it to a `runtime.ts` barrel to "complete" the pair. `@clerk/nextjs` reads it
  from the environment itself; only its public counterpart passes through
  `app/(app)/_/runtime.ts`, as `clerkPublishableKey`. A file here reading the
  secret is a finding, not the missing half of a convention.

## Outbound Fetch and SSRF

`app/(app)/_/repositories/get-webembed-metadata.ts` performs an unauthenticated
fetch where the URL originates from a CMS-authored markdown link. That is the
principal SSRF surface here, and it is guarded in two paired modules rather than
by any filter upstream of it.

`assertFetchableUrl` in `app/(app)/_/repositories/webembed-host.ts` refuses
anything that is not `http:`/`https:`, refuses a `*.internal` hostname without
resolving it, then resolves the host through the OS resolver and refuses the fetch
when **any** resolved address falls in a reserved range — loopback, private,
link-local (including `169.254.169.254`), unique-local, CGNAT, benchmarking,
multicast, and the IPv6 NAT64 and 6to4 ranges, whose embedded IPv4 address
`net.BlockList` does not unwrap on its own. `fetchPermittedUrl` in
`webembed-fetch.ts` fetches with `redirect: "manual"` and runs that same guard
against every `Location` before the next request leaves, bounded at
`maxRedirectHops`. The deployment's own `urlOrigin` is the single permitted
exception, with no environment branch: locally that is a loopback origin, and on
preview and production it is a public host the range check would pass anyway.

**What the guard does not close.** The address is validated by this resolver and
then `fetch` resolves the name again to open the connection, so a name whose
records change between those two moments can still land on a private address.
Closing that needs the socket pinned to the validated IP, which needs an `undici`
dispatcher and therefore a new dependency; it was weighed and deliberately left
out in [#220](https://github.com/axross/btnopen.com/issues/220). Treat the guard
as the standard mitigation for this class, not a complete one — and do not report
the gap as an oversight.

**Why the two avatar hosts are whole-origin.** `https://img.clerk.com/**` and
`https://avatars.githubusercontent.com/**` are the one `images.remotePatterns`
pair without a path scope, and the reason is that no path scope is pinnable
rather than that none was attempted. A comment row stores Clerk's `imageUrl`
verbatim and renders it through `next/image`, so the pattern gates a string this
repository never constructs or parses. Clerk's image-optimization guide documents
the query parameters for `img.clerk.com` and not its path structure, so any prefix
would be pinned to an undocumented, vendor-controlled shape that can change
without a release note — and a mismatch surfaces as a broken avatar at runtime,
not as a build failure. Nothing here produces an `avatars.githubusercontent.com`
URL either: that entry exists to accept a Clerk-returned URL pointing at GitHub's
host, and the e2e avatar fixtures are local. Narrow them once Clerk documents a
stable prefix, or once this repository constructs the URL itself.

**Rules:**

- MUST route every outbound fetch of a CMS-authored URL through
  `fetchPermittedUrl`, and MUST keep `assertFetchableUrl` running **per redirect
  hop** rather than once at the start. Calling `fetch` directly on such a URL,
  widening the permitted-origin exception beyond `urlOrigin`, or restoring
  `redirect: "follow"` on that path is a finding — each one reopens the surface
  the guard exists to close.
- MUST NOT remove the `URL.canParse(href)` validation in `remarkEmbeds` (in
  `app/(app)/_/helpers/markdown.ts`) or the `isHttpUrl` scheme check in
  `app/(app)/_/components/embed.tsx`. The guard does not replace them: they sit
  upstream of it, keeping a malformed URL out of the directive and a
  `javascript:` URL out of a rendered anchor, which is a different sink from the
  outbound fetch.
- MUST keep every `next.config.ts` `images.remotePatterns` entry scoped to a
  single origin, and prefer a path scope within it. Of the four existing entries,
  `http://localhost:3000/api/**` and `https://cdn.hashnode.com/res/hashnode/**`
  are the pattern to copy; the two avatar hosts are whole-origin for the reason
  above, and MUST NOT be narrowed on the strength of an observed URL. A wildcard
  hostname (`**`) is never acceptable.
- MUST NOT let an OG image route (`thumbnail.png`, or a future `route.tsx`)
  accept a `src` query parameter that flows into `fetch(src)` without an
  allowlist; this is the canonical Next.js OG-image SSRF shape.
- MUST keep `sitemap.ts` and `robots.ts` fetching only Payload data through the
  repository layer, never an unbounded fetch to a CMS-controlled URL.

## Cross-Site Request Forgery

**Rules:**

- MUST check `Origin` or `Sec-Fetch-Site` on a `route.ts` mutation handler,
  through `isSameSiteRequest` from
  `app/(app)/_/helpers/request-origin.ts`. Even an idempotent endpoint such as
  `posts/caches` `DELETE` can be abused — here, to flush caches.
- MUST additionally carry a double-submit token on a mutation handler that acts
  on an authenticated user's behalf, as `app/(app)/_/helpers/comment-csrf.ts`
  does for the comment write path. That helper is this repository's worked CSRF
  example: `GET .../comments/token` mints a token, returns it in the body, and
  pins it in an `HttpOnly`, `SameSite=Strict` cookie; the `POST` handler accepts
  the write only when the header matches the cookie, compared in constant time.
  Reuse it rather than writing a second token scheme.
- MUST NOT treat `app/(payload)/` as in scope for this lens; the Payload admin
  routes own their own CSRF and request validation.

## Input Validation

Everything crossing into the app from a URL, a request body, or an upload is
attacker-controlled until something proves otherwise, and the proof has to run
before the value is used rather than after.

**Rules:**

- MUST compare a `searchParams` flag by value, not truthiness —
  `params.draft === "true"`, as `app/(app)/(index)/page.tsx` and
  `app/(app)/posts/[slug]/page.tsx` do. A truthy check treats `?draft=false` as
  enabled.
- MUST do that comparison at the route boundary rather than in the data layer.
  `app/(app)/_/repositories/get-blog-post.ts` takes `draft` as an already-parsed
  `boolean`, so a repository re-parsing a query string is a sign the boundary
  leaked.
- MUST validate `request.json()`, `request.formData()`, or `request.url` in a
  `route.ts` handler with a Zod schema or equivalent runtime check before use.
  `CommentSubmission` from `shared/comments.ts`, parsed in the comment write
  path, is the worked example — it is what bounds the only body a member of the
  public can send this application.
- MUST parse Payload documents through the matching schema in
  `shared/payload-types.ts` before returning them from a route handler or server
  action; returning them directly leaks fields the consumer never requested,
  including draft-only ones.
- MUST validate attribute values in a new custom MDAST directive, as
  `remarkEmbeds` does with `URL.canParse(href)`.
- MUST sanitize uploaded filenames in a new upload collection by adding
  `createUploadFilenameHook(<collection label>)` from
  `payload/helpers/upload-filename.ts` to its `beforeOperation` hooks. It rewrites
  `req.file.name` to `${uuid}.${ext}`; reuse it rather than copying the body, so
  the sanitization keeps one definition to audit.

## CI Workflow Supply Chain

A `uses:` entry is someone else's code running in a job that holds this
repository's tokens. Six distinct actions are referenced across
`.github/workflows/`; the two third-party ones are pinned to a commit SHA, and
GitHub's own `actions/*` are deliberately not.

The exposure is per **job**, not per repository. `peter-evans/create-pull-request`
runs in `check-and-deploy.yaml`'s `e2e-tests` job, whose `GITHUB_TOKEN` carries
`contents: write` — and `actions/checkout` persists that token into `.git/config`,
so every later step in the job can read it. A push to `main` is what starts the
production deploy, which makes that token, rather than any deployment credential,
the escalation worth closing. `anthropics/claude-code-action` runs in
`claude-review.yaml` beside `CLAUDE_CODE_OAUTH_TOKEN` and
`CLAUDE_OTEL_EXPORTER_OTLP_HEADERS`. No third-party action shares a job with
`VERCEL_TOKEN`, `LIBSQL_PAYLOAD_TURSO_AUTH_TOKEN`,
`BLOB_PAYLOAD_READ_WRITE_TOKEN`, or `TURSO_API_TOKEN`: every job holding those
runs `actions/*` exclusively, and that separation is worth preserving on its own.

The installed application-security capability has no rule about any of this — its
supply-chain reference covers the dependency manifest and the lockfile only, and
names no CI surface. What follows is this repository's own convention, decided in
[#181](https://github.com/axross/btnopen.com/issues/181).

**Rules:**

- MUST pin a new third-party `uses:` entry to a full 40-hex commit SHA with the
  release tag as a trailing comment — `uses: owner/action@<sha> # v1.2.3` — and
  MUST give it an automated bump path in `.github/dependabot.yml` rather than
  leaving the pin to rot.
- MUST take that SHA from a **release** tag rather than a floating major alias,
  and MUST peel an annotated tag to its commit
  (`git ls-remote <url> 'refs/tags/v1.2.3^{}'`) — a tag-object SHA is not usable
  in `uses:`. Dependabot bumps a SHA that carries no direct release tag to the
  containing branch's HEAD and leaves the version comment stale
  (`dependabot/dependabot-core#14716`).
- MUST NOT write a pinned SHA that was not resolved with `git ls-remote`; a wrong
  SHA fails at the run that first uses it, never at lint time.
- MUST leave GitHub's own `actions/*` entries on their major tags, and MUST NOT
  report that as a review finding — it is the recorded decision, not an oversight.
- MUST NOT rely on `npm run lint` to check anything under `.github/`. Biome's
  `files.ignoreUnknown` leaves the directory unprocessed — `biome check .github/`
  reports zero files — so a YAML error there survives a green lint. Parse the file
  explicitly instead.
- MUST NOT assume GitHub's immutable releases make a tag reference safe: they
  protect the tag cut for a release, never a floating `v1`-style alias, which the
  upstream owner repoints on every release.

## Dependencies

A package excluded from the bundler keeps running from `node_modules` at runtime,
so the list is a standing exception rather than a preference.

Advisories against those packages are tracked separately, in
[../operations/dependency-advisories.md](../operations/dependency-advisories.md):
it holds the current `npm audit` counts, the reachability judgement behind every
finding still open, and the decision that no audit step gates CI. Read it before
concluding that an open finding is an oversight.

**Rules:**

- MUST justify a new entry in `next.config.ts` `serverExternalPackages`. The
  existing entries — `re2`, `pino`, `pino-pretty` — are there because they are
  native or stream-based and incompatible with Next's bundler; the list should
  stay minimal.
- MUST NOT prune an entry merely because no file imports it. `re2` is declared
  nowhere in `package.json` and imported nowhere in this repository, yet removing
  it fails `npm run build` with `non-ecmascript placeable asset`: it is a native
  binding reached transitively through `@metascraper/helpers` →
  `metascraper-title` → `app/(app)/_/repositories/get-webembed-metadata.ts`. Trace
  an entry's provenance through the lockfile before concluding it is dead.
