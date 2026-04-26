---
name: routing-guidelines
description: Use this skill when creating, moving, renaming, or reviewing any route in `app/` — RESTful path structure (resource/identifier repetition, kebab-case, search params for optional inputs, semantic dynamic-segment names like `[slug]`), route-group `(group)` and underscore-prefixed (`_/`, `_components/`) directory conventions, co-located `page-props.ts` with `Promise<...>`-typed `params` / `searchParams`, `not-found.tsx` / OG-image file-metadata co-location, and the rule that `route.ts` MUST live in a dedicated sub-directory (e.g., `posts/[slug]/caches/route.ts`) — never next to a `page.tsx`. Use even when the user only says "add a page", "new route", "App Router", "page props", "search params", or "route handler".
---

# Routing Guidelines

Apply these rules when writing, reviewing, or refactoring routes in this project.

- MUST use Next.js App Router-based routing.
- SHOULD follow the common RESTful API design principles regarding the path structure.
  - The path structure always SHOULD be repeating the type of resource and the resource identifier.
    - For example, `posts/[id]` instead of `[id]`.
    - For example, `posts/[id]/comments/[id]` instead of `[id]/[id]`.
  - The path elements SHOULD be lowercased and kebab-cased.
  - SHOULD use search params for any optional inputs.
    - For example, use search params for pagination, filtering, and sorting.
    - For example, use search params for language, draft/preview status, etc.
  - Dynamic route segments SHOULD use semantic names that describe the resource identifier.
    - For example, `posts/[slug]` rather than `posts/[id]` when the identifier is a slug.

## Directory Conventions

- SHOULD use route groups (`(group-name)` directories) to organize routes logically without affecting the URL structure.
  - For example, `(app)/` wraps all main application routes, `(index)/` groups the index route's files.
- MUST prefix non-route directories with `_` to exclude them from routing.
  - Use `_/` for feature-agnostic shared modules (e.g., components, helpers, repositories) scoped to a layout level.
  - Use `_components/` for UI components that are specific to the nearest layout or page.

## File Conventions

- SHOULD define a `page-props.ts` file co-located with each `page.tsx` to export a `PageProps` interface.
  - `params` and `searchParams` MUST be typed as `Promise<...>` to comply with Next.js 15+ async APIs.
  - For example:
    ```app/(app)/posts/[slug]/page-props.ts#L1-5
    export interface PageProps {
      params: Promise<{ slug: string }>;
      searchParams: Promise<{ draft?: "true"; preview?: "true" }>;
    }
    ```
- MAY co-locate a `not-found.tsx` file with any route segment that requires a custom 404 UI.
- SHOULD co-locate OG image files (e.g., `thumbnail.png`) with the route segment they belong to, using Next.js file-based metadata conventions.
- Route handlers (`route.ts`) MUST NOT be placed in the same directory as a `page.tsx`.
  - SHOULD place route handlers in a dedicated sub-directory named after the resource they manage.
  - For example, `posts/[slug]/caches/route.ts` rather than `posts/[slug]/route.ts`.
