# Preview Deployments

Apply these guidelines when working on the per-pull-request preview-deployment pipeline, or when configuring, verifying, or reasoning about preview deployments. The pipeline lets a reviewer see a PR's actual look and feel on a live Vercel URL. Each preview runs on its own fresh, empty Turso (SQLite) database seeded from the repository's own fixtures and writes uploaded media to a dedicated preview Blob store — so no production data, and no production credentials, ever reach a preview.

The security trade-offs of this design (a publicly reachable preview serving fixture content, not production data) are owned by the project's application-security requirements (privacy-and-exposure rules); consult it before changing what data a preview receives or who can reach it.

## Pipeline Overview

The workflow is [`.github/workflows/preview-deploy.yaml`](../../../../.github/workflows/preview-deploy.yaml), triggered on `pull_request` `[opened, synchronize, reopened, closed]` and concurrency-grouped per PR. Each PR is served by a fresh, empty Turso database, migrated in CI, wired into a Vercel preview deployment that self-seeds from fixtures on first boot, with media in a dedicated preview store under a `pr-<n>/` prefix; the database and that media are destroyed when the PR closes.

```text
pull_request (opened / synchronize / reopened)
        │
        ▼
  preflight ── required secrets/vars absent? ──────▶ skip (no-op, green)
        │ present
        ├─ only non-deployable paths changed? ──────▶ skip deploy (no Vercel credit)
        │ a deploy-affecting file changed
        ▼
  deploy
   1. create  preview-pr-<n>  as a fresh, empty database (never from production)
   2. run the repo's migrations against it            (schema built from scratch)
   3. vercel deploy (preview), injecting the DB creds + BLOB_PAYLOAD_PREFIX=pr-<n>
      at build + runtime; the app self-seeds from fixtures on first boot
   4. alias a stable per-PR URL to that deployment, then post a new comment
      with it (a fresh comment each deploy — prior ones are left intact)

pull_request (closed) ──▶ teardown: turso db destroy preview-pr-<n>;
                          prune every blob under pr-<n>/; post a teardown comment
```

**Guidelines:**

- MUST gate the `deploy` job on a **deploy-affecting-path** check so a pull request whose entire diff is non-deployable spends no Vercel credit: the `preflight` job lists the PR's changed files (`pulls.listFiles`, requiring `pull-requests: read`) and sets `source-changed=false` only when **every** changed file matches the non-deployable denylist — `.claude/**`, root docs (`AGENTS.md`, `CLAUDE.md`, `README.md`, `REVIEW.md`), `.github/**`, `e2e/**`, and editor/tooling config (`.vscode/**`, `.zed/**`, `.mcp.json`, `.pino-prettyrc`, `.gitignore`, `.data/**`). It is a **denylist**: any unlisted or newly added path — including in-tree content such as `payload/helpers/seed/*.md` (the seeded preview content) — counts as deployable, and the classifier fails safe toward deploying, forcing a deploy on a `pulls.listFiles` error or a capped (>= 3000) file list rather than a silent skip.
- MUST keep `teardown` **ungated** by that path check — it runs on every `closed` event regardless of paths — so any preview whose database and media were provisioned is always destroyed, even in the rare deploy-then-revert-to-non-deployable-then-close sequence. This is why the check gates the `deploy` job rather than the workflow's `pull_request` trigger (a trigger-level `paths-ignore` would skip teardown too and orphan the database).
- MUST provision each preview as a **fresh, empty** database — never branched from production — so no production row ever reaches a publicly reachable preview. Content comes only from the app's `onInit` seed (`payload/helpers/seed.ts`) running against that empty database on first boot.
- MUST keep the production `LIBSQL_*` credentials out of every preview: the workflow injects only the per-PR database credentials via `vercel deploy --env` / `--build-env`, never the production ones.
- MUST run schema **migrations in CI** (`npm run migrate:up` against the fresh database) so the schema exists before traffic; only data seeding happens at runtime.
- MUST keep the pipeline inert until setup exists — the `preflight` job gates `deploy`/`teardown` on the required secrets/vars so unconfigured and forked PRs stay green rather than failing.
- MUST keep provisioning idempotent across `synchronize` events (create the database only if absent; re-running migrations is a no-op once applied), so the per-PR database persists across pushes and edits made in the preview survive re-deploys.
- MUST surface a **stable per-PR URL**, not the per-commit `vercel deploy` URL: after deploying, re-point a deterministic alias (`<prefix>-pr-<n>.vercel.app`) at the new deployment with `vercel alias set`, so the pull request's preview link stays constant across pushes and always serves the newest build. The alias step fails the job on error rather than falling back to the per-commit URL.
- MUST post a **new** comment on each deploy (and a distinct teardown comment on close) rather than editing one sticky comment — a fresh comment re-surfaces the deploy in the PR timeline, and each carries the deployed short SHA so the appended history stays meaningful even though the URL is constant.
- SHOULD grant `issues: write` to any job whose `github-script` step posts a PR comment — PR comments post through the Issues API, and an explicit `permissions:` block defaults every unlisted scope to `none`.

## Seeding

A preview's content is not copied from anywhere — it is generated by the app's own idempotent `onInit` seed, the same one local development and the e2e suite use, gated on `PAYLOAD_TEST_USER_EMAIL` / `PAYLOAD_TEST_USER_PASSWORD`.

**Guidelines:**

- MUST provide `PAYLOAD_TEST_USER_EMAIL` and `PAYLOAD_TEST_USER_PASSWORD` so the app self-seeds on first boot. They are **environment-scoped secrets with a distinct value per environment**: the `deploy` job declares `environment: Preview` and injects the Preview-scoped values into the deployment, while Production and local development use their own separate values. The `onInit` seed is idempotent, so it provisions that admin account once per database.
- MUST keep the Preview seed credential **distinct from Production's** — the preview admin login is publicly reachable, so reusing the Production value there would expose Production admin access (see the application-security requirements, privacy-and-exposure rules).
- MUST run migrations in CI (not rely on runtime schema push): the runtime seed only creates data, against the already-migrated schema.
- SHOULD accept that the `onInit` seed is idempotent but not concurrency-safe — two simultaneous cold starts could race it. For a single-reviewer preview this is low risk; a dedicated CI seed step (booting Payload against the database before deploy) is the fallback if double-seeding ever appears.

## Required One-Time Setup

These steps touch the GitHub and Turso/Vercel accounts and cannot be performed from a coding session; they are the maintainer's responsibility before the pipeline does anything.

**Turso and GitHub:**

| Kind | Name | Value |
|---|---|---|
| GitHub secret | `TURSO_API_TOKEN` | a CI token minted with `turso auth api-tokens mint <name>` |
| GitHub secret (`Preview` environment) | `BLOB_PAYLOAD_READ_WRITE_TOKEN` | the **dedicated preview** Blob store's read/write token, added under the repository's **`Preview`** GitHub Actions environment (Settings → Environments → Preview → Secrets); the `teardown` job declares `environment: Preview` to read it and prune `pr-<n>/` media |
| GitHub secret (`Preview` environment) | `PAYLOAD_TEST_USER_EMAIL` / `PAYLOAD_TEST_USER_PASSWORD` | the preview seed-admin credentials, **distinct from Production's**, added under the same `Preview` environment; the `deploy` job declares `environment: Preview` and injects them into the deployment so the app self-seeds |
| GitHub variable | `TURSO_GROUP` | *(optional)* the group the database is created in |
| GitHub variable | `VERCEL_PREVIEW_ALIAS_PREFIX` | *(optional)* the `.vercel.app` label to prefix the stable per-PR alias; defaults to the sanitized repository name (e.g. `btnopen-com`), yielding `<prefix>-pr-<n>.vercel.app` |

`VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID` already exist for the production deploy and are reused as-is. No parent-database variable is needed — previews are seeded, not branched.

**Vercel project settings:** in the Vercel dashboard, under Settings → Environment Variables:

**Guidelines:**

- MUST scope the production `LIBSQL_PAYLOAD_TURSO_DATABASE_URL` and `LIBSQL_PAYLOAD_TURSO_AUTH_TOKEN` to the **Production** environment only — this is the critical safety measure: with the production credentials absent from Preview, no preview build can reach production even if the workflow is bypassed (Payload falls back to a local file).
- MUST NOT set the `LIBSQL_*` variables for the Preview environment; the workflow injects the per-PR database credentials per deployment.
- MUST point the Preview environment's `BLOB_PAYLOAD_READ_WRITE_TOKEN` at a **dedicated preview Blob store**, separate from production, and scope the production store token to **Production** only — so a preview shares neither media nor credentials with production. Add that same preview store token as the `BLOB_PAYLOAD_READ_WRITE_TOKEN` secret under the **`Preview`** GitHub Actions environment (not a plain repository secret) so `teardown` can prune it.
- The Preview `PAYLOAD_TEST_USER_*` values come from the `Preview` **GitHub Actions** environment (injected by the `deploy` job), so they need not be set in the Vercel Preview environment; the Production values are set in the Vercel **Production** environment and MUST differ from the Preview ones (see [Seeding](#seeding)).
- MUST configure the Preview environment's other non-database variables (`PAYLOAD_SECRET`, Sentry variables) so a preview can build and run.
- MUST NOT set `BLOB_PAYLOAD_PREFIX` in any environment by hand — the workflow injects `pr-<n>` per preview, and production/local intentionally leave it empty (see [Media Isolation via Blob Prefix](#media-isolation-via-blob-prefix)).
- SHOULD use a distinct Preview `PAYLOAD_SECRET` per the project's application-security requirements (privacy-and-exposure rules).

## First-Run Verification

End-to-end pipeline behavior depends on live Turso and Vercel accounts, so it is verified by exercising a real PR after setup rather than by the repository's automated tests.

**Guidelines:**

- MUST, after completing setup, open a throwaway PR and confirm the `deploy` job runs (not skipped), a `preview-pr-<n>` database appears in `turso db list`, a comment posts a working `<prefix>-pr-<n>.vercel.app` URL, and the site renders with the **seeded fixture content** (not production content).
- MUST confirm that pushing a second commit appends a **new** comment (not an edit of the first) and that the stable URL still resolves to the latest deployment.
- MUST confirm neither `LIBSQL_*` nor the preview Blob token appears unmasked in the workflow logs.
- MUST confirm that closing the PR runs `teardown`, posts a teardown comment, removes `preview-pr-<n>` from `turso db list`, and leaves no blobs under `pr-<n>/` in the preview store.

## Cost, Cleanup, and Limitations

**Guidelines:**

- SHOULD remove orphaned preview databases (e.g. from a PR closed while a run was cancelled) with `turso db destroy preview-pr-<n> --yes`; each open PR otherwise holds one extra database until close.
- SHOULD manually prune orphaned `pr-<n>/` media the same way when the automatic prune could not run — the `teardown` prune step is skipped when the `BLOB_PAYLOAD_READ_WRITE_TOKEN` secret is absent.
- MUST NOT assume concurrent PRs interfere: each gets its own database, preview, and `pr-<n>/` media prefix.

## Media Isolation via Blob Prefix

`BLOB_PAYLOAD_PREFIX` (read in [`payload/config.ts`](../../../../payload/config.ts)) namespaces every uploaded file under that path in the Vercel Blob store. The deploy job injects `pr-<n>` for each preview, so a PR's media lives under `pr-<n>/…` and never collides with production (which leaves the prefix unset, keeping its keys flat) or with another PR. The `prefix` field the storage plugin persists per document is what makes an uploaded file's URL reproducible, so it is added to the schema in every environment (`alwaysInsertFields`) to keep generated migrations deterministic even though local development and production run with an empty prefix.

**Guidelines:**

- MUST keep `BLOB_PAYLOAD_PREFIX` empty (unset) in production and local development so existing media keys stay flat; only preview deployments set it.
- MUST generate migrations with `BLOB_PAYLOAD_PREFIX` unset so the `prefix` column's default stays a stable `''` rather than baking a preview value into the schema.
- MUST prune a closed PR's media on teardown by deleting everything under its `pr-<n>/` prefix — the `teardown` job runs [`scripts/prune-preview-blobs.mjs`](../../../../scripts/prune-preview-blobs.mjs) (`@vercel/blob` `list` + `del`, paginated) against the preview store, from a throwaway directory with a standalone install so it never depends on the repository lockfile. The step is a clean skip when the `BLOB_PAYLOAD_READ_WRITE_TOKEN` secret is absent.
- MUST keep preview media in a store **dedicated** to previews (see [Required One-Time Setup](#required-one-time-setup)); the prefix isolates keys within that store, and the dedicated store additionally isolates credentials from production.
