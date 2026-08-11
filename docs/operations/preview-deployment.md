# Preview Deployment

How a pull request gets a live preview, what has to be set up once before that
works, and what keeps a preview isolated from production. The pipeline lets a
reviewer see a pull request's actual look and feel on a live Vercel URL. Each
preview runs on its own fresh, empty Turso (SQLite) database seeded from the
repository's own fixtures and writes uploaded media to a dedicated preview Blob
store — so no production data, and no production credentials, ever reach a
preview.

Why a preview is seeded rather than branched from production is in
[../decisions/2026-07-18-seed-preview-databases-from-fixtures-rather-than-branching-production.md](../decisions/2026-07-18-seed-preview-databases-from-fixtures-rather-than-branching-production.md),
and why its media is namespaced in
[../decisions/2026-07-16-namespace-preview-media-under-a-blob-prefix.md](../decisions/2026-07-16-namespace-preview-media-under-a-blob-prefix.md).
The security trade-offs of the resulting design — a publicly reachable preview
serving fixture content — are in
[Data Isolation and Exposure](#data-isolation-and-exposure) below; read it before
changing what data a preview receives or who can reach it.

## Pipeline Overview

The workflow is
[`.github/workflows/preview-deploy.yaml`](../../.github/workflows/preview-deploy.yaml),
triggered on `pull_request` `[opened, synchronize, reopened, closed]` **and** on
`workflow_dispatch` (a maintainer-only manual entry point; see
[Manual Dispatch](#manual-dispatch)), concurrency-grouped per pull request.

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

Whether `deploy` runs at all is decided by a **deploy-affecting-path** check, and
the job MUST stay gated on it so a pull request whose entire diff is
non-deployable spends no Vercel credit: the `preflight` job lists the pull
request's changed files (`pulls.listFiles`, requiring `pull-requests: read`) and
sets `source-changed=false` only when **every** changed file matches the
non-deployable denylist — `.claude/**`, `docs/**`, root docs (`CLAUDE.md`,
`README.md`, `REVIEW.md`), the `skills-lock.json` lockfile, `.github/**`,
`e2e/**`, and editor/tooling config (`.vscode/**`, `.zed/**`, `.mcp.json`,
`.pino-prettyrc`, `.gitignore`, `.data/**`). It is a **denylist**: any unlisted or
newly added path — including in-tree content such as `payload/helpers/seed/*.md`
(the seeded preview content) — counts as deployable, and the classifier fails
safe toward deploying, forcing a deploy on a `pulls.listFiles` error or a capped
(>= 3000) file list rather than a silent skip.

`teardown` MUST stay **ungated** by that path check — it runs on every `closed`
event regardless of paths — so any preview whose database and media were
provisioned is always destroyed, even in the rare
deploy-then-revert-to-non-deployable-then-close sequence. This is why the check
gates the `deploy` job rather than the workflow's `pull_request` trigger (a
trigger-level `paths-ignore` would skip teardown too and orphan the database).

Each preview MUST be provisioned as a **fresh, empty** database — never branched
from production — so no production row ever reaches a publicly reachable
preview. Content comes only from the app's `onInit` seed
(`payload/helpers/seed.ts`) running against that empty database during the build.
The production `LIBSQL_*` credentials MUST be kept out of every preview: the
workflow injects only the per-PR database credentials — into the `vercel build`
step's environment at build time, and onto `vercel deploy --prebuilt --env` at
runtime — never the production ones. Schema **migrations** MUST run **in CI**
(`npm run migrate:up` against the fresh database) so the schema exists before the
build seeds it; only data seeding (the `onInit` seed) happens during the build.

The pipeline MUST stay inert until setup exists — the `preflight` job gates
`deploy`/`teardown` on the required secrets/vars so unconfigured and forked pull
requests stay green rather than failing. Provisioning MUST stay idempotent across
`synchronize` events (create the database only if absent; re-running migrations is
a no-op once applied), so the per-PR database persists across pushes and edits
made in the preview survive re-deploys.

What the pull request shows a reviewer MUST be a **stable per-PR URL**, not the
per-commit `vercel deploy --prebuilt` URL: after deploying, re-point a
deterministic alias (`<prefix>-pr-<n>.vercel.app`) at the new deployment with
`vercel alias set`, so the pull request's preview link stays constant across
pushes and always serves the newest build. The alias step fails the job on error
rather than falling back to the per-commit URL. Each deploy MUST post a **new**
comment (and a distinct teardown comment on close) rather than editing one sticky
comment — a fresh comment re-surfaces the deploy in the pull request timeline,
and each carries the deployed short SHA so the appended history stays meaningful
even though the URL is constant. Any job whose `github-script` step posts a pull
request comment SHOULD be granted `issues: write` — such comments post through
the Issues API, and an explicit `permissions:` block defaults every unlisted
scope to `none`.

## Prebuilt Build

Both this pipeline and the production one build on the GitHub Actions runner and
let Vercel only publish the result. `vercel build` produces `.vercel/output` on
the runner; `vercel deploy --prebuilt --archive=tgz` uploads it without a
Vercel-side rebuild.

`vercel pull` MUST run before `vercel build`, so the runner has the project
settings and (non-sensitive) environment variables the build needs. Everything
the build consumes that Vercel would otherwise supply at build time MUST be
injected into the `vercel build` step's environment: the per-PR database
credentials and `BLOB_PAYLOAD_PREFIX` (production sources its own from the
`Production` environment), the dedicated preview blob token, the seed
credentials, and the build-time system variables `--prebuilt` deployments do
**not** receive (`NEXT_PUBLIC_VERCEL_ENV`, `NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA`) —
which the client bundle inlines into the `btn-env` / `btn-sha` meta tags and the
Sentry release.

A custom `DEPLOYMENT_ID` (a commit SHA truncated to Vercel's **32-character**
limit) MUST be set in the build env so Skew Protection keeps working: a
`--prebuilt` deployment cannot inherit Vercel's auto-assigned deployment ID, so
`next.config.ts` bakes this one into `routes-manifest.json` and the client's
`?dpl=` requests. A full 40-character SHA is rejected by `vercel build` ("must be
32 characters or less").

The unusable placeholders `vercel pull` writes for sensitive variables (the
libSQL auth token, the blob token) MUST be stripped from the pulled
`.vercel/.env.*.local` files before `vercel build`, so they cannot shadow the real
values injected through the step environment — the same shadowing hazard the
production pipeline guards against for `payload migrate`.

Runtime-only credentials MUST be kept on `vercel deploy --prebuilt --env` and not
on the build step: the per-PR database credentials, `BLOB_PAYLOAD_PREFIX`, and
seed credentials the running preview needs.

## Manual Dispatch

The `pull_request` triggers cannot re-seed a live preview: the per-PR database is
created idempotently and its `onInit` seed populates it only once, so subsequent
pushes reuse the existing database and never re-seed. When the seed fixtures
change across a pull request's life, the preview keeps serving the *first* seed's
content, and the only reset was a fragile close→reopen dance that races the
`cancel-in-progress` teardown. The `workflow_dispatch` entry point exists to reset
a preview without that dance.

The manual path MUST reuse the existing `preflight`/`deploy`/`teardown` jobs
rather than duplicating deploy logic — `workflow_dispatch` only adds inputs and
widens the job gates. Its inputs are `pr_number` (required number) and `action`
(required choice `recreate` | `deploy` | `teardown`, default `recreate`).

Because `github.event.pull_request.*` is absent under `workflow_dispatch`, the
pull request number and head SHA MUST be resolved in `preflight` and exposed as
job outputs (`pr-number`, `head-sha`) that `deploy`/`teardown` consume: derive
them from the event on a `pull_request` run, or from the `pr_number` input via the
pull requests API (`pulls.get`) on a manual run (failing loudly on a non-positive
or invalid `pr_number`). Every `deploy`/`teardown` reference to the pull request
number, head SHA, and the comment steps' context reads these outputs, so both jobs
work identically under either trigger.

The workflow-level `concurrency` group MUST be keyed on
`github.event.pull_request.number || inputs.pr_number` so a manual run and an
event-driven run for the **same** pull request share a group and never collide.
Concurrency is evaluated before jobs run, so it uses the raw input, not the
resolved `preflight` output — they are equal for the same pull request.

`recreate` MUST run as teardown → deploy **sequentially in one run** (`deploy`
gains `needs: [preflight, teardown]`) so the destroy completes before the fresh
deploy re-provisions and re-seeds — this is what sidesteps the close→reopen
cancellation race. Gate `deploy` with
`!cancelled() && needs.preflight.result == 'success' && (needs.teardown.result == 'success' || needs.teardown.result == 'skipped')`:
the skipped-teardown allowance keeps a normal (non-recreate) deploy running, the
success requirement makes a `recreate` deploy wait for — and only proceed on — a
successful teardown, and the `preflight.result` guard blocks a deploy when the
resolve step failed (otherwise `!cancelled()` would let it run with an empty
`head-sha` and fall back to a default-branch checkout).

The manual `deploy` MUST check out the **resolved pull request head**
(`ref: ${{ github.event_name == 'workflow_dispatch' && needs.preflight.outputs.head-sha || '' }}`),
not the default branch a dispatch checks out by default, so it builds and
re-seeds from the pull request's own current fixtures. An empty `ref` (the
`pull_request` path) falls back to checkout's default behaviour, keeping that path
unchanged.

The manual path SHOULD bypass the deploy-affecting-path check — a
`deploy`/`recreate` dispatch is an explicit, intentional action, so its `deploy`
gate does not consult `source-changed` (the change-detection step is guarded to
`github.event_name == 'pull_request'`).

The manual trigger only surfaces once this workflow is on the **default branch**,
and a dispatch runs the default branch's version of the workflow — a known GitHub
`workflow_dispatch` constraint.

## Seeding

A preview's content is not copied from anywhere — it is generated by the app's own
idempotent `onInit` seed, the same one local development and the e2e suite use,
gated on `PAYLOAD_TEST_USER_EMAIL` / `PAYLOAD_TEST_USER_PASSWORD`.

Both MUST be provided so the app self-seeds when it first initializes Payload.
They are **environment-scoped secrets with a distinct value per environment**: the
`deploy` job declares `environment: Preview` and injects the Preview-scoped values
into the deployment, while Production and local development use their own separate
values. The `onInit` seed is idempotent, so it provisions that admin account once
per database. The Preview seed credential MUST stay **distinct from Production's**
— the preview admin login is publicly reachable, so reusing the Production value
there would expose Production admin access.

Migrations MUST run in CI rather than the pipeline relying on runtime schema push:
the seed only creates data, against the already-migrated schema.

The `onInit` seed is idempotent but not concurrency-safe — two simultaneous cold
starts could race it — and that SHOULD be accepted rather than engineered around.
For a single-reviewer preview this is low risk; a dedicated CI seed step (booting
Payload against the database before deploy) is the fallback if double-seeding ever
appears.

## Required One-Time Setup

These steps touch the GitHub and Turso/Vercel accounts and cannot be performed
from a coding session; they are the maintainer's responsibility before the
pipeline does anything.

**Turso and GitHub:**

| Kind | Name | Value |
| --- | --- | --- |
| GitHub secret | `TURSO_API_TOKEN` | a CI token minted with `turso auth api-tokens mint <name>` |
| GitHub secret (`Preview` environment) | `BLOB_PAYLOAD_READ_WRITE_TOKEN` | the **dedicated preview** Blob store's read/write token, added under the repository's **`Preview`** GitHub Actions environment (Settings → Environments → Preview → Secrets); the `teardown` job declares `environment: Preview` to read it and prune `pr-<n>/` media |
| GitHub secret (`Preview` environment) | `PAYLOAD_TEST_USER_EMAIL` / `PAYLOAD_TEST_USER_PASSWORD` | the preview seed-admin credentials, **distinct from Production's**, added under the same `Preview` environment; the `deploy` job declares `environment: Preview` and injects them into the deployment so the app self-seeds |
| GitHub variable | `TURSO_GROUP` | *(optional)* the group the database is created in |
| GitHub variable | `VERCEL_PREVIEW_ALIAS_PREFIX` | *(optional)* the `.vercel.app` label to prefix the stable per-PR alias; defaults to the repository name's first dot-delimited label with any domain suffix dropped (e.g. `btnopen` from `btnopen.com`), yielding `<prefix>-pr-<n>.vercel.app` |

`VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID` already exist for the
production deploy and are reused as-is. No parent-database variable is needed —
previews are seeded, not branched.

The rest is **Vercel project settings**, under Settings → Environment Variables.
The production `LIBSQL_PAYLOAD_TURSO_DATABASE_URL` and
`LIBSQL_PAYLOAD_TURSO_AUTH_TOKEN` MUST be scoped to the **Production** environment
only — this is the critical safety measure: with the production credentials absent
from Preview, no preview build can reach production even if the workflow is
bypassed (Payload falls back to a local file). The `LIBSQL_*` variables MUST NOT
be set for the Preview environment at all; the workflow injects the per-PR
database credentials per deployment.

The Preview environment's `BLOB_PAYLOAD_READ_WRITE_TOKEN` MUST point at a
**dedicated preview Blob store**, separate from production, and the production
store token MUST be scoped to **Production** only — so a preview shares neither
media nor credentials with production. Add that same preview store token as the
`BLOB_PAYLOAD_READ_WRITE_TOKEN` secret under the **`Preview`** GitHub Actions
environment (not a plain repository secret) so `teardown` can prune it. The
Preview environment's other non-database variables (`PAYLOAD_SECRET`, Sentry
variables) MUST be configured so a preview can build and run, and a distinct
Preview `PAYLOAD_SECRET` SHOULD be used, so preview session cookies and tokens
cannot interoperate with production.

`BLOB_PAYLOAD_PREFIX` MUST NOT be set in any environment by hand — the workflow
injects `pr-<n>` per preview, and production and local development intentionally
leave it empty.

The Preview `PAYLOAD_TEST_USER_*` values come from the `Preview` **GitHub
Actions** environment and are injected by the `deploy` job, so they need not be
set in the Vercel Preview environment; the Production values are set in the Vercel
**Production** environment and must differ from the Preview ones.

## First-Run Verification

End-to-end pipeline behaviour depends on live Turso and Vercel accounts, so it is
verified by exercising a real pull request after setup rather than by the
repository's automated tests. The confirmation follows that pull request's own
order:

1. After completing setup, a throwaway pull request MUST be opened, and it MUST
   be confirmed that the `deploy` job runs (not skipped), a `preview-pr-<n>`
   database appears in `turso db list`, a comment posts a working
   `<prefix>-pr-<n>.vercel.app` URL, and the site renders with the **seeded
   fixture content** (not production content).
2. It MUST be confirmed that pushing a second commit appends a **new** comment
   (not an edit of the first) and that the stable URL still resolves to the latest
   deployment.
3. It MUST be confirmed that neither `LIBSQL_*` nor the preview Blob token appears
   unmasked in the workflow logs.
4. It MUST be confirmed that closing the pull request runs `teardown`, posts a
   teardown comment, removes `preview-pr-<n>` from `turso db list`, and leaves no
   blobs under `pr-<n>/` in the preview store.

## Cost, Cleanup, and Limitations

Each open pull request holds one extra database until close, so an orphaned
preview database — from a pull request closed while a run was cancelled, for
instance — SHOULD be removed with `turso db destroy preview-pr-<n> --yes`.
Orphaned `pr-<n>/` media SHOULD be pruned manually the same way when the automatic
prune could not run: the `teardown` prune step is skipped when the
`BLOB_PAYLOAD_READ_WRITE_TOKEN` secret is absent.

Concurrent pull requests MUST NOT be assumed to interfere: each gets its own
database, preview, and `pr-<n>/` media prefix.

## Media Isolation via Blob Prefix

`BLOB_PAYLOAD_PREFIX` (read in [`payload/config.ts`](../../payload/config.ts))
namespaces every uploaded file under that path in the Vercel Blob store. The
deploy job injects `pr-<n>` for each preview, so a pull request's media lives
under `pr-<n>/…` and never collides with production (which leaves the prefix
unset, keeping its keys flat) or with another pull request. The `prefix` field the
storage plugin persists per document is what makes an uploaded file's URL
reproducible, so it is added to the schema in every environment
(`alwaysInsertFields`) to keep generated migrations deterministic even though
local development and production run with an empty prefix.

`BLOB_PAYLOAD_PREFIX` MUST therefore be kept empty (unset) in production and local
development so existing media keys stay flat; only preview deployments set it.
Migrations MUST likewise be generated with `BLOB_PAYLOAD_PREFIX` unset, so the
`prefix` column's default stays a stable `''` rather than baking a preview value
into the schema.

A closed pull request's media MUST be pruned on teardown by deleting everything
under its `pr-<n>/` prefix — the `teardown` job runs
[`scripts/prune-preview-blobs.mjs`](../../scripts/prune-preview-blobs.mjs)
(`@vercel/blob` `list` + `del`, paginated) against the preview store, from a
throwaway directory with a standalone install so it never depends on the
repository lockfile. The step is a clean skip when the
`BLOB_PAYLOAD_READ_WRITE_TOKEN` secret is absent. Preview media MUST live in a
store **dedicated** to previews; the prefix isolates keys within that store, and
the dedicated store additionally isolates credentials from production.

## Data Isolation and Exposure

A preview runs on a fresh, empty Turso database seeded from the repository's own
fixtures and writes media to a dedicated preview Blob store, so by construction it
holds no production content — no production `users`, `payload-mcp-api-keys`, or
blog data — even though its Payload admin and MCP endpoints are live on a
publicly reachable URL. The exposure to guard against is therefore a regression
that reintroduces production data or credentials into a preview, not the steady
state.

Production `LIBSQL_*` credentials MUST NOT be routed to a preview deployment, the
production database MUST NOT be branched or copied into a preview, and a preview
MUST NOT otherwise be allowed to reach the production database. A preview's
`BLOB_PAYLOAD_READ_WRITE_TOKEN` MUST NOT point at the production Blob store, so
preview CMS writes cannot mutate or read production media.

A distinct Preview `PAYLOAD_SECRET` MUST be used, so preview session cookies and
tokens cannot interoperate with production. The preview `PAYLOAD_TEST_USER_*` seed
credential MUST be kept distinct from Production's. Both are environment-scoped
secrets — the preview value lives in the `Preview` GitHub Actions environment and
is injected at deploy — and the preview admin login is publicly reachable, so
reusing the Production value would expose Production admin access. The credential
must never be committed or written to logs.

Preview media SHOULD be verified to stay namespaced under the per-PR `pr-<n>/`
prefix and to be pruned on teardown, so one preview cannot read or clobber
another's uploads within the shared preview store.
