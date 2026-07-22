# Preview Deployments

Apply these guidelines when working on the per-pull-request preview-deployment pipeline, or when configuring, verifying, or reasoning about preview deployments. The pipeline lets a reviewer see a PR's actual look and feel on a live Vercel URL. Each preview runs on its own fresh, empty Turso (SQLite) database seeded from the repository's own fixtures and writes uploaded media to a dedicated preview Blob store — so no production data, and no production credentials, ever reach a preview.

The security trade-offs of this design (a publicly reachable preview serving fixture content, not production data) are owned by the project's application-security requirements (privacy-and-exposure rules); consult it before changing what data a preview receives or who can reach it.

## Pipeline Overview

The workflow is [`.github/workflows/preview-deploy.yaml`](../../../../.github/workflows/preview-deploy.yaml), triggered on `pull_request` `[opened, synchronize, reopened, closed]` **and** on `workflow_dispatch` (a maintainer-only manual entry point; see [Manual Dispatch](#manual-dispatch)), concurrency-grouped per PR. Each PR is served by a fresh, empty Turso database, migrated in CI, wired into a Vercel preview deployment that self-seeds from fixtures during the build, with media in a dedicated preview store under a `pr-<n>/` prefix; the database and that media are destroyed when the PR closes.

```text
pull_request (opened / synchronize / reopened)          workflow_dispatch (pr_number, action)
        │                                                        │ deploy / recreate → deploy;
        ▼                                                        │ teardown / recreate → teardown
  preflight ── required secrets/vars absent? ──────▶ skip (no-op, green)
        │ present   (also resolves the PR number + head SHA — from the event, or the pr_number input)
        ├─ pull_request & only non-deployable paths changed? ──▶ skip deploy (no Vercel credit)
        │ a deploy-affecting file changed, or a deploy/recreate dispatch (dispatch bypasses the path check)
        ▼
  deploy
   1. create  preview-pr-<n>  as a fresh, empty database (never from production)
   2. run the repo's migrations against it            (schema built from scratch)
   3. vercel build (on the runner) with the DB creds + BLOB_PAYLOAD_PREFIX=pr-<n>
      in the build env; the app self-seeds from fixtures during the build
   4. vercel deploy --prebuilt, passing the same DB creds + prefix as runtime
      --env; Vercel publishes the prebuilt output without a Vercel-side build
   5. alias a stable per-PR URL to that deployment, then post a new comment
      with it (a fresh comment each deploy — prior ones are left intact)

pull_request (closed) OR dispatch teardown/recreate ──▶ teardown: turso db destroy preview-pr-<n>;
                          prune every blob under pr-<n>/; post a teardown comment
                          (recreate runs teardown → deploy sequentially in one run)
```

**Guidelines:**

- MUST gate the `deploy` job on a **deploy-affecting-path** check so a pull request whose entire diff is non-deployable spends no Vercel credit: the `preflight` job lists the PR's changed files (`pulls.listFiles`, requiring `pull-requests: read`) and sets `source-changed=false` only when **every** changed file matches the non-deployable denylist — `.claude/**`, root docs (`AGENTS.md`, `CLAUDE.md`, `README.md`, `REVIEW.md`), `.github/**`, `e2e/**`, and editor/tooling config (`.vscode/**`, `.zed/**`, `.mcp.json`, `.pino-prettyrc`, `.gitignore`, `.data/**`). It is a **denylist**: any unlisted or newly added path — including in-tree content such as `payload/helpers/seed/*.md` (the seeded preview content) — counts as deployable, and the classifier fails safe toward deploying, forcing a deploy on a `pulls.listFiles` error or a capped (>= 3000) file list rather than a silent skip.
- MUST keep `teardown` **ungated** by that path check — it runs on every `closed` event regardless of paths — so any preview whose database and media were provisioned is always destroyed, even in the rare deploy-then-revert-to-non-deployable-then-close sequence. This is why the check gates the `deploy` job rather than the workflow's `pull_request` trigger (a trigger-level `paths-ignore` would skip teardown too and orphan the database).
- MUST provision each preview as a **fresh, empty** database — never branched from production — so no production row ever reaches a publicly reachable preview. Content comes only from the app's `onInit` seed (`payload/helpers/seed.ts`) running against that empty database during the build.
- MUST keep the production `LIBSQL_*` credentials out of every preview: the workflow injects only the per-PR database credentials — into the `vercel build` step's environment at build time, and onto `vercel deploy --prebuilt --env` at runtime — never the production ones.
- MUST run schema **migrations in CI** (`npm run migrate:up` against the fresh database) so the schema exists before the build seeds it; only data seeding (the `onInit` seed) happens during the build.
- MUST keep the pipeline inert until setup exists — the `preflight` job gates `deploy`/`teardown` on the required secrets/vars so unconfigured and forked PRs stay green rather than failing.
- MUST keep provisioning idempotent across `synchronize` events (create the database only if absent; re-running migrations is a no-op once applied), so the per-PR database persists across pushes and edits made in the preview survive re-deploys.
- MUST surface a **stable per-PR URL**, not the per-commit `vercel deploy --prebuilt` URL: after deploying, re-point a deterministic alias (`<prefix>-pr-<n>.vercel.app`) at the new deployment with `vercel alias set`, so the pull request's preview link stays constant across pushes and always serves the newest build. The alias step fails the job on error rather than falling back to the per-commit URL.
- MUST post a **new** comment on each deploy (and a distinct teardown comment on close) rather than editing one sticky comment — a fresh comment re-surfaces the deploy in the PR timeline, and each carries the deployed short SHA so the appended history stays meaningful even though the URL is constant.
- SHOULD grant `issues: write` to any job whose `github-script` step posts a PR comment — PR comments post through the Issues API, and an explicit `permissions:` block defaults every unlisted scope to `none`.

## Prebuilt Build

Both this pipeline and the production one (see [production-deployments.md](./production-deployments.md)) build on the GitHub Actions runner and let Vercel only publish the result, so Vercel spends no build credit. `vercel build` produces `.vercel/output` on the runner; `vercel deploy --prebuilt --archive=tgz` uploads it without a Vercel-side rebuild.

**Guidelines:**

- MUST run `vercel pull` before `vercel build` so the runner has the project settings and (non-sensitive) environment variables the build needs.
- MUST inject, into the `vercel build` step's environment, everything the build consumes that Vercel would otherwise supply at build time: the per-PR database credentials and `BLOB_PAYLOAD_PREFIX` (production sources its own from the `Production` environment), the dedicated preview blob token, the seed credentials, and the build-time system variables `--prebuilt` deployments do **not** receive (`NEXT_PUBLIC_VERCEL_ENV`, `NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA`) — which the client bundle inlines into the `btn-env` / `btn-sha` meta tags and the Sentry release.
- MUST set a custom `DEPLOYMENT_ID` (a commit SHA truncated to Vercel's **32-character** limit) in the build env so Skew Protection keeps working: a `--prebuilt` deployment cannot inherit Vercel's auto-assigned deployment ID, so `next.config.ts` bakes this one into `routes-manifest.json` and the client's `?dpl=` requests. A full 40-character SHA is rejected by `vercel build` ("must be 32 characters or less").
- MUST strip the unusable placeholders `vercel pull` writes for sensitive variables (the libSQL auth token, the blob token) from the pulled `.vercel/.env.*.local` files before `vercel build`, so they cannot shadow the real values injected through the step environment — the same shadowing hazard the production pipeline guards against for `payload migrate`.
- MUST keep runtime-only credentials on `vercel deploy --prebuilt --env` (not the build step): the per-PR database credentials, `BLOB_PAYLOAD_PREFIX`, and seed credentials the running preview needs.

## Manual Dispatch

The `pull_request` triggers cannot re-seed a live preview: the per-PR database is created idempotently and its `onInit` seed populates it only once, so subsequent pushes reuse the existing database and never re-seed. When the seed fixtures change across a PR's life, the preview keeps serving the *first* seed's content, and the only reset was a fragile close→reopen dance that races the `cancel-in-progress` teardown. The `workflow_dispatch` entry point exists to reset a preview without that dance.

**Guidelines:**

- MUST reuse the existing `preflight`/`deploy`/`teardown` jobs for the manual path rather than duplicating deploy logic — `workflow_dispatch` only adds inputs and widens the job gates. Its inputs are `pr_number` (required number) and `action` (required choice `recreate` | `deploy` | `teardown`, default `recreate`).
- MUST resolve the PR number and head SHA in `preflight` and expose them as job outputs (`pr-number`, `head-sha`) that `deploy`/`teardown` consume, because `github.event.pull_request.*` is absent under `workflow_dispatch`: derive them from the event on a `pull_request` run, or from the `pr_number` input via the PRs API (`pulls.get`) on a manual run (failing loudly on a non-positive/invalid `pr_number`). Every `deploy`/`teardown` reference to the PR number, head SHA, and the comment steps' context reads these outputs, so both jobs work identically under either trigger.
- MUST key the workflow-level `concurrency` group on `github.event.pull_request.number || inputs.pr_number` so a manual run and an event-driven run for the **same** PR share a group and never collide. (Concurrency is evaluated before jobs run, so it uses the raw input, not the resolved `preflight` output — they are equal for the same PR.)
- MUST run `recreate` as teardown → deploy **sequentially in one run** (`deploy` gains `needs: [preflight, teardown]`) so the destroy completes before the fresh deploy re-provisions and re-seeds — this is what sidesteps the close→reopen cancellation race. Gate `deploy` with `!cancelled() && needs.preflight.result == 'success' && (needs.teardown.result == 'success' || needs.teardown.result == 'skipped')`: the skipped-teardown allowance keeps a normal (non-recreate) deploy running, the success requirement makes a `recreate` deploy wait for — and only proceed on — a successful teardown, and the `preflight.result` guard blocks a deploy when the resolve step failed (otherwise `!cancelled()` would let it run with an empty `head-sha` and fall back to a default-branch checkout).
- MUST have the manual `deploy` check out the **resolved PR head** (`ref: ${{ github.event_name == 'workflow_dispatch' && needs.preflight.outputs.head-sha || '' }}`), not the default branch a dispatch checks out by default, so it builds and re-seeds from the pull request's own current fixtures. An empty `ref` (the `pull_request` path) falls back to checkout's default behavior, keeping that path unchanged.
- SHOULD let the manual path bypass the deploy-affecting-path check — a `deploy`/`recreate` dispatch is an explicit, intentional action, so its `deploy` gate does not consult `source-changed` (the change-detection step is guarded to `github.event_name == 'pull_request'`).
- The manual trigger only surfaces once this workflow is on the **default branch**, and a dispatch runs the default branch's version of the workflow (a known GitHub `workflow_dispatch` constraint).

## Seeding

A preview's content is not copied from anywhere — it is generated by the app's own idempotent `onInit` seed, the same one local development and the e2e suite use, gated on `PAYLOAD_TEST_USER_EMAIL` / `PAYLOAD_TEST_USER_PASSWORD`.

**Guidelines:**

- MUST provide `PAYLOAD_TEST_USER_EMAIL` and `PAYLOAD_TEST_USER_PASSWORD` so the app self-seeds when it first initializes Payload. They are **environment-scoped secrets with a distinct value per environment**: the `deploy` job declares `environment: Preview` and injects the Preview-scoped values into the deployment, while Production and local development use their own separate values. The `onInit` seed is idempotent, so it provisions that admin account once per database.
- MUST keep the Preview seed credential **distinct from Production's** — the preview admin login is publicly reachable, so reusing the Production value there would expose Production admin access (see the application-security requirements, privacy-and-exposure rules).
- MUST run migrations in CI (not rely on runtime schema push): the seed only creates data, against the already-migrated schema.
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
| GitHub variable | `VERCEL_PREVIEW_ALIAS_PREFIX` | *(optional)* the `.vercel.app` label to prefix the stable per-PR alias; defaults to the repository name's first dot-delimited label with any domain suffix dropped (e.g. `btnopen` from `btnopen.com`), yielding `<prefix>-pr-<n>.vercel.app` |

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
