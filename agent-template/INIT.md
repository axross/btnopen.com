# INIT — Adapting this template to a project

This repository is a **reusable, framework-agnostic and AI-agent-agnostic
template** for an `AGENTS.md`-driven skill system. It ships:

- `AGENTS.md` — the master routing index + working agreement (the universal,
  agent-agnostic entry point).
- `CLAUDE.md` — a one-line binding (`@AGENTS.md`) so Claude Code loads `AGENTS.md`.
- `.agents/skills/**` — a generic, cross-project **skill core** (10 skills).
- `.claude/**` — an **example** Claude Code harness binding (hooks + settings).

Everything project-specific has been replaced with `{{TOKEN}}` placeholders or
neutral prose. This file tells an AI agent how to turn the template into a
working setup for one concrete project.

> **You are the agent running INIT.** Follow the steps in order. Do not skip
> Step 1 — the rest depends on its answers. Make changes only inside this
> template's files. When done, INIT.md and every `<!-- INIT: ... -->` /
> "TEMPLATE NOTE" / "_template note_" scaffold should be gone.

---

## Step 1 — Interview the user (REQUIRED, do this first)

You MUST ask the user the following before editing any file. Ask them together
(grouped), accept partial answers, and infer sensible defaults only for what the
user leaves unspecified — but never invent the project's goal or kind.

1. **Project kind.** What kind of project is this — a web app, mobile app, CLI,
   library, backend service, desktop app, something else? Does it have a
   user-facing UI surface?
2. **Frameworks & tooling.** Which does the project use for each of:
   - **App framework / runtime** (e.g. Next.js, React Native, Express, none)
   - **Unit test framework** (e.g. Jest, Vitest, pytest, none)
   - **E2E test framework** (e.g. Playwright, Cypress, none)
   - **Linter** (e.g. Biome, ESLint, Ruff)
   - **Formatter** (e.g. Biome, Prettier, gofmt)
   - **Package manager** (e.g. npm, pnpm, yarn, bun, pip)
   - **Primary language** (e.g. TypeScript, Python, Go)
   - Optional: **error tracker** (e.g. Sentry), **structured logger** (e.g.
     Pino), **data/content layer** (e.g. Payload CMS, Prisma, a REST API),
     **hosting platform** (e.g. Vercel).
3. **Rough picture.** In one or two sentences, what is the project's goal /
   overview? (This becomes the Project Overview in `AGENTS.md`.)
4. **Which agents** will use this repo (Claude Code, Cursor, Copilot, others)?
   This decides which harness bindings to keep (see Step 6).

If the project already has a manifest/lockfile/config, you SHOULD read it to
confirm the answers instead of relying solely on the user.

---

## Step 2 — Fill the Project Overview

In `AGENTS.md`, replace the `## Project Overview` placeholder block with a short,
durable description built from the Step 1 answers. Keep it to a few bullets;
deep layout detail belongs in a project-specific structure skill (Step 5), not
here. Remove the top-of-file "Template note" blockquote.

---

## Step 3 — Replace the placeholder tokens

Every `{{TOKEN}}` maps to a Step 1 answer. Replace ALL occurrences across
`AGENTS.md`, `.agents/skills/**`, and `.claude/**`. The table below is the
complete set used by the template.

| Token | Fill with | Example |
| ----- | --------- | ------- |
| `{{PROJECT_NAME}}` | Project / repo name | `acme-web` |
| `{{PROJECT_OVERVIEW}}` | One-line goal/overview | `Internal dashboard for fleet ops.` |
| `{{PROJECT_KIND}}` | Kind of project | `web app` |
| `{{PRIMARY_LANGUAGE}}` | Main language | `TypeScript` |
| `{{APP_FRAMEWORK}}` | App framework / runtime | `Next.js` |
| `{{PACKAGE_MANAGER}}` | Package manager binary | `pnpm` |
| `{{LINTER}}` | Linter name | `ESLint` |
| `{{FORMATTER}}` | Formatter name | `Prettier` |
| `{{UNIT_TEST_FRAMEWORK}}` | Unit test framework | `Vitest` |
| `{{E2E_TEST_FRAMEWORK}}` | E2E test framework | `Playwright` |
| `{{ERROR_TRACKER}}` | Error-reporting service (optional) | `Sentry` |
| `{{LOGGER}}` | Structured logger (optional) | `Pino` |
| `{{CMS_OR_DATA_LAYER}}` | Data/content layer (optional) | `Prisma` |
| `{{HOSTING_PLATFORM}}` | Hosting/deploy platform (optional) | `Vercel` |
| `{{INSTALL_CMD}}` | Install dependencies | `pnpm install` |
| `{{DEV_CMD}}` | Start dev server | `pnpm dev` |
| `{{BUILD_CMD}}` | Production build | `pnpm build` |
| `{{START_CMD}}` | Start built app | `pnpm start` |
| `{{FORMAT_CMD}}` | Run formatter | `pnpm format` |
| `{{LINT_CMD}}` | Run linter | `pnpm lint` |
| `{{TYPECHECK_CMD}}` | Type-check | `pnpm typecheck` |
| `{{UNIT_TEST_CMD}}` | Run unit tests | `pnpm test:unit` |
| `{{E2E_TEST_CMD}}` | Run e2e tests | `pnpm test:e2e` |
| `{{SOURCE_DIR}}` | Main source dir | `src/` |
| `{{TEST_DIR}}` | Test root dir | `e2e/` |
| `{{CODE_FILE_GLOB}}` | Shell `case` pattern of formatted extensions (`.claude/hooks/format.sh`) | `*.ts \| *.tsx \| *.css` |
| `{{CODE_FILE_REGEX}}` | Extended-regex of source extensions (`.claude/hooks/check.sh`) | `\.(ts\|tsx\|css)$` |

A find-and-replace sweep is the fastest path. After replacing, search the tree
for `{{` to confirm none remain (the completion checklist does this).

---

## Step 4 — Prune what the project does not need

The skill core is intentionally broad. Remove what does not apply so the agent
isn't told to follow rules for tools the project lacks.

- **No error tracker / structured logger** → delete
  `.agents/skills/observability-guidelines/` (or trim the sections marked with
  an italic "_delete this section during INIT_" note). Remove its row from the
  `AGENTS.md` skill index and any cross-links to it.
- **No e2e framework** → delete `.agents/skills/e2e-testing-guidelines/`,
  remove its index row, and drop e2e references in
  `quality-assurance-guidelines` and the `AGENTS.md` Verification section.
- **No unit test framework** → delete `.agents/skills/unit-test-guidelines/`
  and its index row.
- **No data/content layer** → remove the data-layer sections (each is marked
  optional) from `development-guidelines`, `application-security-requirements`,
  and `performance-and-reliability-requirements`.
- **No client bundle / not a UI project** → remove the "User-Facing Work"
  subsection from `AGENTS.md` and the bundling/asset sections (marked optional)
  in `performance-and-reliability-requirements`.
- Walk every file for sections flagged `_optional / delete during INIT_` and
  decide each one.

Whenever you remove a skill, also remove every relative link pointing to it so
no dangling links remain.

---

## Step 5 — Add project-specific skills

The template deliberately ships only the cross-project core. Recreate the
project's own skills as needed, following
[Agent Skills Best Practices](.agents/skills/agent-skills-best-practices/SKILL.md).
Common ones to add:

- **Project Structure** — repository layout, stack, services, file placement.
  Create this first; `AGENTS.md` already points at it.
- **Component / UI skills** — if the project has a UI (component conventions,
  styling, UI design principles, accessibility).
- **Routing** — if the project has a routing layer.
- **Domain skills** — content authoring, data-model/CMS operations, or any
  domain workflow specific to this project.

For each new skill: add a directory under `.agents/skills/<name>/` with a
`SKILL.md`, then add a row to the `AGENTS.md` skill index (there is a commented
example block there) and to the review-lens lists in
`code-review-guideline` / `development-guidelines` where relevant.

---

## Step 6 — Set up the agent harness binding(s)

`AGENTS.md` + `.agents/skills/**` are the agent-agnostic substance. Each agent
reads them through its own binding:

- **Claude Code** — `CLAUDE.md` (`@AGENTS.md`) plus the `.claude/` directory:
  - `.claude/settings.json` wires the `SessionStart` hook.
  - `.claude/settings.local-example.json` is the opt-in quality binding
    (format-on-edit + lint/test-before-stop); the session-start hook copies it
    to `settings.local.json` in cloud sessions.
  - `.claude/hooks/*.sh` are **examples** — fill `{{CODE_FILE_GLOB}}`,
    `{{CODE_FILE_REGEX}}`, `{{INSTALL_CMD}}`, command tokens, and adapt the
    toolchain-provisioning block in `session-start.sh` to the project's runtime
    (the example uses `mise` + Node). Delete any hook the project doesn't want.
- **Other agents** (Cursor, Copilot, Aider, etc.) — point them at `AGENTS.md`
  via their own mechanism (e.g. a rules file that imports/links `AGENTS.md`).
  Add that binding file and, if the agent has no hook system, drop `.claude/`.

Keep only the bindings for the agents named in Step 1.

---

## Step 7 — Finalize

- Delete this `INIT.md`.
- Remove the "Template note" blockquote at the top of `AGENTS.md` and every
  `<!-- INIT: ... -->` comment and "TEMPLATE NOTE" / "_delete during INIT_" line
  you decided to keep content for.
- Update `README.md` to describe the actual project (or replace it).

### Completion checklist

- [ ] No `{{` tokens remain: `grep -rn '{{' . | grep -v node_modules`
- [ ] No dangling relative skill links (every `](../...)` / `](./...)` resolves).
- [ ] `AGENTS.md` skill index matches the directories under `.agents/skills/`.
- [ ] Removed skills have no remaining inbound links.
- [ ] Harness binding for each Step-1 agent is filled in and runnable.
- [ ] `INIT.md` and template scaffolding notes are deleted.
