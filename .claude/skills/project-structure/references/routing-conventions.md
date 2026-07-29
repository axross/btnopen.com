# Routing Conventions

Apply this reference when creating, moving, renaming, or reviewing a route under `app/`. The App Router mechanics themselves — what each special file does, how params resolve, how rendering and caching behave — belong to the Next.js app development capability. This reference records only the shape this repository gives them.

## Path Structure

Route paths should make the addressed resource obvious from the URL. Dynamic segments should name the resource identifier they represent, and optional inputs should stay in search params instead of creating extra path branches.

**Guidelines:**

- SHOULD repeat the resource type and resource identifier in path structures, such as `posts/[id]` instead of `[id]`, and `posts/[id]/comments/[id]` instead of `[id]/[id]`.
- SHOULD use lowercased, kebab-cased path elements.
- SHOULD use search params for optional inputs such as pagination, filtering, sorting, language, and draft/preview status.
- SHOULD use semantic dynamic segment names that describe the resource identifier, such as `posts/[slug]` rather than `posts/[id]` when the identifier is a slug.

## Directory Conventions

Route groups organize files without changing the URL; underscore-prefixed directories hold files that must not become routes.

**Guidelines:**

- SHOULD use route groups (`(group-name)` directories) to organize routes logically without affecting the URL structure — `(app)/` wraps all main application routes, `(index)/` groups the index route's files.
- MUST prefix non-route directories with `_` to exclude them from routing.
  - Use `_/` for feature-agnostic shared modules such as components, helpers, and repositories scoped to a layout level.
  - Use `_components/` for UI components specific to the nearest layout or page.

## File Conventions

Route files should keep page rendering, route props, not-found handling, metadata images, and mutation handlers in predictable places.

**Example:**

```typescript
export interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ draft?: "true"; preview?: "true" }>;
}
```

**Guidelines:**

- SHOULD define a `page-props.ts` file co-located with each `page.tsx`, exporting a `PageProps` interface.
- MUST type `params` and `searchParams` as `Promise<...>`, per the framework's async route APIs.
- MAY co-locate a `not-found.tsx` file with any route segment that requires a custom 404 UI.
- SHOULD co-locate OG image files such as `thumbnail.png` with the route segment they belong to, using file-based metadata conventions.
- MUST NOT place a route handler (`route.ts`) in the same directory as a `page.tsx`.
- SHOULD place route handlers in a dedicated sub-directory named after the resource they manage, such as `posts/[slug]/caches/route.ts` rather than `posts/[slug]/route.ts`.

## Route Handler Exposure

A mutation handler is reachable by every client on the internet the moment it deploys, whether or not any UI links to it. The authentication and access-control rules for one are recorded in [payload-conventions.md](./payload-conventions.md).
