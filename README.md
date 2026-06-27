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

This repository is AI-assistant-aware. Project conventions and workflow rules live in [`AGENTS.md`](AGENTS.md) and the skills under [`.agents/skills/`](.agents/skills/), following the tool-agnostic [AGENTS.md](https://agents.md) convention so that any AI coding assistant can consume the same guidance. Claude Code is one supported option among others — nothing here assumes a single tool.

### Claude Code

[Claude Code](https://claude.com/claude-code) reads `AGENTS.md` (via [`CLAUDE.md`](CLAUDE.md)) and the configuration under [`.claude/`](.claude/).

- **Cloud / web sessions** automatically run [`.claude/hooks/session-start.sh`](.claude/hooks/session-start.sh) (registered in the committed [`.claude/settings.json`](.claude/settings.json)). It installs mise, provisions the required Node version, copies `.env.example` to `.env.local`, and runs `npm install` so the environment is ready when a session starts. This hook is gated to the remote environment and does nothing locally.

- **Local quality hooks are opt-in.** They are not enforced on everyone, but they are recommended. To enable them, copy the example into your personal, git-ignored local settings:

  ```bash
  cp .claude/settings.local-example.json .claude/settings.local.json
  ```

  Once enabled, Claude Code will:
  - run `npm run format` after each code edit, and
  - run `npm run test:unit` and `npm run lint` before completing a task, surfacing any failures so they get fixed first.

  These hooks merge with the committed `settings.json`, so you keep the cloud `SessionStart` behavior and add the local checks on top. They use mise if it is installed and degrade gracefully otherwise.

## Learn More

To learn more about the stack:

- [Next.js Documentation](https://nextjs.org/docs) — Next.js features and API.
- [Payload CMS Documentation](https://payloadcms.com/docs) — collections, fields, and access control.

## Deploy on Vercel

This site deploys to [Vercel](https://vercel.com). See the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for details.
