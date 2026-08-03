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

- SHOULD use route groups (`(group-name)` directories) to organize routes logically without affecting the URL structure — `(app)/` wraps all main application routes, `(index)/` groups the index route's files. The one exception is the metadata files below, which the framework resolves only at the `app/` root.
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
- SHOULD place route handlers in a dedicated sub-directory named after the resource they manage, such as `posts/[slug]/caches/route.ts` rather than `posts/[slug]/route.ts`. The five handlers in the tree are `posts/caches/` (`DELETE`), `posts/[slug]/caches/` (`DELETE`), `posts/[slug]/comments/` (`POST`), and its two children `comments/token/` (`GET`) and `comments/caches/` (`DELETE`).
- MAY nest a handler under the resource it serves rather than the resource it is addressed by, when co-location is what makes it findable. `comments/token/` issues a CSRF token that is not slug-specific at all; the `[slug]` segment above it buys nothing functionally and exists so the endpoint sits beside the write path it protects.

## Root-Level Metadata Files

`robots.ts` and `sitemap.ts` live at `app/robots.ts` and `app/sitemap.ts` — at the `app/` root, outside the `(app)` group that holds every other reader-facing route. That is a framework constraint rather than a preference. Next.js anchors its `robots` matcher (and its `manifest` matcher) to the app root, so a `robots.ts` inside a route group generates no route at all: the build succeeds, lint passes, and `/robots.txt` serves the 404 page. `sitemap.ts` is matched at any depth and would work inside the group; it sits beside `robots.ts` so both follow one rule a reader can see in the tree.

Route groups also rename the metadata *image* routes they contain. `app/(app)/icon.tsx` serves `/icon-xg4ifa`, not `/icon`, because Next.js hashes the group-bearing parent path into the route name. That is harmless — the generated `link rel="icon"` points at the hashed path — but it is why a metadata route's URL cannot be read off the directory tree alone.

**Guidelines:**

- MUST keep `robots.ts` and `sitemap.ts` at the `app/` root; moving either into `(app)` silently drops `/robots.txt`, which is how the site shipped without one until [#182](https://github.com/axross/btnopen.com/issues/182).
- MUST NOT report a metadata file at the `app/` root as a violation of the convention that `(app)/` wraps every application route; this section is that convention's stated exception.
- SHOULD confirm a new or moved metadata route appears in `.next/app-path-routes-manifest.json` after `npm run build`, because a misplaced metadata file fails silently rather than erroring.

## Route Handler Exposure

A mutation handler is reachable by every client on the internet the moment it deploys, whether or not any UI links to it. The authentication and access-control rules for one are recorded in [payload-conventions.md](./payload-conventions.md), and the CSRF rules in [security-conventions.md](./security-conventions.md). `POST /posts/[slug]/comments` is the one handler here that accepts a write from an unauthenticated member of the public, and the ordered checks it applies before writing are recorded in [comments-subsystem.md](./comments-subsystem.md) — read that before adding a second such endpoint.
