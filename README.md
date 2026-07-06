This is the source for **btnopen.com**, a personal blogging website built with [Next.js](https://nextjs.org), [Payload CMS](https://payloadcms.com), and TypeScript.

## Getting Started

### Prerequisites

- **Node.js** matching the version in [`package.json`](package.json) (`devEngines.runtime` — currently `>=24`). Any Node install that satisfies it works; [mise](https://mise.jdx.dev) is optional and will pick the right version automatically if you use it.
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

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Common commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server. |
| `npm run build` | Production build. |
| `npm run lint` | Biome lint + format check. |
| `npm run format` | Biome auto-format. |
| `npm run test:unit` | Jest unit tests. |
| `npm run test:e2e` | Playwright end-to-end tests. |

## AI Coding Assistants

This repository is AI-assistant-aware. Project conventions and workflow rules live in [`AGENTS.md`](AGENTS.md) and the skills under [`.claude/skills/`](.claude/skills/), following the tool-agnostic [AGENTS.md](https://agents.md) convention so that any AI coding assistant can consume the same guidance. Claude Code is one supported option among others — nothing here assumes a single tool.

### Claude Code

[Claude Code](https://claude.com/claude-code) reads `AGENTS.md` (via [`CLAUDE.md`](CLAUDE.md)) and the configuration under [`.claude/`](.claude/).

- **Cloud / web sessions** automatically run [`.claude/hooks/session-start.sh`](.claude/hooks/session-start.sh) (registered in the committed [`.claude/settings.json`](.claude/settings.json)). It installs mise, provisions the required Node version, copies `.env.example` to `.env.local`, and runs `npm install` so the environment is ready when a session starts. It also copies `settings.local-example.json` to `settings.local.json`, so the quality hooks below are **enabled automatically in the cloud**. This hook is gated to the remote environment and does nothing locally.

- **Local quality hooks are opt-in.** They are not enforced on everyone, but they are recommended. To enable them locally, copy the example into your personal, git-ignored local settings:

  ```bash
  cp .claude/settings.local-example.json .claude/settings.local.json
  ```

  Once enabled, Claude Code will:
  - run `npm run format` after each code edit, and
  - run `npm run test:unit` and `npm run lint` before completing a task, surfacing any failures so they get fixed first.

  These hooks merge with the committed `settings.json`, so you keep the cloud `SessionStart` behavior and add the local checks on top. They use mise if it is installed and degrade gracefully otherwise.

## Connecting AI Agents to Payload CMS (MCP)

Payload exposes a [Model Context Protocol](https://modelcontextprotocol.io) (MCP) server, so any MCP-capable AI agent can inspect and edit CMS content — blog posts, tags, cover images, media, and the site profile — through a single authenticated endpoint. This is what powers the AI blogging workflow (drafting and refining posts); the agent-facing operating rules live in [`.claude/skills/payload-cms-mcp/`](.claude/skills/payload-cms-mcp/SKILL.md).

**Endpoint.** The server is served by the Payload app itself, as HTTP [JSON-RPC 2.0](https://www.jsonrpc.org/specification):

- Local: `http://localhost:3000/api/mcp` (while `npm run dev` is running)
- Deployed: `https://<your-site-origin>/api/mcp`

**Authentication.** Every request needs an API key sent as a bearer token:

```
Authorization: Bearer <API_KEY>
```

Create a key in the Payload admin under the **MCP API Keys** collection (`payload-mcp-api-keys`). Each key is **scoped to a specific set of tools**, so a key only grants the operations you enable on it — treat the key as a secret and grant the narrowest set that the task needs.

**Registering the server with an agent.** This repository already ships a committed [`.mcp.json`](.mcp.json) that registers the server for any MCP client that reads it, with both the endpoint and the key sourced from environment variables (so no secret lives in the repo):

```json
{
  "mcpServers": {
    "payload-btnopen": {
      "type": "http",
      "url": "${PAYLOAD_MCP_URL:-https://btnopen.com/api/mcp}",
      "headers": { "Authorization": "Bearer ${PAYLOAD_MCP_API_KEY:-}" }
    }
  }
}
```

The `url` defaults to production and can be overridden with `PAYLOAD_MCP_URL` (e.g. `http://localhost:3000/api/mcp` for local development). Set `PAYLOAD_MCP_API_KEY` in your environment before starting the agent; the empty `:-` default keeps the config parseable when it is unset (the server simply fails to authenticate rather than breaking the whole file).

**Claude Code cloud/web sessions.** Cloud sessions load and connect a committed `.mcp.json` automatically — no per-session registration or approval — so `/author` and `/polish` work out of the box once two things are configured **once** in the [Claude Code web environment settings](https://code.claude.com/docs/en/claude-code-on-the-web):

1. **Environment variables** (`.env` format, no quotes) — at minimum `PAYLOAD_MCP_API_KEY=<your production key>`, plus `PAYLOAD_MCP_URL` if you are not using the production default. These are visible to anyone who can edit the environment, so use a narrowly scoped key.
2. **Network access** — cloud egress is proxied and does not reach arbitrary hosts by default. Set the environment's network access to **Custom** and allowlist the production origin (`btnopen.com`), otherwise the MCP requests are blocked.

For **local terminal** sessions, Claude Code marks a project `.mcp.json` server pending until you approve it interactively; to skip the prompt, add `"enableAllProjectMcpServers": true` to your **user** settings (`~/.claude/settings.json`) — this flag is intentionally ignored in the repo's committed `.claude/settings.json`, so it cannot be enabled repo-wide.

**Discovering the tools.** Because the available tools depend on the key, an agent should call `tools/list` before anything else. Any HTTP client works — for example:

```bash
curl -sS http://localhost:3000/api/mcp \
  -H "Authorization: Bearer $PAYLOAD_MCP_API_KEY" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

Depending on the key, the tools include `find*` operations for the collections above, create/update/delete for CMS content, and custom body tools (`appendNodeInBlogPostBody`, `deleteNodeInBlogPostBody`) for controlled edits to a post's rich-text body.

**Caveats.** The endpoint runs on the Payload app, so the server must be running and reachable at that origin. A key authenticates against **its own environment's database** — a local key will not work against production, and vice versa. A production key writes to the live CMS, so prefer a **draft-scoped** key: `/author` and `/polish` operate on drafts you review at `/posts/<slug>?draft=true` before publishing.

## Learn More

To learn more about the stack:

- [Next.js Documentation](https://nextjs.org/docs) — Next.js features and API.
- [Payload CMS Documentation](https://payloadcms.com/docs) — collections, fields, and access control.

## Deploy on Vercel

This site deploys to [Vercel](https://vercel.com). See the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for details.

Pull requests get isolated **preview deployments**, each backed by a throwaway copy of the database branched from production and destroyed on close. See [`.github/preview-deployments.md`](.github/preview-deployments.md) for how it works and the one-time setup.
