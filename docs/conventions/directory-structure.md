# Repository Map

Where a file goes in this repository, what it and its symbols are called, which
alias reaches it, and which support file configures which surface.

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

Everything under `app/` MUST follow Next.js App Router conventions. A
feature-agnostic application module MUST go under `app/(app)/_/`; a
feature-specific route module MUST go under the route directory that owns it, in
an underscore-prefixed folder such as `_components/` for route-local
implementation details. Payload CMS collection and configuration changes MUST go
under `payload/`, and normal application work MUST NOT change `app/(payload)/`.
A module MUST go under `shared/` only when both `app/` and `payload/` import it,
and MUST stay free of imports from either — a `shared/` module that reaches back
into `app/` re-creates the boundary violation it exists to remove. Playwright
end-to-end tests MUST go under `e2e/` and static public assets under `public/`.
`.data/` MUST be treated as local temporary data storage, not durable application
source.

This tree SHOULD be updated when a durable top-level directory or route-structure
convention changes.

## Directory Tier

Three tiers, plus a separate realm for the Payload data layer and a
realm-neutral tier the two share. The tier MUST be resolved from the caller
count, not from where a file is convenient to drop.

| Tier | Path | When to use |
| --- | --- | --- |
| Route-local | `app/(app)/<route>/_components/`, `app/(app)/<route>/_/` | Used only by `page.tsx` / `layout.tsx` / sibling files of one route |
| Route-group-shared | `app/(app)/_/components/`, `app/(app)/_/helpers/`, `app/(app)/_/repositories/` | Used by two or more routes inside `(app)/` |
| Payload realm | `payload/collections/`, `payload/globals/`, `payload/helpers/` | Runs inside the Payload CMS realm only |
| Realm-neutral | `shared/` | Imported by **both** `app/` and `payload/` — the only way the Payload realm reaches shared logic without importing `app/` |

A file placed in `app/(app)/_/` MUST be pulled down into a route's `_/` or
`_components/` when only that one route consumes it, and a file in a route-local
`_components/` MUST be promoted to `app/(app)/_/components/` once a second route
imports it.

CMS schema, hook, access-control, and admin customization code MUST go under
`payload/`, never under `app/(app)/_/`. A module MUST be promoted to `shared/`
once the Payload realm needs it, rather than imported from `app/` or copied; a
module used by only one realm belongs to that realm, so `shared/` stays small
enough to read. `shared/` MUST stay free of React, Next.js, and Payload imports:
`payload/config.ts` is loaded by the Payload CLI outside Next's bundler, so a
framework import here breaks `npm run migrate:*` rather than failing at build
time. Files MUST NOT be added under `app/(payload)/` — Payload owns that route
segment.

A helper or component MUST NOT sit at the repository root or directly inside
`app/` (outside an `_/` or `_components/` directory); Next.js would treat the
directory as a route segment. Static public assets MUST go under `public/`, while
route-generated metadata images belong under the route segment that owns them.
Generated, dependency, build, cache, and local-data directories MUST stay out of
source-placement decisions unless the task explicitly concerns them.

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

An import of a shared module across route boundaries MUST use the existing
alias, and a `shared/` module MUST be imported through `@/shared/*` from both
realms — the alias is the seam that lets `payload/` reach the module without
importing `app/`. Route-local imports MUST stay relative when both files live in
the same route-owned subtree, and a deep relative import that crosses more than
two directory levels SHOULD give way to an alias.

A new alias MUST NOT be added without confirming it improves ownership clarity
beyond the existing `@/*`, Payload, or e2e aliases. This section MUST be updated
when `tsconfig.json` path aliases are added, removed, or repointed.

## File Naming

A file that breaks the surrounding convention is harder to locate and makes
readers and tooling second-guess what kind of module it is. `.ts` / `.tsx` /
`.module.css` files MUST be named in kebab-case — `blog-post-header.tsx`, not
`BlogPostHeader.tsx` or `blog_post_header.tsx`.

Every component that renders styled DOM MUST be paired with a same-named
CSS-module sibling — `blog-post-header.tsx` with `blog-post-header.module.css` —
so the pair is found and moved together. A CSS module's base name SHOULD match
its component file; `blog-post-header.tsx` paired with `header.module.css` is the
finding.

## Identifier Naming

A symbol named or cased unlike its neighbours makes the reader stop to check
whether the difference carries meaning. These are the patterns this codebase has
settled on.

A repository function MUST be prefixed with `get…` to match its siblings
(`getBlogPost`, `getBlogPosts`, `getWebsite`); `fetchBlogPost` is the finding. A
child logger's `module` emoji MUST be set from the category table in
[observability.md](./observability.md) — the emoji names a category of work, so
modules doing the same kind of work share one deliberately, and a new emoji means
a new category and a new row in that table. An unresolved async prop SHOULD carry
the `Promise` suffix alias at the receiving component, so a promise prop reads as
one at its destination.

## Values That Should Not Be Literals

A bare literal forces every later reader to reverse-engineer what it means, and
scatters a value that should have one authoritative definition. Two kinds recur
here — origins, which have a runtime source, and dimensional values, which have
a design token.

An origin or absolute URL MUST be sourced from `urlOrigin`, exported by
`app/(app)/_/runtime.ts`, rather than hard-coded as `"https://btnopen.com"` or
`"http://localhost:3000"`. A magic number or string MUST be paired with one of: a
design token (see [styling.md](./styling.md)), a named constant, or a
`// biome-ignore lint/style/noMagicNumbers: <reason>` comment explaining the
meaning. The `cacheLife("hours")` / `cacheLife("days")` duration tokens MUST NOT
be treated as magic values — they are this project's approved vocabulary. A regex
MAY be used for a tightly bounded match — `mediaSrcRegex` in
`app/(app)/_/helpers/media-src.ts` is the established example — rather than
forcing `String.prototype.split` or `URL.parse` where they read worse.

## Support Files

Repository support files define runtime, build, type-checking, test, and
observability behaviour. The relevant file MUST be read before changing the
surface it configures.

| File or directory | Responsibility |
| ----------------- | -------------- |
| `package.json` | npm scripts, dependencies, Node/npm engine expectations |
| `tsconfig.json` | TypeScript compiler settings and path aliases |
| `next.config.ts` | Next.js config, image remote patterns, compiler/runtime integration |
| `payload.config.ts` | Payload CMS top-level configuration |
| `payload/` | Payload collections, globals, helpers, migrations, and seed helpers |
| `instrumentation.ts` / `instrumentation-client.ts` | Next.js instrumentation entry points |
| `sentry.server.config.ts` / `sentry.edge.config.ts` | Sentry runtime initialization |
| `vitest.config.ts` | Vitest unit runner configuration: discovery globs, resolution, and mock hygiene |
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

An enforced complexity or length threshold MUST NOT be silently bypassed; split
the function instead of suppressing the rule.

### Consulting Before Changing

Each of these files fails globally rather than locally: a small mistake in one
breaks a gate, a runtime, or skill discovery outright rather than one rendered
page.

The [README](../../README.md) MUST be consulted before changing npm scripts,
dependencies, formatting, linting, or verification commands — it is the source of
truth for this project's commands. [security.md](./security.md) and
[payload.md](./payload.md) MUST be consulted before changing environment-variable
shape, secrets, Payload access control, or public exposure.
[observability.md](./observability.md) MUST be consulted before changing
instrumentation, Sentry config, or logger setup, and
[testing.md](./testing.md) before changing `vitest.config.ts`,
`playwright.config.ts`, or files under `e2e/`. The CI supply-chain section of
[security.md](./security.md) MUST be consulted before adding or changing a
`uses:` entry under `.github/workflows/`, or an ecosystem in
`.github/dependabot.yml`: a third-party action is pinned to a commit SHA here,
the pin has a specific shape, and `npm run lint` checks nothing in that
directory.

Generated outputs MUST be treated as non-source unless the task explicitly
concerns generation, and MUST NOT be reviewed for code style: `.next/`,
`node_modules/`, `payload/types.ts` (produced by `payload generate:types`), the
Payload-owned routes under `app/(payload)/`, and the migrations under
`payload/migrations/`. A migration is worth a finding only when it appears to
drop a column or rename a field destructively without a data backfill — see
[payload.md](./payload.md). Every skill under `.claude/skills/` MUST be treated
as generated as well: all of them come from the shared skill library, are
reproduced by reinstalling, and discard any hand-edit;
[../operations/agent-skills.md](../operations/agent-skills.md) owns the install,
lockfile, and refresh workflow.

Which vendor's documentation governs which surface, when one needs re-reading:
Next.js for `page.tsx` async props, `generateMetadata`, file-based metadata
routes, route handlers, `cacheLife()`, or `next.config.ts`; Payload for
collections, fields, access control, admin behaviour, or migrations; Sentry for
the instrumentation and config files, `captureException()` behaviour, source
maps, or PII settings; Playwright and Biome for `playwright.config.ts`, snapshot
behaviour, `biome.jsonc`, or suppression syntax.
