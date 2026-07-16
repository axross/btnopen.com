# Preview Deployments

Apply these guidelines when working on the per-pull-request preview-deployment pipeline, or when configuring, verifying, or reasoning about branch deployments. The pipeline lets a reviewer see a PR's actual look and feel on a live Vercel URL without any risk to the production database, because Payload runs on a single Turso (SQLite) database that a naive preview could corrupt.

The security trade-offs of this design (branching copies production content into a publicly reachable preview) are owned by the project's application-security requirements (privacy-and-exposure rules); consult it before changing what data a preview receives or who can reach it.

## Pipeline Overview

The workflow is [`.github/workflows/preview-deploy.yaml`](../../../../.github/workflows/preview-deploy.yaml), triggered on `pull_request` `[opened, synchronize, reopened, closed]` and concurrency-grouped per PR. Each PR is served by an isolated Turso child database branched from production, migrated, wired into a Vercel preview deployment, and destroyed when the PR closes.

```text
pull_request (opened / synchronize / reopened)
        │
        ▼
  preflight ── required secrets/vars absent? ──▶ skip (no-op, green)
        │ present
        ▼
  deploy
   1. branch  preview-pr-<n>  from production   (isolated copy, own storage)
   2. run the PR's migrations against it          (never touches production)
   3. vercel deploy (preview), injecting the branch creds at build + runtime
   4. alias a stable per-PR URL to that deployment, then post a new comment
      with it (a fresh comment each deploy — prior ones are left intact)

pull_request (closed) ──▶ teardown: turso db destroy preview-pr-<n>; post a teardown comment
```

**Guidelines:**

- MUST keep the production `LIBSQL_*` credentials out of every preview: the workflow injects only the per-PR branch credentials via `vercel deploy --env` / `--build-env`, never the production ones.
- MUST keep the pipeline inert until setup exists — the `preflight` job gates `deploy`/`teardown` on the required secrets/vars so unconfigured and forked PRs stay green rather than failing.
- MUST keep branch provisioning idempotent across `synchronize` events (create the branch only if absent; re-running migrations is a no-op when the branch already carries production's applied migration state).
- MUST surface a **stable per-PR URL**, not the per-commit `vercel deploy` URL: after deploying, re-point a deterministic alias (`<prefix>-pr-<n>.vercel.app`) at the new deployment with `vercel alias set`, so the pull request's preview link stays constant across pushes and always serves the newest build. The alias step fails the job on error rather than falling back to the per-commit URL.
- MUST post a **new** comment on each deploy (and a distinct teardown comment on close) rather than editing one sticky comment — a fresh comment re-surfaces the deploy in the PR timeline, and each carries the deployed short SHA so the appended history stays meaningful even though the URL is constant.
- SHOULD grant `issues: write` to any job whose `github-script` step posts a PR comment — PR comments post through the Issues API, and an explicit `permissions:` block defaults every unlisted scope to `none`.

## Required One-Time Setup

These steps touch the GitHub and Turso/Vercel accounts and cannot be performed from a coding session; they are the maintainer's responsibility before the pipeline does anything.

**Turso and GitHub:**

| Kind | Name | Value |
|---|---|---|
| GitHub secret | `TURSO_API_TOKEN` | a CI token minted with `turso auth api-tokens mint <name>` |
| GitHub variable | `TURSO_PARENT_DATABASE` | the production database name to branch from |
| GitHub variable | `TURSO_GROUP` | *(optional)* the group the branch is created in |
| GitHub variable | `VERCEL_PREVIEW_ALIAS_PREFIX` | *(optional)* the `.vercel.app` label to prefix the stable per-PR alias; defaults to the sanitized repository name (e.g. `btnopen-com`), yielding `<prefix>-pr-<n>.vercel.app` |

`VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID` already exist for the production deploy and are reused as-is.

**Vercel project settings:** in the Vercel dashboard, under Settings → Environment Variables:

**Guidelines:**

- MUST scope the production `LIBSQL_PAYLOAD_TURSO_DATABASE_URL` and `LIBSQL_PAYLOAD_TURSO_AUTH_TOKEN` to the **Production** environment only — this is the critical safety measure: with the production credentials absent from Preview, no preview build can reach production even if the workflow is bypassed (Payload falls back to a local file).
- MUST NOT set the `LIBSQL_*` variables for the Preview environment; the workflow injects the branch credentials per deployment.
- MUST configure the Preview environment's non-database variables (`PAYLOAD_SECRET`, the Vercel Blob token, Sentry variables) so a preview can build and run.
- SHOULD use a distinct Preview `PAYLOAD_SECRET` per the project's application-security requirements (privacy-and-exposure rules).

## First-Run Verification

End-to-end pipeline behavior depends on live Turso and Vercel accounts, so it is verified by exercising a real PR after setup rather than by the repository's automated tests.

**Guidelines:**

- MUST, after completing setup, open a throwaway PR and confirm the `deploy` job runs (not skipped), a `preview-pr-<n>` database appears in `turso db list`, a comment posts a working `<prefix>-pr-<n>.vercel.app` URL, and the site renders with production-like content.
- MUST confirm that pushing a second commit appends a **new** comment (not an edit of the first) and that the stable URL still resolves to the latest deployment.
- MUST confirm `LIBSQL_*` never appears unmasked in the workflow logs.
- MUST confirm that closing the PR runs `teardown`, posts a teardown comment, and removes `preview-pr-<n>` from `turso db list`.

## Cost, Cleanup, and Limitations

**Guidelines:**

- SHOULD remove orphaned branch databases (e.g. from a PR closed while a run was cancelled) with `turso db destroy preview-pr-<n> --yes`; each open PR otherwise holds one extra database until close.
- SHOULD treat media (Vercel Blob) as not isolated by this pipeline — database isolation is the scoped goal; point Preview at a separate blob store if preview write-flows are needed.
- MUST NOT assume concurrent PRs interfere: each gets its own branch and preview.
