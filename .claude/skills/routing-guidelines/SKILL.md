---
name: routing-guidelines
description: The App Router routing conventions for `app/` — RESTful path structure (resource/identifier repetition, kebab-case, search params for optional inputs, semantic dynamic-segment names like `[slug]`), route-group `(group)` and underscore-prefixed (`_/`, `_components/`) directory conventions, co-located `page-props.ts` with `Promise<...>`-typed `params` / `searchParams`, `not-found.tsx` / OG-image file-metadata co-location, and the rule that `route.ts` MUST live in a dedicated sub-directory (e.g., `posts/[slug]/caches/route.ts`) — never next to a `page.tsx`.
when_to_use: Use when creating, moving, renaming, or reviewing any route in `app/`, even when the user only says "add a page", "new route", "App Router", "page props", "search params", or "route handler". Not for how to write the route's component (the React component guidelines) or general repo structure and file placement (the project structure guide).
user-invocable: false
---

# Routing Guidelines

Apply this skill when writing, reviewing, or refactoring routes in this project.

## Path Structure

See [path-structure.md](./references/path-structure.md) for:

- Next.js App Router as the routing baseline
- RESTful resource and identifier path shapes such as `posts/[slug]`
- kebab-case path elements, semantic dynamic segment names, and search params for optional inputs

## Directory Conventions

See [directory-conventions.md](./references/directory-conventions.md) for:

- route groups that organize files without affecting URL structure
- underscore-prefixed non-route directories such as `_/` and `_components/`
- choosing route-local versus layout-level implementation directories

## File Conventions

See [file-conventions.md](./references/file-conventions.md) for:

- co-located `page-props.ts` files with `Promise<...>` params and search params
- `not-found.tsx` and OG image file placement
- dedicated route-handler directories such as `posts/[slug]/caches/route.ts`
