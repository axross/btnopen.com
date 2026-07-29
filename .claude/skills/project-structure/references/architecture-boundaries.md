# Architecture Boundaries

Apply this reference when placing code that crosses one of this repository's internal seams — app to data layer, server to client, app to the Payload realm — while writing it, and while reviewing where a change put it.

The general practice behind these seams belongs to the code maintainability capability's abstraction-boundary rules and, for the framework mechanics, to the Next.js app development capability. What follows is only what those defer to the project on: which modules sit on which side here, and what they are named.

## Data-Access Split

Payload CMS runs in-process with Next.js: `payload/` owns collections and config, `app/` owns the UI, and data access runs through Payload's local API. When a Server Component or route handler reaches into Payload directly, caching, schema validation, and logging scatter across every call site instead of living in one place.

**Guidelines:**

- MUST route data access through a function under `app/(app)/_/repositories/` (or a route-local `_/repositories/`); a Server Component or `route.ts` that calls `getPayload({ config })` or `payload.find(…)` directly is the finding.
- MUST have a repository function return a Zod-parsed view type (`BlogPostDetail`, `BlogPostSummary`) rather than the raw Payload document type (`BlogPost` from `@/payload/types`). The repository layer owns the schema-to-domain transform, via `PayloadBlogPost.parse(…)`.
- MUST keep repositories UI-free: a repository that calls a React API or imports from `react`, `next/link`, or a component module is the finding.
- MUST keep repositories read-only. A Server Component that mutates data is the finding; mutations belong in a `route.ts` handler or a Payload hook.

## Server / Client Boundary

The general rule — no data fetching in a client component, no server-only imports reaching the browser bundle — belongs to the code maintainability capability. These are the concrete module names it resolves to here.

**Guidelines:**

- MUST keep a `"use client"` component from importing `@/repositories/*`, `@/payload/*`, `payload`, or any module that itself imports `server-only`; each leaks server code into the client bundle.
- MUST keep data fetching (`fetch()`, `getPayload(…)`, `getBlogPost(…)`) out of a `"use client"` component; lift it into the parent Server Component or its repository.
- MUST split a Server Component that needs `useState`, `useEffect`, an event handler, or a browser API into a `loaded.tsx` server half and an interactive client child, rather than converting the whole component.
- MUST NOT pass a `Promise<T>` prop into a `"use client"` component — promise props are RSC-only here.

## Payload Hook Boundary

Payload lifecycle hooks run server-side, outside the React runtime, so a UI import there either breaks at runtime or drags view code into a realm that must stay UI-free.

**Guidelines:**

- MUST keep a Payload `beforeOperation` / `afterOperation` hook free of imports from `@/components/*` or any React module.
- MUST NOT treat a Payload collection field's `admin.hidden: true` as access control; it is a UI affordance only. Gate the field with `access.read` per [payload-conventions.md](./payload-conventions.md).

## Cross-Tier Imports

An import that runs against the tier hierarchy couples layers meant to stay independent. The tiers themselves are defined in [placement-and-naming.md](./placement-and-naming.md).

**Guidelines:**

- MUST NOT import from `app/` inside `payload/`. The Payload realm owns collections and config and stays UI-free; `app/` reaches it only through Payload's local API, via repositories.
- MUST NOT import a specific route's `_components/` or `_/` from an `app/(app)/_/` module. Shared code must not depend on route-local code.
- SHOULD prefer the configured path aliases (`@/components`, `@/repositories`, `@/helpers`, `@/logger`, `@/runtime`, `@/payload/...`) over deep relative imports (`../../../`) that cross more than two directory levels.

## Markdown Pipeline Boundary

The single-owning-module rule for the Remark/Rehype chain, the server-only constraint on rendering it, and the component-map pairing rule belong to the project's markdown-processing capability. Consult it before adding any module that parses or renders markdown, rather than re-deriving the boundary here.
