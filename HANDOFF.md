<!--
TEMPORARY handoff document. Delete it once the preview-deployment rollout is
complete. It is a transition brief for another session, not permanent project
documentation.
-->

# Handoff: Isolated per-PR preview deployments + Turso account switch

This branch adds **preview deployments** so that AI-agent pull requests (from the
`/address` flow) can be reviewed with real look-and-feel before merge. This
document is a self-contained brief so another session can continue the work.

**Branch:** `claude/upbeat-cori-ok1fg3` (do all work here; never push elsewhere).
The branch has been rebased onto the current `main`; the commits carry the same
changes described below plus a follow-up commit that adds the `Turso Check`
workflow and switches `TURSO_PRODUCTION_DB_NAME` from a secret to a repository
variable.

Read `.github/preview-deployments.md` and `AGENTS.md` before acting. Follow the
project workflow rules in `AGENTS.md` (format/lint/test, Conventional Commits,
self-review, high-risk escalation).

---

## 1. Background / why

- The site is Next.js + Payload CMS. Payload's database is SQLite on **Turso**
  (libSQL). Blog posts, media, tags, the site profile all live there.
- Problem: agents open PRs but the human cannot see the actual rendered result,
  because there is no branch/preview deployment.
- Blocker to naive previews: with a single Turso database, every preview would
  point at the **production** DB. Admin edits, the Payload MCP plugin, `onInit`
  seeding, and drafts are all live write paths, and a branch's migrations could
  advance prod's schema — any of which can corrupt production.
- Chosen solution: **Option C — ephemeral, isolated per-PR databases.** Each PR
  gets its own throwaway Turso database branched from production, migrated, and
  deployed as a Vercel **preview**; the database is destroyed when the PR closes.
  Writes from a preview only ever hit that copy. Distinct PRs use distinct
  databases so multiple agents can work in parallel (a hard requirement).

## 2. What is already done (committed on this branch)

| File | What it does |
| --- | --- |
| `.github/workflows/preview-deploy.yaml` | On PR open/sync/reopen: branch `btnopen-preview-pr-<n>` from prod (`turso db create --from-db`), migrate it, `vercel deploy` (preview) injecting only the per-branch DB creds via `--env`/`--build-env`, comment the URL on the PR. Guards against the DB name being empty or equal to production. Masks the minted token. Skips forked PRs. Concurrency group per PR. |
| `.github/workflows/preview-teardown.yaml` | On PR close: `turso db destroy` the copy, update the PR comment. Same production-name guard. |
| `.github/scripts/verify-preview-db.sh` | **Temporary** smoke test: branches a throwaway DB from prod, resolves URL, mints a token, destroys it — the exact ops the workflow uses — without touching prod. Self-cleans on exit. Delete after the pipeline is proven. |
| `.github/preview-deployments.md` | The canonical setup + operations doc (secrets, Vercel env scoping, Turso token scoping, trade-offs). Keep this current. |
| `.github/workflows/turso-check.yaml` | Manually dispatched verification (Actions → Turso Check). `check: database` runs the connection + `migrate:status` check (optionally `migrate:up`) against Vercel production env or the `TURSO_CHECK_*` repo secrets; `check: preview-ops` runs `verify-preview-db.sh` in CI. This is how Phases A and C are verified, since agent environments cannot reach Turso. |
| `app/(app)/_/runtime.ts` | Preview deployments now resolve `urlOrigin` to their own host via `VERCEL_URL` (was hardcoded to `localhost` for non-prod). Production path unchanged. |
| `README.md` | Pointer to the preview-deployments doc. |

Design details already baked in:

- Previews are **read-only against production media**: the seed user vars are
  deliberately kept out of Preview so `onInit` never runs and never uploads to
  the shared blob store. Previews are for reviewing **public pages**; the admin
  panel is not provisioned with a login.
- `payload migrate` reads env only from root-level `.env*` files (not shell
  exports), so the deploy workflow writes the ephemeral creds to `.env.local`
  before `npm run migrate:up`.
- Vercel **system** env vars (`VERCEL_URL`, `VERCEL_ENV`, etc.) are auto-provided;
  app secrets (`PAYLOAD_SECRET`, `BLOB_PAYLOAD_READ_WRITE_TOKEN`) are **inherited**
  by Preview if their Vercel scope includes Preview — so they usually need no
  re-entry, only verification.

## 3. The pivot that triggered this handoff — Turso account switch

The production database currently lives in a **Vercel-linked Turso account**, and
that account **cannot create Platform API tokens**. The preview automation
requires a Platform API token (control-plane: create/destroy databases, mint
tokens) — a database auth token cannot do those operations.

**Decision:** move **production** onto a **new standalone Turso account** (not
tied to Vercel), which can mint API tokens. Because branching
(`turso db create --from-db`) cannot cross accounts, production must live in the
same account as the previews for the clone-per-PR design to work. Once prod is
moved, both prod and previews are in the new account and everything already
committed works as-is.

New account's group (given by the human): `icfg-vvcitrwxhnlyw1ppxk3hrjso-aws-us-west-2`.

## 4. HARD CONSTRAINT for whatever environment runs this

**Turso is not reachable from the Claude cloud environments used so far** — the
egress policy blocks `*.turso.io` (verified in two separate sessions: proxy
returns `403` on CONNECT to `turso.io`). Any `turso` CLI or libsql connection
will fail there.

The Turso-touching steps must therefore run either:
- in **GitHub Actions** via the `Turso Check` workflow (GitHub-hosted runners
  reach Turso fine) — this is the sanctioned path for Phases A and C, or
- **locally by the human** (dump/restore, token creation), handing only the
  results (URLs, tokens, DB names) back.

Do **not** try to route around the egress policy. Do **not** ask the human to
paste live DB URLs/tokens into chat if they can be set as environment variables
or GitHub/Vercel secrets instead.

## 5. Do this — ordered plan

> Confirm the open decisions in §6 with the human before Phase B (it moves
> production data).

### Phase A — Verify the new account's database works
1. Human: add the new DB's libsql URL + auth token as the repository secrets
   `TURSO_CHECK_DATABASE_URL` and `TURSO_CHECK_AUTH_TOKEN` (do not paste them
   into chat).
2. Connection + migration-status test (read-only): run the **Turso Check**
   workflow (Actions → Turso Check → Run workflow) with `check: database`,
   `source: check-secrets`, `apply_migrations: false`.
3. Functionality test (writes schema — only on the intended DB): re-run it with
   `apply_migrations: true`. Note: if Phase B loads a full production dump
   afterwards, recreate the database first so the dump does not collide with
   the already-applied schema.
4. Delete the two `TURSO_CHECK_*` secrets once the cutover is complete.

### Phase B — Cut production over to the new account (production-affecting)
1. Do it in a quiet window; avoid admin edits between dump and repoint or those
   writes are lost.
2. Dump old prod → load new:
   ```bash
   turso db shell '<OLD_URL>' --auth-token '<OLD_TOKEN>' '.dump' > prod.sql
   turso db shell '<NEW_URL>' --auth-token '<NEW_TOKEN>' < prod.sql
   ```
3. Spot-check row counts / key records match between old and new.
4. **Disconnect the Vercel⇄Turso integration** (the `LIBSQL_PAYLOAD_TURSO_*`
   names look integration-injected; if left connected it may overwrite the vars).
   Then set **Production** `LIBSQL_PAYLOAD_TURSO_DATABASE_URL` and
   `LIBSQL_PAYLOAD_TURSO_AUTH_TOKEN` to the new account's values manually.
5. Redeploy production; verify the live site (posts, images, admin login).
   - `PAYLOAD_SECRET` stays the same, so encrypted fields still decrypt; the
     migrations table rides along in the dump; blob storage is untouched.

### Phase C — Turn on the preview automation
1. In the new account, mint a **group-scoped, full-access** Platform API token
   (NOT `--read-only`). Verify flags with `turso auth api-tokens --help` first:
   ```bash
   turso auth api-tokens mint preview-ci \
     --org <your-org> \
     --group icfg-vvcitrwxhnlyw1ppxk3hrjso-aws-us-west-2   # no --read-only
   ```
2. Add the GitHub repo **secret** `TURSO_API_TOKEN` (above) and the repo
   **variable** `TURSO_PRODUCTION_DB_NAME` (the new prod DB name — it is a
   variable, not a secret, since a DB name is not sensitive).
   (`VERCEL_TOKEN`/`VERCEL_ORG_ID`/`VERCEL_PROJECT_ID` secrets already exist.)
3. Vercel env scoping:
   - Verify **Preview** scope includes `PAYLOAD_SECRET` and
     `BLOB_PAYLOAD_READ_WRITE_TOKEN` (`vercel env ls preview`).
   - Ensure `LIBSQL_PAYLOAD_TURSO_*` are scoped **Production only**.
   - Ensure `PAYLOAD_TEST_USER_EMAIL` / `PAYLOAD_TEST_USER_PASSWORD` are **not**
     in Preview scope.
4. Ensure the prod DB and preview copies share the group above.
5. Smoke-test the token: run the **Turso Check** workflow with
   `check: preview-ops` (it runs `.github/scripts/verify-preview-db.sh` in CI
   using the secret and variable added in step 2).
6. Open a throwaway test PR → confirm a preview deploys and the URL is commented →
   close it → confirm the DB is destroyed.
7. **Delete `.github/scripts/verify-preview-db.sh` and the `preview-ops` job in
   `turso-check.yaml`** and commit the removal once the pipeline is proven.

### Phase D — Optional follow-ups
- ~~Add a `workflow_dispatch` CI job that runs the connection + `migrate:status`
  check~~ — **done**: `.github/workflows/turso-check.yaml`.
- ~~Change `TURSO_PRODUCTION_DB_NAME` from a **secret** to a repository
  **variable**~~ — **done** in both preview workflows + the doc.
- Delete this `HANDOFF.md`.

## 6. Open decisions to confirm with the human first

1. **Confirm the plan is to move production to the new standalone account** (§3).
   If instead prod stays in the Vercel-linked account, branching cannot work
   cross-account and the design must switch to **synthetic seeding** (fresh DB
   seeded from repo fixtures). That variant needs one code change: the seed's
   example post is created `draft: true`, so a synthetic preview would show an
   **empty public homepage** — it must be published in previews.
2. **Blob store for Preview:** reuse the production blob token (real images render;
   a preview could in theory write to prod media, but the read-only review flow
   never does) vs. a separate preview blob store (fully isolated; pre-existing
   images won't render). Current doc/design assumes reuse.

## 7. Facts & gotchas worth knowing

- **Platform API token (control plane) ≠ database auth token (data plane).** The
  automation needs the former; the app uses the latter. They are not
  interchangeable.
- **Group scope caveat:** because prod lives in the group, the automation token
  can read/destroy prod too — inherent to branching from prod. It only walls off
  *other* groups. The only way to keep the token unable to touch prod is the
  synthetic-seed variant.
- **`vercel deploy --env/--build-env`** set per-deployment vars that override
  project env; that's how the ephemeral DB creds are injected without touching
  project settings.
- **Forked PRs are skipped** (no secrets). Previews run only for same-repo
  branches.
- Each open PR consumes one Turso database from the account's quota until closed.

## 8. Verification expectations (project rules)

After code/doc edits: `npm run format`, `npm run lint`; `npm run test:unit` if
code the unit suite covers changed; `npm run build` for route/config/TS changes.
YAML workflow changes: validate they parse. The workflows themselves can only be
fully verified by a real test PR (Phase C). Use Conventional Commits. This is a
**high-risk** change (production data move, secrets, CI touching prod) — treat
the PR as the review gate and surface residual risk in the summary.
