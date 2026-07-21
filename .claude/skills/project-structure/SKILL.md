---
name: project-structure
description: The repository map for this Next.js + Payload CMS blog. Covers tech stack, Sentry/Mixpanel, support files, import aliases, App Router route groups, underscore directories, Payload ownership, e2e tests, public assets, and local data directories.
when_to_use: Use when locating files, placing modules, checking repository structure, or needing stack/service context. Not for design/abstraction quality (maintainable-code-guidelines) or route-path conventions (routing-guidelines).
user-invocable: false
---

# Project Structure

Apply this skill when navigating this repository, placing new files, or checking project stack context. Keep `AGENTS.md` focused on agent routing and workflow; durable project layout details belong here.

## Tech Stack

See [tech-stack.md](./references/tech-stack.md) for:

- the core Next.js, Payload CMS, markdown, Playwright, Biome, and Vercel stack
- routing follow-ups for markdown rendering, e2e testing, formatting, and linting work
- deciding where durable technology-stack summaries belong

## Third-Party Services

See [third-party-services.md](./references/third-party-services.md) for:

- Sentry and Mixpanel as runtime and privacy-sensitive integrations
- service changes that need observability or security guidance
- keeping service inventory out of unrelated workflow docs

## Directory Structure

See [directory-structure.md](./references/directory-structure.md) for:

- top-level repository ownership and the app, Payload, e2e, public asset, and local data directories
- deciding between `app/(app)/_/`, route-local `_components/`, `payload/`, and `app/(payload)/`
- updating the durable tree when route or top-level ownership conventions change

## Repository Support Files

See [repository-support-files.md](./references/repository-support-files.md) for:

- runtime, build, type-checking, test, observability, and environment-shape files
- generated outputs that should not be treated as source
- routing changes in config files to development, security, observability, or e2e skills

## Path Aliases

See [path-aliases.md](./references/path-aliases.md) for:

- existing TypeScript path aliases and their ownership boundaries
- shared-module imports across route boundaries versus route-local relative imports
- deciding whether a new alias improves clarity enough to justify adding it

## Placement Rules

See [placement-rules.md](./references/placement-rules.md) for:

- choosing the owning directory for route files, React components, Payload code, repositories, tests, and public assets
- cross-checking route, component, and maintainability guidance before moving files
- excluding generated, dependency, build, cache, and local-data directories from source-placement decisions
