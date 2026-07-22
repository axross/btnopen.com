# Production Deployments

Apply these guidelines when working on the production deploy pipeline, when reasoning about how a schema change reaches production, or when a pull request adds or changes a Payload migration. The pipeline applies pending migrations to the production database **before** the new code serves traffic, so production never runs code whose schema is ahead of the database.

This exists because it once did not: production repeatedly served code whose Payload schema outran the production database, and core queries failed with `SQLite input error: no such column: …` until the migration was applied by hand (Sentry BTNOPEN-4G on Jul 6, BTNOPEN-4H on Jul 10). The steps below are what close those drift windows; keep them intact.

The per-pull-request preview pipeline is the sibling of this flow and migrates a fresh, isolated Turso database seeded from fixtures instead of production; see [preview-deployments.md](./preview-deployments.md). The migration commands themselves are owned by [dev-commands.md](./dev-commands.md).

## Pipeline Overview

The workflow is [`.github/workflows/check-and-deploy.yaml`](../../../../.github/workflows/check-and-deploy.yaml), triggered on `push` to `main` and concurrency-grouped per ref. Three jobs run in sequence; only the last touches production.

```text
push to main
     │
     ▼
  lint ──▶ e2e-tests ──▶ deployment   (environment: Production)
                              1. vercel pull / env pull   (production project settings)
                              2. verify LIBSQL_* + Blob credentials are present  ── absent ─▶ fail
                              3. npm run migrate:up        (against production)  ── error ─▶ fail
                              4. vercel build --prod       (build on the runner, not on Vercel)
                              5. vercel deploy --prebuilt --prod  (publish the prebuilt output)
```

The build runs on the GitHub Actions runner (`vercel build`), and `vercel deploy --prebuilt` only publishes the resulting `.vercel/output` — Vercel never rebuilds, so it spends no build credit (see [preview-deployments.md](./preview-deployments.md) for the prebuilt mechanics shared by both pipelines). The `deployment` job declares `environment: Production`, which is what grants it the production `LIBSQL_PAYLOAD_TURSO_DATABASE_URL` variable and the `LIBSQL_PAYLOAD_TURSO_AUTH_TOKEN` and `BLOB_PAYLOAD_READ_WRITE_TOKEN` secrets used by both the migration step and the build step (the build renders `/sitemap.xml` and runs the `onInit` seed against production, so it needs the same database and blob credentials).

**Guidelines:**

- MUST keep the `npm run migrate:up` step ordered before the `vercel build --prod` and `vercel deploy --prebuilt --prod` steps, so migrations reach production before the new code is built against it (the build queries production while rendering `/sitemap.xml` and seeding) and promoted to traffic.
- MUST source the production credentials and the build-time system variables the prebuilt build needs — `NEXT_PUBLIC_VERCEL_ENV`, `NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA`, and the custom `DEPLOYMENT_ID` (a `<=32`-char commit SHA for Skew Protection; see [preview-deployments.md](./preview-deployments.md)) — in the `vercel build --prod` step's environment, because `--prebuilt` deployments do not receive Vercel's System Environment Variables at build time.
- MUST keep migration failures fatal to the deploy (see [Fail Loud on Migration or Credential Errors](#fail-loud-on-migration-or-credential-errors)); a half-migrated database must never be served.
- MUST source the production credentials from the `Production` GitHub environment (see [Credential Sourcing](#credential-sourcing)), never from the repository-wide scope.
- SHOULD keep this the single production-promotion path: if Vercel Git auto-deploy is enabled on the project, a push-triggered Vercel build can promote new code in parallel with (and ahead of) this job's migration step, reopening the drift window this pipeline closes.

## Migrate Before Promote

Migrating before promoting leaves a brief window in which the *old* code runs against the *new* schema. Additive migrations (a new nullable column, a new table) are invisible to old code, so the window is safe. A destructive change (dropping or renaming a column the old code still reads) breaks during that window and must be split across releases.

> Expand then contract: release the additive migration and the code that tolerates both shapes first; only once that is live does a later release remove the old shape.

**Guidelines:**

- MUST treat additive, backward-compatible migrations as the default for a single deploy; old code must keep working against the new schema for the promotion window.
- MUST split a destructive or renaming schema change into expand-then-contract releases rather than shipping the drop alongside the code that stops using it.
- SHOULD state, in the pull request of a schema-changing change, whether the migration is additive or requires the expand/contract sequence, so the reviewer can check the window is safe.

## Fail Loud on Migration or Credential Errors

A silent failure here is worse than a loud one: a deploy that proceeds against a half-migrated or wrong database is exactly the drift this pipeline prevents. Two guards make failure fatal.

1. **Credential verification** — the job asserts the `LIBSQL_*` values and the `BLOB_PAYLOAD_READ_WRITE_TOKEN` are non-empty (`test -n`) before migrating. The libSQL adapter falls back to a local file when its credentials are absent, so without this check a misconfigured deploy would "succeed" against a throwaway database and never touch production. `payload migrate` also builds the entire Payload config, whose Vercel Blob adapter validates the token format at config-build time and throws on a malformed value — so a missing or unusable blob token aborts the command before any migration runs; sourcing it here keeps the step from failing on the placeholder `vercel env pull` leaves behind.
2. **`pipefail` on the migration script** — `migrate:up` runs `payload migrate` piped into `pino-pretty`. Under a plain shell the pipe's exit status is `pino-pretty`'s `0`, masking a failed migration; the `migrate:*` scripts wrap the pipe in `bash -o pipefail -c` so the migration's non-zero status propagates and fails the step.

**Guidelines:**

- MUST keep the credential-verification step (`test -n` on the `LIBSQL_*` values and the `BLOB_PAYLOAD_READ_WRITE_TOKEN`) ahead of the migration step; it is the guard against a silent fallback to a local database and against the Blob adapter throwing on an unusable pulled token.
- MUST keep the `migrate:*` npm scripts wrapped in `bash -o pipefail -c` so a failing migration exits non-zero instead of being masked by `pino-pretty`.
- MUST NOT add a `continue-on-error` or an `|| true` that would let the deploy proceed past a failed migration or a missing credential.

## Credential Sourcing

The production database URL and auth token, and the Vercel Blob read/write token, live in the `Production` GitHub environment — the URL as a variable, the two tokens as secrets — and are passed to the migration step through the process environment. A subtlety forces this: `vercel env pull` cannot retrieve a *sensitive* Vercel variable, so it writes an unusable value to `.env.local` — the libSQL auth token comes through as an empty string, the blob token as a non-conforming placeholder — and `payload migrate` reads root-level `.env*` files, so those pulled lines would shadow the real credentials (the empty libSQL token falling back to a local database, the malformed blob token making the Blob adapter throw at config-build time and abort the migration).

**Guidelines:**

- MUST provide `LIBSQL_PAYLOAD_TURSO_DATABASE_URL`, `LIBSQL_PAYLOAD_TURSO_AUTH_TOKEN`, and `BLOB_PAYLOAD_READ_WRITE_TOKEN` to the migration step from the `Production` GitHub environment, not from `vercel env pull` output.
- MUST delete the pulled `LIBSQL_*` and `BLOB_PAYLOAD_READ_WRITE_TOKEN` lines from `.env.local` before migrating (the workflow's `sed` step) so the unusable sensitive values cannot shadow the process-environment credentials.
- MUST NOT expose the production `LIBSQL_*` credentials or the production `BLOB_PAYLOAD_READ_WRITE_TOKEN` to any job other than `deployment`; the preview pipeline uses isolated per-PR database credentials and a `Preview`-environment-scoped token for its dedicated preview Blob store instead (see [preview-deployments.md](./preview-deployments.md)).
