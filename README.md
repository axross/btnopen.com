# btnopen.com

The source for **btnopen.com**, a personal blogging website built with
[Next.js](https://nextjs.org), [Payload CMS](https://payloadcms.com), and
TypeScript. It presents the author's portrait, bio, and social links, and
serves blog posts — the primary content type — with tags, cover images, and
rich Markdown including syntax-highlighted code and embedded web-content
previews. Content is authored primarily in Japanese, with English as a
fallback for other locales.

## Tech stack

| Area | Tool |
| ---- | ---- |
| Language | TypeScript |
| App framework / runtime | Next.js (App Router) |
| Package manager | npm |
| Linting & formatting | Biome |
| Unit tests | Jest |
| E2E tests | Playwright |
| Content layer | Payload CMS |
| Error tracking / logging | Sentry / Pino |
| Analytics | Mixpanel |
| Hosting | Vercel |

## Getting started

### Prerequisites

- **Node.js** matching the version in [`package.json`](package.json)
  (`devEngines.runtime` — currently `>=24`). Any Node install that satisfies
  it works; [mise](https://mise.jdx.dev) is optional and will pick the right
  version automatically if you use it.
- **npm** `>=10`.

### Setup

```bash
# install dependencies
npm install

# create your local environment file
cp .env.example .env.local
```

Then run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see
the result. For a production build, run `npm run build`, then `npm run start`.

## Development workflow

Development in this repository is agent-assisted via
[Claude Code](https://claude.com/claude-code). The working agreement lives in
[`AGENTS.md`](AGENTS.md), following the tool-agnostic
[AGENTS.md](https://agents.md) convention so any AI coding assistant can
consume the same guidance — Claude Code is one supported option among others.
It states how every session runs and defers the detail to the skills under
[`.claude/skills/`](.claude/skills/), which agents find through their own
frontmatter rather than through an index.
Human and agent contributors follow the same loop: plan → implement →
self-review → verify → report, and changes made without an agent meet the same
bar: branch, implement, run the [checks](#commands), open a pull request, and
get it reviewed before merge.

### Agent skills

Most of the guidance agents follow here is **installed**, not written in this
repository. Twenty-two skills come from the shared
[axross/skills](https://github.com/axross/skills) library and are copied into
[`.claude/skills/`](.claude/skills/) with the
[vercel-labs/skills](https://github.com/vercel-labs/skills) CLI, pinned by
[`skills-lock.json`](skills-lock.json):

```bash
# refresh exactly the skills this project already manages
npx skills add axross/skills --agent claude-code --yes --copy \
  $(node -p "Object.keys(require('./skills-lock.json').skills).map(s => '--skill ' + s).join(' ')")
```

**Do not use `--skill '*'` here.** Against an external source it installs the
library's *entire* catalogue, not the subset in `skills-lock.json` — today that
would silently adopt the Expo, TanStack Query, and Amplitude layers, none of
which this project uses. The command above derives the list from the lockfile
instead, so it stays correct as the set changes.

Adopting a new skill means naming it explicitly, and `--skill` takes exactly
one skill per flag: repeat the flag (`--skill a --skill b`) rather than passing
a comma-separated list. A comma-separated value matches nothing, installs
nothing, writes no lockfile, and reports an available-skill list that reads
like ordinary help rather than a failure.

Those copies are **generated artifacts**. Editing one is pointless — the next
install discards it — so a change to an installed skill goes upstream to the
library as an issue or pull request there. Commit the regenerated directories
and `skills-lock.json` together.

Only three skills are this repository's own, holding what the library cannot
know about it: [`project-structure`](.claude/skills/project-structure/SKILL.md)
(layout, tiers, boundaries, Payload, observability, and test conventions),
[`visual-identity`](.claude/skills/visual-identity/SKILL.md) (the site's design
language and the CSS that encodes it), and
[`markdown-processing-guidelines`](.claude/skills/markdown-processing-guidelines/SKILL.md)
(the Remark/Rehype/Shiki pipeline). Every skill states its own scope in its
frontmatter, which is how agents find it — there is no separate index to keep
current.

### Delivering a unit of work end-to-end

The change loop is the library's `loop-engineering` skill. It runs
model-invoked — there is no slash command — so describing the work is enough: a
GitHub issue, a pull request, or a free-form request drives from intake to a
merge-ready pull request in one continuing session.

1. **Plan** — reads the issue and its thread, asks the product and scope
   questions the spec leaves open, and rewrites the issue body into a
   reviewable plan with acceptance criteria. It then **pauses for approval**:
   nothing is built until you review the plan and say to continue.
2. **Code + verify** — implements on an agent-namespaced `claude/` branch, runs
   the checks the changed surface requires, and self-reviews the diff.
3. **Independent review** — opens a draft pull request and requests the CI
   reviewer, a separate bot session, so the code's author never certifies its
   own work.
4. **Address** — fixes review findings and CI failures, tying each resolved
   thread to the resolving commit, for up to eight rounds.
5. **Ready** — flips the pull request to ready once CI is green and the review
   is clean. Merging always stays a human decision.

The run pauses whenever it genuinely needs a human — an ambiguous requirement,
the plan approval, a judgment call on conflicting changes — and telling the
session to continue picks it back up where it stopped.

### Blog post authoring

Writing and editing blog post content — driving a post from an idea or outline
to a reviewed draft, and refining existing posts — is handled by a separate
agent-skills library that connects to this site through the Payload MCP server
(below) and operates on drafts you review before publishing. This repository is
the source of truth for the [CMS content model](#cms-content-model) those skills
read and write, and keeps the code-facing skills — rendering, routing,
components, and the rest — here.

### Claude Code environment setup

- **Cloud / web sessions** automatically run
  [`.claude/hooks/session-start.sh`](.claude/hooks/session-start.sh)
  (registered in the committed [`.claude/settings.json`](.claude/settings.json),
  which also sets the default reasoning effort level). It installs mise,
  provisions the required Node version, copies `.env.example` to `.env.local`,
  and runs `npm install` so the environment is ready when a session starts. It
  also copies `settings.local-example.json` to `settings.local.json`, so the
  quality hooks below are enabled automatically in the cloud. This hook is
  gated to the remote environment and does nothing locally.
- **Local quality hooks are opt-in** — recommended, but not enforced on
  everyone. To enable them locally, copy the example into your personal,
  git-ignored local settings:

  ```bash
  cp .claude/settings.local-example.json .claude/settings.local.json
  ```

  Once enabled, Claude Code runs `npm run format` after each code edit, and
  `npm run test:unit` and `npm run lint` before completing a task, surfacing
  any failures so they get fixed first. These hooks merge with the committed
  `settings.json`, so you keep the cloud `SessionStart` behavior and add the
  local checks on top. They use mise if it is installed and degrade gracefully
  otherwise.

## CMS content model

All content lives in Payload CMS collections and one global, edited in the
Payload admin or through the MCP server (below). The main collections are
`blog-posts` (the primary content type), `tags`, `cover-images`, `media` (images
embedded in post bodies), and `payload-mcp-api-keys` (scoped keys for the MCP
server); the `website` global holds the site profile. Reader-facing fields are localized with **Japanese (`ja-JP`) as the
primary locale** and English as a fallback, and each post is served in a draft
or published state.

### Authoring artifacts: `outline` and `authoringNotes`

A `blog-posts` document carries two authoring-artifact fields — `outline` and
`authoringNotes` — on the collection's **Agentic** tab. They are the durable
state of the post's authoring workflow: they let a fresh agent session resume
work on a post from CMS state alone, so every tool that writes them must agree
on what belongs where. Both fields:

- are **never rendered** in the published post body — they are visible only on
  the noindex agentic view (`/posts/<slug>?agentic=true`, with `&draft=true` for
  a draft post), which is the surface to hand back after writing either field;
  and
- are **non-localized** — shared across locales, so no `locale` targeting
  applies to writing them.

What belongs in each field:

- **`outline`** is a direct map of the article body structure and nothing else:
  a single nested Markdown bullet list, one top-level bullet per body section in
  order, with each section's substance as nested child bullets. It carries no
  meta content.
- **`authoringNotes`** is everything _about_ the writing, as free-form Markdown:
  aims (ねらい), the conclusion (結論), the target reader (対象読者), the
  editorial policy (編集方針), progress (進行状態), and the pre-publication
  checklist (公開前チェックリスト).

| Content | Field |
| ------- | ----- |
| Body section structure and each section's substance | `outline` |
| ねらい / 結論 / 対象読者 / 編集方針 / 進行状態 / 公開前チェックリスト, and working notes | `authoringNotes` |

`authoringNotes` has a recommended structure so it stays usable as resumable
state: organize it under `## ねらい`, `## 結論`, `## 対象読者`, `## 編集方針`,
`## 進行状態`, and `## 公開前チェックリスト` headings (omitting any that are
genuinely empty; free-form working notes may follow). Keep a **single merged
`公開前チェックリスト`** rather than two overlapping checklists, and record
`進行状態` with the current phase, completed work, and links to any session
artifacts — that is what lets a fresh session resume the post from CMS state
alone.

The editorial craft for shaping these fields — the outline's nested-tree
discipline and the author's writing voice — and the end-to-end writing workflow
live in a separate agent-skills library that drives authoring through the
Payload MCP server below; this repository is the source of truth for the CMS
content model above.

## Connecting AI agents to Payload CMS (MCP)

Payload exposes a [Model Context Protocol](https://modelcontextprotocol.io)
(MCP) server, so any MCP-capable AI agent can inspect and edit CMS content —
blog posts, tags, cover images, media, and the site profile — through a single
authenticated endpoint. This is what powers AI-assisted blogging on the site: a
separate agent-skills library uses these tools to write and edit content, and
any MCP-capable agent can connect to the same endpoint.

**Endpoint.** The server is served by the Payload app itself, as HTTP
[JSON-RPC 2.0](https://www.jsonrpc.org/specification):

- Local: `http://localhost:3000/api/mcp` (while `npm run dev` is running)
- Deployed: `https://<your-site-origin>/api/mcp`

**Authentication.** Every request needs an API key sent as a bearer token:

```
Authorization: Bearer <API_KEY>
```

Create a key in the Payload admin under the **MCP API Keys** collection
(`payload-mcp-api-keys`). Each key is **scoped to a specific set of tools**, so
a key only grants the operations you enable on it — treat the key as a secret
and grant the narrowest set that the task needs.

**Registering the server with an agent.** This repository already ships a
committed [`.mcp.json`](.mcp.json) that registers the server for any MCP client
that reads it, with both the endpoint and the key sourced from environment
variables (so no secret lives in the repo):

```json
{
  "mcpServers": {
    "payload-btnopen": {
      "type": "http",
      "url": "${PAYLOAD_MCP_URL:-https://www.btnopen.com/api/mcp}",
      "headers": { "Authorization": "Bearer ${PAYLOAD_MCP_API_KEY:-}" }
    }
  }
}
```

The `url` defaults to production and can be overridden with `PAYLOAD_MCP_URL`
(e.g. `http://localhost:3000/api/mcp` for local development). Set
`PAYLOAD_MCP_API_KEY` in your environment before starting the agent; the empty
`:-` default keeps the config parseable when it is unset (the server simply
fails to authenticate rather than breaking the whole file).

**Claude Code cloud/web sessions.** Cloud sessions load and connect a committed
`.mcp.json` automatically — no per-session registration or approval — so the
MCP tools work out of the box once two things are configured
**once** in the
[Claude Code web environment settings](https://code.claude.com/docs/en/claude-code-on-the-web):

1. **Environment variables** (`.env` format, no quotes) — at minimum
   `PAYLOAD_MCP_API_KEY=<your production key>`, plus `PAYLOAD_MCP_URL` if you
   are not using the production default. These are visible to anyone who can
   edit the environment, so use a narrowly scoped key.
2. **Network access** — cloud egress is proxied and does not reach arbitrary
   hosts by default. Set the environment's network access to **Custom** and
   allowlist the production MCP host (`www.btnopen.com`), otherwise the MCP
   requests are blocked. The site canonicalizes to `www`, so
   `https://btnopen.com/api/mcp` answers with a `307` redirect to
   `https://www.btnopen.com/api/mcp`; allowlisting the bare `btnopen.com` alone
   is not enough because the redirect target is a different host (this is why
   the `.mcp.json` `url` above targets `www` directly — it also avoids a
   cross-host redirect that can drop the `Authorization` header).

For **local terminal** sessions, Claude Code marks a project `.mcp.json` server
pending until you approve it interactively; to skip the prompt, add
`"enableAllProjectMcpServers": true` to your **user** settings
(`~/.claude/settings.json`) — this flag is intentionally ignored in the repo's
committed `.claude/settings.json`, so it cannot be enabled repo-wide.

**Discovering the tools.** Because the available tools depend on the key, an
agent should call `tools/list` before anything else. Any HTTP client works —
for example:

```bash
curl -sS http://localhost:3000/api/mcp \
  -H "Authorization: Bearer $PAYLOAD_MCP_API_KEY" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

Depending on the key, the tools include `find*` operations for the collections
above, create/update/delete for CMS content, and custom body tools
(`appendNodeInBlogPostBody`, `deleteNodeInBlogPostBody`) for controlled edits to
a post's rich-text body.

**Caveats.** The endpoint runs on the Payload app, so the server must be
running and reachable at that origin. A key authenticates against **its own
environment's database** — a local key will not work against production, and
vice versa. A production key writes to the live CMS, so prefer a
**draft-scoped** key: the authoring workflow operates on drafts you review at
`/posts/<slug>?draft=true` before publishing.

## Commands

This table is the authoritative list of the repository's commands, for human
contributors and agents alike. `package.json` pins Node.js `>=24.0.0` and npm
`>=10.0.0`; respect those when running or upgrading.

| Command | What it does | When to run it |
| ------- | ------------ | -------------- |
| `npm run dev` | Starts the development server at `http://localhost:3000`, with Pino logs pretty-printed. | Manual browser verification of UI, route, metadata, or CMS-driven output. |
| `npm run build` | Builds the production bundle. | When a change affects routes, metadata, Payload config, runtime config, dependencies, or TypeScript signatures. |
| `npm run start` | Serves the build produced by `npm run build`. | Verifying production-only caching, image, or compiler behavior. |
| `npm run format` | Formats code and documentation with Biome. | After every set of edits, before committing. |
| `npm run lint` | Runs `biome check` — formatting and lint rules together. | After formatting; fix every reported error before finishing. |
| `npm run test:unit` | Runs the Jest unit suite. | When a change affects code the unit suite covers. |
| `npm run test:e2e` | Runs the Playwright end-to-end suite. | When a change affects a UI output surface or e2e coverage. |
| `npm run test:e2e -- --update-snapshots` | Regenerates Playwright snapshots for the local platform. | Only when a visual change is intentional — pair it with the reason. |
| `npm run coverage:scenarios` | Runs the e2e suite, then enforces the scenario-coverage gate. | When a change adds or alters a user journey in `e2e/scenarios.md`. |
| `npm run migrate:status` | Shows the Payload migration status. | When investigating migration drift. |
| `npm run migrate:create` | Creates a migration after a schema change. | Immediately after changing a Payload collection schema. |
| `npm run migrate:up` | Applies pending migrations to the selected database. | Locally, before testing a schema change. |

Unit tests ([Jest](https://jestjs.io)) cover pure logic and schema behavior;
end-to-end tests ([Playwright](https://playwright.dev)) cover route output and
browser behavior. `npm run lint` and `npm run test:unit` are the two checks CI
gates a merge on. Never edit an already-applied migration file — create a new
one instead. If a required command cannot be run, say so — naming the command,
the reason, and the residual risk — rather than presenting the change as fully
verified.

## Deployment

Two pipelines deploy this site, and both build on the GitHub Actions runner and
let Vercel publish only the result, so neither spends Vercel build credit.

- **Production** — [`docs/production-deployments.md`](docs/production-deployments.md).
  On push to `main`, lint and e2e run, then the deployment job applies pending
  Payload migrations to the production database **before** building and
  promoting the new code, so production never serves code whose schema outruns
  its database. Migration and credential failures are deliberately fatal. A
  destructive schema change must be split expand-then-contract across releases,
  because the promotion window briefly runs old code against the new schema.
- **Preview** — [`docs/preview-deployments.md`](docs/preview-deployments.md).
  Each pull request gets its own preview at a stable URL, backed by a fresh
  Turso database seeded from the repository's fixtures and a preview-only Blob
  store namespaced under a `pr-<n>/` prefix. A preview therefore holds no
  production data; both are destroyed when the pull request closes. That
  document also carries the one-time setup, the first-run verification, orphan
  cleanup, and the isolation rules that keep production credentials out of a
  preview.

## Related links

- [Next.js Documentation](https://nextjs.org/docs) — Next.js features and API.
- [Payload CMS Documentation](https://payloadcms.com/docs) — collections,
  fields, and access control.
- [Claude Code on the web](https://code.claude.com/docs/en/claude-code-on-the-web)
  — configuring cloud sessions and environments.
- This site deploys to [Vercel](https://vercel.com); see the
  [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying)
  for details.
- Pull requests can get their own isolated preview deployment; because Payload
  is backed by a single Turso (SQLite) database, previews use a per-PR Turso
  branch so they never touch production data — see
  [`docs/preview-deployments.md`](docs/preview-deployments.md) for the
  architecture and the one-time setup.
