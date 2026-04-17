# Secret and Environment-Variable Handling

Apply these rules to verify no secret is committed and `process.env` access stays inside the project's whitelisted boundary.

## Committed Secrets

- MUST flag a Critical when the diff contains any literal value matching the shape of:
  - A Payload secret (`PAYLOAD_SECRET`) — long random string assigned to `payloadSecret` outside `payload/config.ts`
  - A Sentry DSN with an embedded auth token (anything past `https://<key>@…` that includes `/projects/…/store/`)
  - A Vercel Blob `BLOB_*_READ_WRITE_TOKEN` (begins with `vercel_blob_rw_`)
  - A Turso `LIBSQL_*_AUTH_TOKEN` (JWT-shaped)
  - A `PAYLOAD_TEST_USER_PASSWORD` literal anywhere outside `.env.example`
  - A Mixpanel project token outside the whitelisted env-access files
- MUST flag a Critical when `.env.local`, `.env.production`, `.env`, or any `*.pem` / `*.key` file appears in the diff. They are gitignored — appearance means the gitignore was bypassed.
- MUST flag a Major when a value previously read from `process.env.*` is hard-coded into the diff "for testing".

## `process.env` Whitelist

The project restricts `process.env.*` access via Biome's `noProcessEnv` rule. The reviewer MUST flag a Critical for any new `process.env.*` access outside these files (each access uses a `// biome-ignore lint/style/noProcessEnv: …` directive):

| File | Why it is whitelisted |
|---|---|
| `app/(app)/_/runtime.ts` | The single sanctioned barrel for env-derived runtime values exported as `urlOrigin`, `vercelEnvironment`, `sentryDsn`, `mixpanelToken`, etc. |
| `payload/config.ts` | Payload realm needs DB/storage credentials at build time |
| `next.config.ts` | Next.js config-time access to `CI`, `SENTRY_ORG`, `SENTRY_PROJECT` |
| `playwright.config.ts` | Test config-time access to `CI`, `PLAYWRIGHT_BASE_URL`, `VERCEL_AUTOMATION_BYPASS_SECRET` |

- MUST flag a Critical when a component, repository, helper, route handler, or Payload collection reads `process.env` directly. It MUST go through `app/(app)/_/runtime.ts` exports.

## `NEXT_PUBLIC_*` Boundary

- MUST flag a Critical when a secret value is read via a `NEXT_PUBLIC_*`-prefixed env var. The `NEXT_PUBLIC_` prefix is the public-bundle boundary — anything prefixed is shipped to every browser.
- The project legitimately uses `NEXT_PUBLIC_VERCEL_ENV`, `NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA`, `NEXT_PUBLIC_SENTRY_DSN`, `NEXT_PUBLIC_MIXPANEL_TOKEN` — these are public-by-design.
- MUST flag a Major when a new `NEXT_PUBLIC_*` env var is introduced without a one-line justification of why it must be public.

## Logging and Telemetry

- MUST flag a Critical when a secret value (DSN, token, password, session ID, auth header) is interpolated into any `logger.info()` / `logger.warn()` call, any `captureException()` extras, or any Mixpanel `track` payload. Pino logs go to stdout and are captured by Vercel; Sentry/Mixpanel ship payloads off-server.
- The Sentry config sets `sendDefaultPii: true` (`sentry.server.config.ts`, `sentry.edge.config.ts`, `instrumentation-client.ts`) — the reviewer MUST be aware that IP addresses, cookies, and request bodies may already be attached. Flag a Major when a change adds explicitly sensitive context (e.g., a bearer token) on top of that default.

## `.env.example`

- MUST flag a Major when the diff introduces a new env var consumed at runtime but does not add a placeholder line to `.env.example`. The example file is the only documentation of which env vars exist.
