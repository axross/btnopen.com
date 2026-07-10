# Abstraction Boundaries

Apply these rules to verify that new code respects the project's separation of concerns.

## Data-Access / UI Split

Payload CMS runs in-process with Next.js: the `payload/` directory owns collections and config, `app/` owns the UI, and data access goes through Payload's local API. When a Server Component or route handler reaches into Payload directly, caching, schema validation, and logging scatter across every call site instead of living in one place.

**Guidelines:**

- MUST flag a Server Component or `route.ts` that calls `getPayload({ config })` or `payload.find(…)` directly. Data access MUST go through a function under `app/(app)/_/repositories/` (or a route-local `_/repositories/`) so caching, schema validation (`PayloadBlogPost.parse(…)`), and logging are centralized.
- MUST flag a repository function that returns the raw Payload document type (e.g., `BlogPost` from `@/payload/types`) instead of a Zod-parsed view type (e.g., `BlogPostDetail`, `BlogPostSummary`). The repository layer owns the schema-to-domain transform.
- MUST flag a repository function that calls a React API or imports from `react`, `next/link`, etc. — repositories MUST be UI-free.

## Server / Client Boundary

Fetching from the client ships data-access code into the browser bundle and adds a network round-trip the server could have avoided.

**Guidelines:**

- MUST flag a `"use client"` component that performs data fetching (`fetch()`, `getPayload(…)`, `getBlogPost(…)`) — see the project's React component guidelines (client-vs-server-components rules). Lift the fetch into the parent Server Component or its repository.
- MUST flag a `"use client"` component that imports from `@/repositories/*`, `@/payload/*`, `payload`, or any module that itself imports `server-only`. This will leak server code into the client bundle.
- MUST flag a Server Component that uses `useState`, `useEffect`, `onClick`, or any browser API — it should be split into `loaded.tsx` (server) and an interactive child (client).
- MUST flag a `Promise<T>` prop being passed into a `"use client"` component — Promise props are RSC-only.

## Markdown Pipeline Boundary

A shared pipeline copied into a second place drifts out of sync, so a fix applied to one copy silently skips the rest.

**Guidelines:**

- MUST flag any new component that calls `unified()`, `remarkParse`, `remarkRehype`, or `rehypeReact` outside of `app/(app)/_/helpers/markdown.ts`. The pipeline is a single chain per the project's markdown-processing guidelines (pipeline-integrity rules).
- MUST flag any markdown rendering attempted in a Client Component — the pipeline is server-side only per the project's markdown-processing guidelines (server-components-and-caching rules).
- MUST flag a new HAST tag added to the renderer's `defaultComponents` map without a corresponding component import.

## Payload Hooks / UI Boundary

Payload lifecycle hooks run server-side, outside the React runtime, so a UI import there either breaks at runtime or drags view code into a realm that must stay UI-free.

**Guidelines:**

- MUST flag a Payload `beforeOperation` / `afterOperation` hook that imports from `@/components/*` or any React module — Payload hooks run server-side, outside React.
- MUST flag a Payload collection `access` rule that returns `() => true` for an admin-only field (e.g., draft `_status`) without an explicit comment justifying why it is public.

## Cross-Tier Imports

An import that runs against the tier hierarchy couples layers meant to stay independent, eroding the boundaries the tiers exist to enforce.

**Guidelines:**

- MUST flag any import path that crosses tiers in the wrong direction:
  - `payload/` MUST NOT import from `app/`. The Payload realm owns collections and config and must stay UI-free; `app/` reaches it only through Payload's local API via repositories.
  - `app/(app)/_/` modules MUST NOT import from a specific route's `_components/` or `_/`. Shared code should not depend on route-local code.
- SHOULD flag deep relative imports (`../../../`) that cross more than two directory levels — the project uses path aliases (`@/components`, `@/repositories`, `@/helpers`, `@/logger`, `@/runtime`, `@/payload/...`).
