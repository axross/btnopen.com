# Connecting an Agent to the CMS

Read this when wiring an MCP-capable agent to this site's Payload CMS. What the
server exposes — the collections, the tools, and the content model an agent reads
and writes — is in
[../specs/content-authoring.md](../specs/content-authoring.md); this document is
the setup.

## Endpoint

The server is served by the Payload app itself, as HTTP
[JSON-RPC 2.0](https://www.jsonrpc.org/specification):

- Local: `http://localhost:3000/api/mcp` (while `npm run dev` is running)
- Deployed: `https://<your-site-origin>/api/mcp`

## Authentication

Every request needs an API key sent as a bearer token:

```text
Authorization: Bearer <API_KEY>
```

Create a key in the Payload admin under the **MCP API Keys** collection
(`payload-mcp-api-keys`). Each key is **scoped to a specific set of tools**, so a
key only grants the operations enabled on it — treat the key as a secret and
grant the narrowest set the task needs.

## Registering the Server with an Agent

This repository ships a committed [`.mcp.json`](../../.mcp.json) that registers
the server for any MCP client that reads it, with both the endpoint and the key
sourced from environment variables, so no secret lives in the repository:

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
(for example `http://localhost:3000/api/mcp` for local development). Set
`PAYLOAD_MCP_API_KEY` in your environment before starting the agent; the empty
`:-` default keeps the config parseable when it is unset — the server simply fails
to authenticate rather than breaking the whole file.

Why the default targets `www` directly rather than the bare domain is in
[../decisions/2026-07-08-target-the-canonical-www-host-for-the-mcp-endpoint.md](../decisions/2026-07-08-target-the-canonical-www-host-for-the-mcp-endpoint.md).

## Claude Code Cloud and Web Sessions

Cloud sessions load and connect a committed `.mcp.json` automatically — no
per-session registration or approval — so the MCP tools work out of the box once
two things are configured **once** in the
[Claude Code web environment settings](https://code.claude.com/docs/en/claude-code-on-the-web):

1. **Environment variables** (`.env` format, no quotes) — at minimum
   `PAYLOAD_MCP_API_KEY=<your production key>`, plus `PAYLOAD_MCP_URL` if you are
   not using the production default. These are visible to anyone who can edit the
   environment, so use a narrowly scoped key.
2. **Network access** — cloud egress is proxied and does not reach arbitrary
   hosts by default. Set the environment's network access to **Custom** and
   allowlist the production MCP host (`www.btnopen.com`), otherwise the MCP
   requests are blocked. Allowlisting the bare `btnopen.com` alone is not enough,
   because the site canonicalizes to `www` and the redirect target is a different
   host.

For **local terminal** sessions, Claude Code marks a project `.mcp.json` server
pending until you approve it interactively; to skip the prompt, add
`"enableAllProjectMcpServers": true` to your **user** settings
(`~/.claude/settings.json`). That flag is intentionally ignored in the
repository's committed `.claude/settings.json`, so it cannot be enabled
repository-wide.

## Discovering the Tools

Because the available tools depend on the key, an agent should call `tools/list`
before anything else. Any HTTP client works:

```bash
curl -sS http://localhost:3000/api/mcp \
  -H "Authorization: Bearer $PAYLOAD_MCP_API_KEY" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

## Caveats

- The endpoint runs on the Payload app, so the server must be running and
  reachable at that origin.
- A key authenticates against **its own environment's database** — a local key
  will not work against production, and vice versa.
- A production key writes to the live CMS, so prefer a **draft-scoped** key: the
  authoring workflow operates on drafts you review at `/posts/<slug>?draft=true`
  before publishing.
