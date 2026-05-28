---
name: project-structure
description: Use this skill when locating files, placing modules, checking repository structure, or needing stack/service context in this Next.js + Payload CMS blog. Covers tech stack, Sentry/Mixpanel, support files, import aliases, App Router route groups, underscore directories, Payload ownership, e2e tests, public assets, and local data directories.
---

# Project Structure

Apply this skill when navigating this repository, placing new files, or checking project stack context. Keep `AGENTS.md` focused on agent routing and workflow; durable project layout details belong here.

## Tech Stack

This website is built as a Next.js App Router app backed by Payload CMS. Markdown content is rendered through the local Remark/Rehype/Shiki pipeline, end-to-end behavior is verified with Playwright, Biome owns formatting and linting, and Vercel is the deployment/runtime environment.

| Area | Technology |
| ---- | ---------- |
| Web framework | [Next.js](https://nextjs.org/) |
| Content management | [Payload CMS](https://payloadcms.com/) |
| Markdown processing | [Remark](https://remark.js.org/) |
| Syntax highlighting | [Shiki](https://shiki.style/) |
| End-to-end testing | [Playwright](https://playwright.dev/) |
| Formatting and linting | [Biome](https://biomejs.dev/) |
| Hosting/runtime | [Vercel](https://vercel.com/) |

**Guidelines:**

- MUST treat Next.js App Router and Payload CMS as the primary architectural constraints when placing app or content-management code.
- MUST route markdown rendering changes through [Markdown Processing Guidelines](../markdown-processing-guidelines/SKILL.md).
- MUST route Playwright work through [E2E Testing Guidelines](../e2e-testing-guidelines/SKILL.md).
- MUST route formatting and linting behavior through [Development Guidelines](../development-guidelines/SKILL.md).
- SHOULD keep technology-stack summaries here instead of duplicating them in `AGENTS.md`.

## Third-Party Services

The app uses external services for error tracking and analytics. Treat these integrations as runtime and privacy-sensitive surfaces, not ordinary UI dependencies.

| Service | Purpose |
| ------- | ------- |
| [Sentry](https://sentry.io/) | Error tracking |
| [Mixpanel](https://mixpanel.com/) | Analytics |

**Guidelines:**

- MUST consult [Observability Guidelines](../observability-guidelines/SKILL.md) before changing Sentry initialization, error reporting, or logging behavior.
- MUST consult [Application Security Requirements](../application-security-requirements/SKILL.md) when service changes affect secrets, environment variables, public exposure, or captured user data.
- SHOULD keep third-party service inventory here instead of duplicating it in `AGENTS.md`.

## Directory Structure

Use this tree to decide where repository-level files and app features belong before adding new files. The `app/(app)/_/` directory owns feature-agnostic app modules, route-local `_components/` directories own route-specific UI, `payload/` owns Payload CMS configuration, and `app/(payload)/` is generated/owned by Payload routing and should not be changed for normal app work.

```text
<root>
├── app/
│   ├── (app)/                 # main application files
│   │   ├── _/                 # feature-agnostic modules
│   │   │   ├── components/    # generic UI components
│   │   │   ├── helpers/       # generic or core helper functions
│   │   │   ├── repositories/  # generic data access functions
│   │   │   └── ...
│   │   ├── _components/       # root layout sub-components
│   │   ├── layout.tsx         # root layout
│   │   ├── (index)/           # index route
│   │   │   ├── _components/   # index route sub-components
│   │   │   └── page.tsx       # index page
│   │   ├── posts/             # posts routes
│   │   │   └── ...
│   │   ├── variables.css      # css variables
│   │   ├── globals.css        # global styles
│   │   ├── layers.css         # css layers definitions
│   │   └── ...
│   └── (payload)/             # Payload CMS routes (do not change)
├── e2e/                       # end-to-end tests
│   └── ...
├── public/                    # public assets
├── .data/                     # local temporary data files
├── payload/                   # Payload CMS configurations
│   └── ...
└── ...
```

**Guidelines:**

- MUST use Next.js App Router conventions under `app/`.
- MUST place feature-agnostic application modules under `app/(app)/_/`.
- MUST place feature-specific route modules under the owning route directory, using underscore-prefixed folders such as `_components/` for route-local implementation details.
- MUST NOT change `app/(payload)/` for normal application work.
- MUST place Payload CMS collection and configuration changes under `payload/`.
- MUST place Playwright end-to-end tests under `e2e/`.
- MUST place static public assets under `public/`.
- MUST treat `.data/` as local temporary data storage, not durable application source.
- SHOULD update this tree when a durable top-level directory or route-structure convention changes.

## Repository Support Files

Repository support files define runtime, build, type-checking, test, and observability behavior. Read the relevant file before changing the surface it configures.

| File or directory | Responsibility |
| ----------------- | -------------- |
| `package.json` | npm scripts, dependencies, Node/npm engine expectations |
| `tsconfig.json` | TypeScript compiler settings and path aliases |
| `next.config.ts` | Next.js config, image remote patterns, compiler/runtime integration |
| `payload.config.ts` | Payload CMS top-level configuration |
| `payload/` | Payload collections, globals, helpers, migrations, and seed helpers |
| `instrumentation.ts` / `instrumentation-client.ts` | Next.js instrumentation entry points |
| `sentry.server.config.ts` / `sentry.edge.config.ts` | Sentry runtime initialization |
| `playwright.config.ts` | Playwright e2e runner configuration |
| `biome.jsonc` | Biome formatting and linting rules |
| `.env.example` | Documented environment-variable shape |
| `.pino-prettyrc` | Local pretty-printing for Pino logs |
| `e2e/.data/` | Local e2e fixture/runtime data |

**Guidelines:**

- MUST consult [Development Guidelines](../development-guidelines/SKILL.md) before changing npm scripts, dependencies, formatting, linting, or verification commands.
- MUST consult [Application Security Requirements](../application-security-requirements/SKILL.md) before changing environment-variable shape, secrets, Payload access control, or public exposure.
- MUST consult [Observability Guidelines](../observability-guidelines/SKILL.md) before changing instrumentation, Sentry config, or logger setup.
- MUST consult [E2E Testing Guidelines](../e2e-testing-guidelines/SKILL.md) before changing `playwright.config.ts` or files under `e2e/`.
- MUST treat generated outputs such as `.next/`, `node_modules/`, `payload/types.ts`, and Payload-generated route files as non-source unless the task explicitly concerns generation.

## Path Aliases

The TypeScript aliases in `tsconfig.json` make shared app, Payload, and e2e imports stable across route directories.

| Alias | Target | Use for |
| ----- | ------ | ------- |
| `@/*` | `app/(app)/_/*` | Shared app components, helpers, repositories, logger, and runtime modules |
| `@/payload/config` | `payload/config.ts` | Payload config imports from app and Payload-owned route files |
| `@/payload/editor` | `payload/helpers/editor.ts` | Payload Lexical editor helper imports |
| `@/e2e/*` | `e2e/*` | Playwright helper imports |

**Guidelines:**

- MUST use the existing alias when importing a shared module across route boundaries.
- MUST keep route-local imports relative when both files live in the same route-owned subtree.
- MUST update this section when `tsconfig.json` path aliases are added, removed, or repointed.
- MUST NOT add a new alias without confirming it improves ownership clarity beyond the existing `@/*`, Payload, or e2e aliases.
- SHOULD prefer direct module imports over barrel files per [Development Guidelines](../development-guidelines/code-quality.md).

## Placement Rules

Placement follows ownership. Shared app primitives belong in the app-wide underscore directory, route-specific UI stays under the owning route, Payload configuration stays outside `app/`, and test files should live in the test surface that exercises the behavior.

For detailed route file conventions, consult [Routing Guidelines](../routing-guidelines/SKILL.md). For React component conventions, consult [React Component Guidelines](../react-component-guidelines/SKILL.md). For maintainability review of file placement and abstraction boundaries, consult [Maintainable Code Guidelines](../maintainable-code-guidelines/SKILL.md).

**Guidelines:**

- MUST consult [Routing Guidelines](../routing-guidelines/SKILL.md) before creating, moving, or renaming App Router routes.
- MUST consult [React Component Guidelines](../react-component-guidelines/SKILL.md) before adding or moving React components.
- MUST consult [Maintainable Code Guidelines](../maintainable-code-guidelines/SKILL.md) when reviewing whether a module belongs in a route-local, route-group-shared, or feature-agnostic directory.
- MUST place CMS schema, hook, access-control, and admin customization code under `payload/`, not under `app/(app)/_`.
- MUST place app code that reads from Payload through shared repositories under `app/(app)/_/repositories/` unless it is tightly route-local.
- MUST place public static assets under `public/`; route-generated metadata images belong under the route segment that owns them.
- MUST keep generated, dependency, build, cache, and local-data directories out of source-placement decisions unless the task explicitly concerns those directories.
- SHOULD keep this skill descriptive rather than exhaustive; do not list every file when an ownership rule is clearer.
