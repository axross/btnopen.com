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
[`AGENTS.md`](AGENTS.md) and routes to the detailed skills under
[`.claude/skills/`](.claude/skills/), following the tool-agnostic
[AGENTS.md](https://agents.md) convention so any AI coding assistant can
consume the same guidance — Claude Code is one supported option among others.
Human and agent contributors follow the same loop: plan → implement →
self-review → verify → report, and changes made without an agent meet the same
bar: branch, implement, run the checks below, open a pull request, and get it
reviewed before merge.

### `/address` — deliver a unit of work end-to-end

[`/address`](.claude/commands/address.md) is the main delivery entry point. It
takes one unit of work — a GitHub issue, a pull request, or a free-form
prompt — from intake to a merge-ready pull request in a single continuing
session:

1. **Plan** — reads the issue and its thread, asks the product and scope
   questions the spec leaves open, and rewrites the issue body into a
   reviewable plan with acceptance criteria.
2. **Code + verify** — implements on an agent-namespaced branch, runs the
   checks the changed surface requires, and self-reviews the diff.
3. **Independent review** — opens a draft pull request and requests the CI
   reviewer, a separate bot session, so the code's author never certifies its
   own work.
4. **Address** — fixes review findings and CI failures, tying each resolved
   thread to the resolving commit, for up to four rounds.
5. **Ready** — flips the pull request to ready and pings the maintainer once
   CI is green and the review is clean. Merging always stays a human decision.

The run pauses whenever it genuinely needs a human — an ambiguous requirement,
a plan approval, a judgment call on conflicting changes — and `/address
continue` picks it back up where it stopped.

### `/review` — get findings on any diff

[`/review`](.claude/commands/review.md) runs this repository's review policy
([`REVIEW.md`](REVIEW.md)) — severity-tagged findings with `file:line`
evidence and concrete fixes — on a pull request (`/review 57`), a ref range
(`/review main...feature`), or the current branch's diff (`/review`). Use it
for a pre-merge check on a hand-written change or a second opinion before
pushing; the same policy runs automatically in CI
([`claude-review.yaml`](.github/workflows/claude-review.yaml)) against
`/address` pull requests.

### `/handoff` — suspend work for another session

[`/handoff`](.claude/commands/handoff.md) packages in-progress work — goal,
current state, remaining to-dos, uncommitted changes — into a downloadable
`handoff-<epoch>.md` (plus an optional zip of supporting files). Use it when a
session is running low on context, or to park work for later; a fresh session
takes the package over with `/address continue`.

### `/author` and `/polish` — blog content

[`/author`](.claude/commands/author.md) turns a short summary into a draft
blog post, and [`/polish`](.claude/commands/polish.md) reviews and refines an
existing one. Both operate on drafts through the Payload MCP server (below) and
return a preview URL for review before publishing.

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

## Connecting AI agents to Payload CMS (MCP)

Payload exposes a [Model Context Protocol](https://modelcontextprotocol.io)
(MCP) server, so any MCP-capable AI agent can inspect and edit CMS content —
blog posts, tags, cover images, media, and the site profile — through a single
authenticated endpoint. This is what powers the AI blogging workflow (`/author`
and `/polish`); the agent-facing operating rules live in
[`.claude/skills/payload-cms-mcp/`](.claude/skills/payload-cms-mcp/SKILL.md).

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
`.mcp.json` automatically — no per-session registration or approval — so
`/author` and `/polish` work out of the box once two things are configured
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
**draft-scoped** key: `/author` and `/polish` operate on drafts you review at
`/posts/<slug>?draft=true` before publishing.

## Testing

Unit tests ([Jest](https://jestjs.io)) cover pure logic and schema behavior;
end-to-end tests ([Playwright](https://playwright.dev)) cover route output and
browser behavior. Run format + lint after every change, and the suites relevant
to the changed surface before opening a pull request — see the Verification
section of [`AGENTS.md`](AGENTS.md).

| Check | Command |
| ----- | ------- |
| Format | `npm run format` |
| Lint | `npm run lint` |
| Unit tests | `npm run test:unit` |
| E2E tests | `npm run test:e2e` |

## Related links

- [Next.js Documentation](https://nextjs.org/docs) — Next.js features and API.
- [Payload CMS Documentation](https://payloadcms.com/docs) — collections,
  fields, and access control.
- [Claude Code on the web](https://code.claude.com/docs/en/claude-code-on-the-web)
  — configuring cloud sessions and environments.
- This site deploys to [Vercel](https://vercel.com); see the
  [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying)
  for details.
