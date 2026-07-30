---
name: project-structure
description: The structure and conventions of this Next.js + Payload CMS blog — the facts a shared skill library cannot know about it. Covers the tech stack and third-party services, the directory tree and tier model, TypeScript path aliases, repository support files and the enforced Biome thresholds, file placement and naming, the architecture boundaries between the app, the data layer, and the Payload realm, App Router route-path and route-file conventions, React component anatomy and the loaded/loading split, Payload access control, drafts, query bounds and cache invalidation, the `runtime.ts` environment barrel with the project's SSRF, CSRF, and input-validation surfaces, Sentry/Pino observability wiring, the lowercase-first source-comment voice, and the Jest, Playwright, and `data-testid` testing conventions.
when_to_use: Use when locating files, placing or naming a new module, or resolving any "how does THIS project do it" question that a general capability defers to the project on — where data access lives, which tier a module belongs in, how a route directory is laid out, how a component splits across the server/client boundary, how Payload collections gate access, how environment values are read, which log level or logger to use, how comments are cased, how tests and test IDs are named. Consult it alongside the general capability for the surface being changed, which owns the underlying practice; this skill owns only what is specific to this repository.
user-invocable: false
---

# Project Structure

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119.html).

Apply this skill when navigating this repository, placing or naming new files, or answering a question about how this particular project does something.

This skill is deliberately narrow: it holds the project-specific half of rules whose general half lives in an installed capability. The Next.js app development capability owns App Router mechanics; this skill owns the route paths and directory layout this repository actually uses. The code maintainability capability owns the tier model in the abstract; this skill names the tiers. The application security capability owns access control as a discipline; this skill records how Payload enforces it here. The software instrumentation capability owns logging and error tracking; this skill names the logger, the tracker, and the module conventions. When a general capability says "follow the project's convention", this is the convention.

Appearance is not here — the project's visual identity and design-token conventions own it. Neither is the markdown rendering pipeline, which its own capability owns.

## Tech Stack

See [tech-stack.md](./references/tech-stack.md) for:

- the core Next.js, Payload CMS, markdown, Playwright, Biome, and Vercel stack
- which installed capability owns each stack area's practices
- deciding where durable technology-stack summaries belong

## Third-Party Services

See [third-party-services.md](./references/third-party-services.md) for:

- Sentry and Mixpanel as runtime and privacy-sensitive integrations
- the capture settings already in force (`sendDefaultPii`, Session Replay, Mixpanel autocapture) and what they mean for a new surface
- keeping service inventory out of unrelated workflow docs

## Directory Structure

See [directory-structure.md](./references/directory-structure.md) for:

- top-level repository ownership and the app, Payload, e2e, public asset, and local data directories
- deciding between `app/(app)/_/`, route-local `_components/`, `payload/`, and `app/(payload)/`
- updating the durable tree when route or top-level ownership conventions change

## Path Aliases

See [path-aliases.md](./references/path-aliases.md) for:

- existing TypeScript path aliases and their ownership boundaries
- shared-module imports across route boundaries versus route-local relative imports
- deciding whether a new alias improves clarity enough to justify adding it

## Repository Support Files

See [repository-support-files.md](./references/repository-support-files.md) for:

- runtime, build, type-checking, test, observability, and environment-shape files
- the enforced complexity and function-length thresholds in `biome.jsonc`
- generated outputs that should not be treated as source

## Placement and Naming

See [placement-and-naming.md](./references/placement-and-naming.md) for:

- the three-tier directory model (route-local, route-group-shared, Payload realm) with its concrete paths
- kebab-case file names and the component ↔ CSS-module sibling pairing
- identifier conventions: the `get…` repository prefix, unique per-module logger emoji, the `Promise` suffix alias
- the shared-origin and named-constant rules for values that would otherwise be hard-coded

## Architecture Boundaries

See [architecture-boundaries.md](./references/architecture-boundaries.md) for:

- the data-access split: repositories under `app/(app)/_/repositories/`, Zod-parsed view types, UI-free and read-only
- which modules a Client Component may never import, and the `loaded.tsx` split
- the Payload-hook boundary and the cross-tier import directions

## Component Conventions

See [component-conventions.md](./references/component-conventions.md) for:

- component anatomy: the `ComponentProps<T>` base type, `interface` over `type`, no `any`, the mandatory `...props` spread
- what forces a component to the client, and splitting rather than converting
- the orchestrator / `loaded` / `loading` triad, its paired CSS modules, and Suspense placement
- the `media.tsx` image pattern, the `sharp` requirement, and the `reactCompiler` / `cacheComponents` flags

## Security Conventions

See [security-conventions.md](./references/security-conventions.md) for:

- `app/(app)/_/runtime.ts` as the only sanctioned environment barrel, and the four files Biome whitelists for `process.env`
- the webembed SSRF surface, the `URL.canParse` filter, `images.remotePatterns` scoping, and OG-image and sitemap fetch rules
- `searchParams` value comparison, Zod validation on route handlers, and upload filename sanitization
- the `serverExternalPackages` justification rule

## Code Style

See [code-style.md](./references/code-style.md) for:

- the lowercase-first comment voice for `.ts` / `.tsx` / `.js` source, and what keeps natural casing
- `biome-ignore` directive casing and the `@throws` requirement
- the prohibition on barrel re-export files as import sources

## Routing Conventions

See [routing-conventions.md](./references/routing-conventions.md) for:

- resource-repeating, kebab-cased path structure and semantic dynamic segments
- route groups and underscore-prefixed non-route directories
- co-located `page-props.ts`, `not-found.tsx`, and OG image files, and the rule that `route.ts` lives in its own sub-directory

## Payload Conventions

See [payload-conventions.md](./references/payload-conventions.md) for:

- collection `access` rules, the public-readable media collections, and draft/published gating
- the `users` auth lockout settings and Payload's ownership of sessions and cookies
- query bounds (`select`, `depth`, `limit`, `where`, `locale`), N+1 patterns, and the singleton client
- `"use cache"` / `cacheLife()` policy and the `posts/caches` invalidation pairing

## Observability Conventions

See [observability-conventions.md](./references/observability-conventions.md) for:

- the Pino `rootLogger` and the per-module child logger with its emoji `module` field
- the level policy, including the prohibition on `logger.error()`
- `@sentry/nextjs` as the only Sentry entry point, the config files that own initialization, and `global-error.tsx`

## Testing Conventions

See [testing-conventions.md](./references/testing-conventions.md) for:

- Jest with `@jest/globals`, colocated `*.spec.ts`, and `it(...)` over `test(...)`
- the `e2e/` layout, snapshot location, and the `e2e/scenarios.md` journey catalog
- the scope-relative `data-testid` nesting pattern and the `-loading` suffix
