# Preview Deployments

Every pull request gets its own **isolated preview deployment** so changes can be
reviewed with the real look and feel before merge. The hard requirement is that a
preview can **never** corrupt the production database, even in the worst case.

Because the Payload CMS instance is backed by SQLite on
[Turso](https://turso.tech), a naive branch deployment would point every preview
at the single production database. This setup avoids that entirely: each pull
request runs against a **throwaway copy** of the database, branched from
production and destroyed when the pull request closes.

## How it works

Two workflows drive the lifecycle:

- [`preview-deploy.yaml`](./workflows/preview-deploy.yaml) — on every push to an
  open pull request:
  1. Branches an isolated Turso database `btnopen-preview-pr-<number>` from
     production (`turso db create --from-db`). The copy is created once and
     reused across later pushes so preview-side state survives.
  2. Mints a scoped auth token for that database and applies the branch's
     migrations to it (`npm run migrate:up`).
  3. Deploys a Vercel **preview** build, injecting only the per-branch database
     credentials via `vercel deploy --build-env / --env`. Every other secret
     comes from the project's Preview-scoped environment variables.
  4. Comments the preview URL on the pull request.
- [`preview-teardown.yaml`](./workflows/preview-teardown.yaml) — when a pull
  request closes (merged or not), destroys `btnopen-preview-pr-<number>`.

Writes from a preview — admin edits, drafts, MCP mutations — land only in that
branch's copy. Production is never a write target. Both workflows also refuse to
run if the derived preview database name is empty or resolves to the production
name, so a misconfiguration cannot aim a migration or a `destroy` at production.

### Concurrency

Each pull request uses its own database and its own concurrency group, so
multiple pull requests (for example, several AI agents working in parallel)
deploy and run independently. Within a single pull request, a new push cancels
the previous in-flight deploy.

## One-time setup

### 1. Turso API token

Create a non-interactive Platform API token and add it as a repository secret:

```bash
turso auth api-tokens create preview-ci
```

The production database and each preview copy must live in the **same Turso
group** — `turso db create --from-db` branches within the source's group.

### 2. Repository secrets

| Secret | Purpose |
| --- | --- |
| `TURSO_API_TOKEN` | Non-interactive auth for the Turso CLI. |
| `TURSO_PRODUCTION_DB_NAME` | Name of the production Turso database to branch from. |
| `VERCEL_TOKEN` | Deploy to Vercel (already used by production deploys). |
| `VERCEL_ORG_ID` | Vercel org (already configured). |
| `VERCEL_PROJECT_ID` | Vercel project (already configured). |

### 3. Vercel environment variables

Most of what a preview needs is **already provided** — either by Vercel or by the
project's existing variables — so this step is mostly verification rather than new
configuration.

**Provided by Vercel automatically — no setup.** Vercel injects its
[system environment variables](https://vercel.com/docs/environment-variables/system-environment-variables)
into every deployment at build and runtime, and previews get them for free. The
app already relies on these:

- `VERCEL_URL` — the preview's own host; `runtime.ts` uses it to resolve absolute
  URLs (OG, canonical, cache-invalidation target) to the preview itself.
- `NEXT_PUBLIC_VERCEL_ENV` — distinguishes `preview` from `production`.
- `VERCEL_PROJECT_PRODUCTION_URL` and `NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA`.

**Inherited from existing project variables — verify scope.** Application secrets
are not Vercel-provided, but they already exist on the project for production. A
Vercel variable applies to every environment its scope includes, so if these are
scoped to include **Preview** (the default when a variable is added), previews
inherit them with no re-entry:

| Variable | Preview value | Why |
| --- | --- | --- |
| `PAYLOAD_SECRET` | Same value as production | Decrypts data carried over in the cloned database. |
| `BLOB_PAYLOAD_READ_WRITE_TOKEN` | Production blob store token | Serves existing images so previews render real media. See the trade-off below. |

Verify with `vercel env ls preview`; if either is missing from Preview, add it
with the same value production uses.

**Must NOT reach Preview.** Scope these to exclude Preview:

- `LIBSQL_PAYLOAD_TURSO_DATABASE_URL` / `LIBSQL_PAYLOAD_TURSO_AUTH_TOKEN` — scope
  to **Production only**. The workflow injects the ephemeral copy's credentials
  per deployment (`--env` / `--build-env`), which override any project value;
  keeping the production credentials out of Preview scope is defense-in-depth so a
  preview can never fall back to the production database.
- `PAYLOAD_TEST_USER_EMAIL` / `PAYLOAD_TEST_USER_PASSWORD` — these trigger the
  `onInit` seed, which would upload a seed avatar to the shared blob store. Keep
  them out of the Preview scope (scope them to Production/Development only, or add
  empty Preview overrides) so previews stay read-only against production media.
  Consequently, previews are for reviewing **public pages**; the admin panel is
  not provisioned with a known login.

## Trade-offs and limits

- **Blob store.** Previews read the production blob store so existing images
  render. Vercel Blob tokens are read-write, so a preview *could* mutate
  production media — but only via an explicit admin upload/delete, which the
  read-only review flow never performs. To eliminate even that coupling, point
  `BLOB_PAYLOAD_READ_WRITE_TOKEN` at a **separate preview blob store**; the
  cost is that images uploaded to production before the branch was taken will
  not resolve in previews.
- **Fork pull requests are skipped.** GitHub withholds secrets from forked
  pull requests, so an isolated database cannot be provisioned for them. Preview
  deployments run only for branches pushed to this repository.
- **Turso quota.** Each open pull request consumes one database from the Turso
  plan quota until it is closed. Closing a pull request frees it.
- **Snapshot freshness.** A preview's data is a snapshot of production taken when
  the copy is first created for that pull request; later production changes are
  not pulled in. Close and reopen the pull request to reclone.
