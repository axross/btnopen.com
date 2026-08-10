# Repository Map

Read this before adding a file, to decide where it goes and what to call it. It
covers the directory tree, the tiers that decide placement, the TypeScript path
aliases, the support files that configure each surface, and the thresholds Biome
enforces.

The general placement discipline — put shared logic at the lowest tier with more
than one caller, match a file's name to its neighbourhood — belongs to the
installed code-maintainability capability. This document names the tiers, the
paths, and the conventions it defers to.

## The Tree

`app/(app)/_/` owns feature-agnostic app modules, route-local `_components/`
directories own route-specific UI, `payload/` owns Payload CMS configuration,
`shared/` owns the few modules both realms import, and `app/(payload)/` is
generated and owned by Payload routing.

```text
<root>
├── app/
│   ├── (app)/                 # main application files
│   │   ├── _/                 # feature-agnostic modules
│   │   │   ├── components/    # generic UI components
│   │   │   ├── helpers/       # generic or core helper functions
│   │   │   ├── repositories/  # generic data access functions
│   │   │   ├── translations/  # per-locale UI message catalogs
│   │   │   ├── runtime.ts     # the app realm's environment barrel
│   │   │   └── ...
│   │   ├── _components/       # root layout sub-components
│   │   ├── layout.tsx         # root layout
│   │   ├── (index)/           # index route
│   │   │   ├── _components/   # index route sub-components
│   │   │   └── page.tsx       # index page
│   │   ├── posts/             # posts routes
│   │   │   ├── caches/        # blog post list cache invalidation (route.ts)
│   │   │   └── [slug]/        # blog post route
│   │   │       ├── _components/   # post route sub-components, incl. comments/
│   │   │       ├── caches/        # post cache invalidation (route.ts)
│   │   │       ├── comments/      # comment create (route.ts)
│   │   │       │   ├── caches/    # comment cache invalidation (route.ts)
│   │   │       │   └── token/     # CSRF token issuance (route.ts)
│   │   │       └── ...
│   │   ├── variables.css      # css variables
│   │   ├── globals.css        # global styles
│   │   ├── layers.css         # css layers definitions
│   │   └── ...
│   ├── (payload)/             # Payload CMS routes (do not change)
│   └── global-not-found.tsx   # not-found page outside the (app) root layout
├── e2e/                       # end-to-end tests
│   └── ...
├── public/                    # public assets
├── .data/                     # local temporary data files
├── payload/                   # Payload CMS configurations
│   └── ...
├── shared/                    # realm-neutral modules both app/ and payload/ import
│   └── ...
├── docs/                      # this documentation root
├── scripts/                   # repository maintenance scripts (*.mjs)
├── proxy.ts                   # Next.js proxy, on the Node.js runtime
└── ...
```

**Rules:**

- MUST use Next.js App Router conventions under `app/`.
- MUST place feature-agnostic application modules under `app/(app)/_/`.
- MUST place feature-specific route modules under the owning route directory,
  using underscore-prefixed folders such as `_components/` for route-local
  implementation details.
- MUST NOT change `app/(payload)/` for normal application work.
- MUST place Payload CMS collection and configuration changes under `payload/`.
- MUST place a module under `shared/` only when both `app/` and `payload/`
  import it, and MUST keep it free of imports from either — a `shared/` module
  that reaches back into `app/` re-creates the boundary violation it exists to
  remove.
- MUST place Playwright end-to-end tests under `e2e/`.
- MUST place static public assets under `public/`.
- MUST treat `.data/` as local temporary data storage, not durable application
  source.
- SHOULD update this tree when a durable top-level directory or route-structure
  convention changes.

## Directory Tier

Three tiers, plus a separate realm for the Payload data layer and a
realm-neutral tier the two share. Resolve the tier from the caller count, not
from where a file is convenient to drop.

| Tier | Path | When to use |
| --- | --- | --- |
| Route-local | `app/(app)/<route>/_components/`, `app/(app)/<route>/_/` | Used only by `page.tsx` / `layout.tsx` / sibling files of one route |
| Route-group-shared | `app/(app)/_/components/`, `app/(app)/_/helpers/`, `app/(app)/_/repositories/` | Used by two or more routes inside `(app)/` |
| Payload realm | `payload/collections/`, `payload/globals/`, `payload/helpers/` | Runs inside the Payload CMS realm only |
| Realm-neutral | `shared/` | Imported by **both** `app/` and `payload/` — the only way the Payload realm reaches shared logic without importing `app/` |

**Rules:**

- MUST pull a file placed in `app/(app)/_/` down into a route's `_/` or
  `_components/` when only that one route consumes it.
- MUST promote a file from a route-local `_components/` to
  `app/(app)/_/components/` once a second route imports it.
- MUST place CMS schema, hook, access-control, and admin customization code
  under `payload/`, never under `app/(app)/_/`.
- MUST promote a module to `shared/` once the Payload realm needs it, rather
  than importing it from `app/` or copying it; a module used by only one realm
  belongs to that realm, so `shared/` stays small enough to read.
- MUST keep `shared/` free of React, Next.js, and Payload imports.
  `payload/config.ts` is loaded by the Payload CLI outside Next's bundler, so a
  framework import here breaks `npm run migrate:*` rather than failing at build
  time.
- MUST NOT add files under `app/(payload)/` — Payload owns that route segment.
- MUST NOT place a helper or component at the repository root or directly inside
  `app/` (outside an `_/` or `_components/` directory); Next.js would treat the
  directory as a route segment.
- MUST place static public assets under `public/`; route-generated metadata
  images belong under the route segment that owns them.
- MUST keep generated, dependency, build, cache, and local-data directories out
  of source-placement decisions unless the task explicitly concerns them.

`app/(app)/_/` groups feature-agnostic modules **by kind** rather than by
domain, which departs from the installed Next.js capability's grouping rule.
That departure is a recorded decision, not an oversight — see the deviations
register in [../operations/agent-skills.md](../operations/agent-skills.md).

## Path Aliases

The TypeScript aliases in `tsconfig.json` make shared app, Payload, and e2e
imports stable across route directories.

| Alias | Target | Use for |
| ----- | ------ | ------- |
| `@/*` | `app/(app)/_/*` | Shared app components, helpers, repositories, and the app runtime barrel |
| `@/shared/*` | `shared/*` | Realm-neutral modules the app and the Payload realm both import |
| `@/payload/config` | `payload/config.ts` | Payload config imports from app and Payload-owned route files |
| `@/payload/editor` | `payload/helpers/editor.ts` | Payload Lexical editor helper imports |
| `@/e2e/*` | `e2e/*` | Playwright helper imports |

**Rules:**

- MUST use the existing alias when importing a shared module across route
  boundaries.
- MUST import a `shared/` module through `@/shared/*` from both realms; the
  alias is the seam that lets `payload/` reach the module without importing
  `app/`.
- MUST keep route-local imports relative when both files live in the same
  route-owned subtree.
- MUST update this section when `tsconfig.json` path aliases are added, removed,
  or repointed.
- MUST NOT add a new alias without confirming it improves ownership clarity
  beyond the existing `@/*`, Payload, or e2e aliases.
- SHOULD prefer an alias over a deep relative import that crosses more than two
  directory levels.

## File Naming

A file that breaks the surrounding convention is harder to locate and makes
readers and tooling second-guess what kind of module it is. Every component that
renders styled DOM carries its stylesheet as a same-named sibling, so the pair is
found and moved together.

**Rules:**

- MUST name `.ts` / `.tsx` / `.module.css` files in kebab-case —
  `blog-post-header.tsx`, not `BlogPostHeader.tsx` or `blog_post_header.tsx`.
- MUST pair a component that renders styled DOM with a same-named CSS-module
  sibling — `blog-post-header.tsx` with `blog-post-header.module.css`.
- SHOULD match a CSS module's base name to its component file;
  `blog-post-header.tsx` paired with `header.module.css` is the finding.

## Identifier Naming

A symbol named or cased unlike its neighbours makes the reader stop to check
whether the difference carries meaning. These are the patterns this codebase has
settled on.

**Rules:**

- MUST prefix repository functions with `get…` to match their siblings
  (`getBlogPost`, `getBlogPosts`, `getWebsite`); `fetchBlogPost` is the finding.
- MUST set a child logger's `module` emoji from the category table in
  [observability.md](./observability.md) — the emoji names a category of work, so
  modules doing the same kind of work share one deliberately, and a new emoji
  means a new category and a new row in that table.
- SHOULD carry the `Promise` suffix alias on an unresolved async prop at the
  receiving component, so a promise prop reads as one at its destination.

## Values That Should Not Be Literals

A bare literal forces every later reader to reverse-engineer what it means, and
scatters a value that should have one authoritative definition. Two kinds recur
here — origins, which have a runtime source, and dimensional values, which have
a design token.

**Rules:**

- MUST source an origin or absolute URL from `urlOrigin`, exported by
  `app/(app)/_/runtime.ts`, rather than hard-coding `"https://btnopen.com"` or
  `"http://localhost:3000"`.
- MUST pair a magic number or string with one of: a design token (see
  [styling.md](./styling.md)), a named constant, or a
  `// biome-ignore lint/style/noMagicNumbers: <reason>` comment explaining the
  meaning.
- MUST NOT treat `cacheLife("hours")` / `cacheLife("days")` duration tokens as
  magic values — they are this project's approved vocabulary.
- MAY use a regex for a tightly bounded match — `mediaSrcRegex` in
  `app/(app)/_/helpers/media-src.ts` is the established example — rather than
  forcing `String.prototype.split` or `URL.parse` where they read worse.

## Support Files

Repository support files define runtime, build, type-checking, test, and
observability behaviour. Read the relevant file before changing the surface it
configures.

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
| `skills-lock.json` | Lockfile for the agent skills installed from the shared library |
| `.env.example` | Documented environment-variable shape |
| `.pino-prettyrc` | Local pretty-printing for Pino logs |
| `e2e/.data/` | Local e2e fixture/runtime data |
| `.github/workflows/` | Merge gating, production deploy, per-pull-request preview, and the independent reviewer |
| `.github/dependabot.yml` | Dependabot version-update schedule for the `github-actions` and `npm` ecosystems |

### Enforced Complexity Budget

`biome.jsonc` enforces these thresholds, so a breach fails `npm run lint` rather
than merely reading badly.

| Rule | Setting |
| --- | --- |
| `noExcessiveCognitiveComplexity` | `error` at 24 |
| `noExcessiveLinesPerFunction` | `info` at 120 — does not fail lint, but signals the function should be split |
| `noMagicNumbers` | warn — see the magic-value rule above |
| `noExplicitAny` | `suspicious` — `any` in changed code is a defect, not a style preference |

**Rules:**

- MUST NOT silently bypass an enforced complexity or length threshold; split the
  function instead of suppressing the rule.

### Consulting Before Changing

Each of these files fails globally rather than locally: a small mistake in one
breaks a gate, a runtime, or skill discovery outright rather than one rendered
page.

**Rules:**

- MUST consult the [README](../../README.md) before changing npm scripts,
  dependencies, formatting, linting, or verification commands — it is the source
  of truth for this project's commands.
- MUST consult [security.md](./security.md) and [payload.md](./payload.md)
  before changing environment-variable shape, secrets, Payload access control,
  or public exposure.
- MUST consult [observability.md](./observability.md) before changing
  instrumentation, Sentry config, or logger setup.
- MUST consult [testing.md](./testing.md) before changing `playwright.config.ts`
  or files under `e2e/`.
- MUST consult the CI supply-chain section of [security.md](./security.md)
  before adding or changing a `uses:` entry under `.github/workflows/`, or an
  ecosystem in `.github/dependabot.yml`. A third-party action is pinned to a
  commit SHA here, the pin has a specific shape, and `npm run lint` checks
  nothing in that directory.
- MUST treat generated outputs as non-source unless the task explicitly concerns
  generation, and MUST NOT review them for code style: `.next/`,
  `node_modules/`, `payload/types.ts` (produced by `payload generate:types`), the
  Payload-owned routes under `app/(payload)/`, and the migrations under
  `payload/migrations/`. A migration is worth a finding only when it appears to
  drop a column or rename a field destructively without a data backfill — see
  [payload.md](./payload.md).
- MUST treat every skill under `.claude/skills/` as generated. All of them come
  from the shared skill library, are reproduced by reinstalling, and discard any
  hand-edit; [../operations/agent-skills.md](../operations/agent-skills.md) owns
  the install, lockfile, and refresh workflow.

Which vendor's documentation governs which surface, when one needs re-reading:
Next.js for `page.tsx` async props, `generateMetadata`, file-based metadata
routes, route handlers, `cacheLife()`, or `next.config.ts`; Payload for
collections, fields, access control, admin behaviour, or migrations; Sentry for
the instrumentation and config files, `captureException()` behaviour, source
maps, or PII settings; Playwright and Biome for `playwright.config.ts`, snapshot
behaviour, `biome.jsonc`, or suppression syntax.
