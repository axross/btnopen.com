# Abstraction Boundaries

Apply these rules to verify that new code respects the project's separation of concerns.

## Repository / Component Split

- MUST flag a Server Component or `route.ts` that calls `getPayload({ config })` or `payload.find(…)` directly. Data access MUST go through a function under `app/(app)/_/repositories/` (or a route-local `_/repositories/`) so caching, schema validation (`PayloadBlogPost.parse(…)`), and logging are centralized.
- MUST flag a repository function that returns the raw Payload document type (e.g., `BlogPost` from `@/payload/types`) instead of a Zod-parsed view type (e.g., `BlogPostDetail`, `BlogPostSummary`). The repository layer owns the schema-to-domain transform.
- MUST flag a repository function that calls a React API or imports from `react`, `next/link`, etc. — repositories MUST be UI-free.

## Server / Client Boundary

- MUST flag a `"use client"` component that performs data fetching (`fetch()`, `getPayload(…)`, `getBlogPost(…)`) — see [react-component-guidelines › client-vs-server-components](../react-component-guidelines/client-vs-server-components.md). Lift the fetch into the parent Server Component or its repository.
- MUST flag a `"use client"` component that imports from `@/repositories/*`, `@/payload/*`, `payload`, or any module that itself imports `server-only`. This will leak server code into the client bundle.
- MUST flag a Server Component that uses `useState`, `useEffect`, `onClick`, or any browser API — it should be split into `loaded.tsx` (server) and an interactive child (client).
- MUST flag a `Promise<T>` prop being passed into a `"use client"` component — Promise props are RSC-only.

## Markdown Pipeline Boundary

- MUST flag any new component that calls `unified()`, `remarkParse`, `remarkRehype`, or `rehypeReact` outside of `app/(app)/_/helpers/markdown.ts`. The pipeline is a single chain per [markdown-processing-guidelines › pipeline-integrity](../markdown-processing-guidelines/pipeline-integrity.md).
- MUST flag any markdown rendering attempted in a Client Component — the pipeline is `"use server"` per [markdown-processing-guidelines › server-components-and-caching](../markdown-processing-guidelines/server-components-and-caching.md).
- MUST flag a new HAST tag added to the renderer's `defaultComponents` map without a corresponding component import.

## Payload CMS Boundary

- MUST flag a Payload `beforeOperation` / `afterOperation` hook that imports from `@/components/*` or any React module — Payload hooks run server-side outside React.
- MUST flag a Payload collection `access` rule that returns `() => true` for an admin-only field (e.g., draft `_status`) without an explicit comment justifying why it is public.

## Cross-Tier Imports

- MUST flag any import path that crosses tiers in the wrong direction:
  - `payload/` MUST NOT import from `app/`. The Payload realm is a separate process boundary.
  - `app/(app)/_/` modules MUST NOT import from a specific route's `_components/` or `_/`. Shared code should not depend on route-local code.
- SHOULD flag deep relative imports (`../../../`) that cross more than two directory levels — the project uses path aliases (`@/components`, `@/repositories`, `@/helpers`, `@/logger`, `@/runtime`, `@/payload/...`).
