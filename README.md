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
| Comment authentication | Clerk |
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
| `npm run typecheck` | Runs `tsc --noEmit`. Needs no prior build. | After any change to TypeScript signatures, types, or imports. |
| `npm run test:unit` | Runs the Jest unit suite. | When a change affects code the unit suite covers. |
| `npm run test:e2e` | Runs the Playwright end-to-end suite. | When a change affects a UI output surface or e2e coverage. |
| `npm run test:e2e -- --update-snapshots` | Regenerates Playwright snapshots for the local platform. | Only when a visual change is intentional — pair it with the reason. |
| `npm run coverage:scenarios` | Runs the e2e suite, then enforces the scenario-coverage gate. | When a change adds or alters a user journey in `e2e/scenarios.md`. |
| `npx payload generate:importmap` | Regenerates `app/(payload)/admin/importMap.js` from the resolved Payload config. Invoked directly rather than through an npm script. | After adding or upgrading a Payload plugin, storage adapter, or custom admin component. |
| `npx payload generate:types` | Regenerates `payload/types.ts` from the resolved Payload config. Invoked directly rather than through an npm script. | After changing a Payload collection, global, or field. |
| `npm run migrate:status` | Shows the Payload migration status. | When investigating migration drift. |
| `npm run migrate:create` | Creates a migration after a schema change. | Immediately after changing a Payload collection schema. |
| `npm run migrate:up` | Applies pending migrations to the selected database. | Locally, before testing a schema change. |

`npm run lint`, `npm run typecheck`, `npm run test:unit`, and the **Payload
Artifacts** drift check are the four checks CI gates a merge on; the e2e suite and
its scenario-coverage gate run after merge, on `main`. Never edit an
already-applied migration file — create a new one instead. If a required command
cannot be run, say so — naming the command, the reason, and the residual risk —
rather than presenting the change as fully verified.

## Where everything else lives

- **[`docs/`](docs/index.md)** — the documentation root, in three parts:
  what the product does (`specs/`), how the code is written (`conventions/`),
  and how the repository is built and run (`operations/`), with the decision log
  beside them. Start at [`docs/index.md`](docs/index.md).
- **[`CLAUDE.md`](CLAUDE.md)** — the working agreement for agent sessions.
  Another assistant reading this repository should treat it the way the
  tool-agnostic [AGENTS.md](https://agents.md) convention would otherwise signal.
- **[`REVIEW.md`](REVIEW.md)** — the policy a posted code review applies.

## Related links

- [Next.js Documentation](https://nextjs.org/docs) — Next.js features and API.
- [Payload CMS Documentation](https://payloadcms.com/docs) — collections,
  fields, and access control.
- [Claude Code on the web](https://code.claude.com/docs/en/claude-code-on-the-web)
  — configuring cloud sessions and environments.
