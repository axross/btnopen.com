# Preview Deployments

Every pull request can get its own **Vercel preview deployment** — a live URL where the actual look and feel of a change can be reviewed before merging. The hard part is the database: Payload CMS is backed by SQLite over [Turso](https://turso.tech) (libSQL), and a naive preview that inherited the production credentials could read, mutate, or (via an unmerged migration) corrupt the production database.

This project resolves that with a **per-PR Turso branch**: each pull request is served by an isolated child database branched from production. It is migrated, wired into the preview deployment, and destroyed when the PR closes. Production is never reachable from a preview.

The pipeline lives in [`.github/workflows/preview-deploy.yaml`](.github/workflows/preview-deploy.yaml) and is **inert until the one-time setup below is done** — it skips cleanly (no failing check) whenever the required secrets and variables are absent.

## How it works

```text
pull_request (opened / synchronize / reopened)
        │
        ▼
  ┌───────────┐   required secrets/vars present?
  │ preflight │──── no ──▶ skip (no-op, green)
  └───────────┘
        │ yes
        ▼
  ┌─────────────────────────────────────────────┐
  │ deploy                                        │
  │  1. branch  preview-pr-<n>  from production   │  ← isolated copy, own storage
  │  2. run the PR's migrations against it        │  ← never touches production
  │  3. vercel deploy (preview), injecting the    │
  │     branch creds at build + runtime only      │
  │  4. sticky-comment the preview URL on the PR   │
  └─────────────────────────────────────────────┘

pull_request (closed)
        │
        ▼
  ┌─────────────────────────────────────────────┐
  │ teardown                                      │
  │  • turso db destroy preview-pr-<n>            │
  │  • update the sticky comment                  │
  └─────────────────────────────────────────────┘
```

Branching a Turso database creates a point-in-time copy with its own storage, so writes on the preview — including the PR's schema migrations and any CMS edits — stay entirely on the branch. The production credentials are **never** passed to a preview build; the branch's own URL and a freshly minted token are injected per deployment via `vercel deploy --env / --build-env`, overriding the project's Preview environment for that one deployment.

## Required one-time setup

These steps touch the GitHub and Vercel/Turso accounts and must be done by the maintainer; they cannot be performed from a coding session.

### 1. Turso

1. Install the [Turso CLI](https://docs.turso.tech/cli/introduction) and note the **production database name** (`turso db list`).
2. Mint an API token for CI:

   ```bash
   turso auth api-tokens mint github-preview-deploy
   ```

3. (Optional) note the database **group** if the production database is not in the default group (`turso group list`).

### 2. GitHub → repository settings

Add under **Settings → Secrets and variables → Actions**:

| Kind | Name | Value |
| --- | --- | --- |
| Secret | `TURSO_API_TOKEN` | the token minted above |
| Variable | `TURSO_PARENT_DATABASE` | the production database name to branch from |
| Variable | `TURSO_GROUP` | *(optional)* the group the branch should be created in |

`VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID` are already configured for the production deploy and are reused as-is.

### 3. Vercel → project settings

1. Under **Settings → Environment Variables**, make sure the **Preview** environment has the non-database variables the app needs to build and run — `PAYLOAD_SECRET`, the Vercel Blob token, Sentry variables, etc.
2. **Scope the production `LIBSQL_PAYLOAD_TURSO_DATABASE_URL` and `LIBSQL_PAYLOAD_TURSO_AUTH_TOKEN` to the _Production_ environment only.** This is the critical safety measure: with the production credentials absent from Preview, no preview build can reach production even if the workflow is bypassed — Payload falls back to a local file. Do **not** set these two variables for the Preview environment; the workflow injects the branch credentials per deployment.

## Security trade-offs

Branching production means the preview database is a **full copy of production content**, which for this project includes sensitive rows:

- `users` — including hashed passwords.
- `payload-mcp-api-keys` — the MCP API keys.

The preview URL is public and its Payload admin / MCP endpoints are reachable. Mitigations:

- **Use a distinct `PAYLOAD_SECRET` for the Preview environment**, so preview session cookies and tokens cannot interoperate with production.
- Treat preview URLs as sensitive and share them only with reviewers.
- **Media / Vercel Blob is not isolated by this workflow.** If the Preview `BLOB_PAYLOAD_READ_WRITE_TOKEN` points at the production blob store, CMS writes on a preview could mutate production media. Point Preview at a separate blob store, or treat previews as read-only for media. Database isolation was the scoped goal here; blob isolation is a follow-up if preview write-flows are needed.

If a preview only needs to render the public site (the common case for UI review), consider minting a **read-only** branch token and skipping the migration step — that removes all write exposure at the cost of not exercising schema changes.

## First-run verification

After completing the setup, open a throwaway pull request and confirm:

1. The **Preview Deploy** workflow runs the `deploy` job (not skipped).
2. A `preview-pr-<n>` database appears in `turso db list`.
3. The sticky preview comment posts a URL, and the site renders with production-like content.
4. `LIBSQL_*` never appears unmasked in the workflow logs.
5. Closing the PR runs `teardown`, and `preview-pr-<n>` disappears from `turso db list`.

## Cost and cleanup

- Each open PR holds one extra Turso database; `teardown` removes it on close. Orphans (e.g. from a PR closed while a run was cancelled) can be removed with `turso db destroy preview-pr-<n> --yes`.
- Vercel preview deployments are managed by Vercel and need no manual cleanup.

## Limitations

- End-to-end pipeline behavior depends on live Turso and Vercel accounts and is verified by the first-run checklist above, not by the repository's automated tests.
- Concurrent PRs each get their own branch and preview; there is no cross-PR interference.
- Forked pull requests do not receive secrets, so the workflow skips them.
