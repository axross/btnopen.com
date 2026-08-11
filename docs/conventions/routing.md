# Routing

What a route's URL path looks like here, which directories become routes, and
where each route file sits.

The App Router mechanics themselves — what each special file does, how params
resolve, how rendering and caching behave — belong to the installed Next.js
capability. This document records only the shape this repository gives them.

## Path Structure

Route paths make the addressed resource obvious from the URL, so a path SHOULD
repeat the resource type alongside the resource identifier — `posts/[id]` rather
than `[id]`, and `posts/[id]/comments/[id]` rather than `[id]/[id]`. Path
elements SHOULD be lowercased and kebab-cased.

A dynamic segment SHOULD be named semantically, describing the resource
identifier it represents — `posts/[slug]` rather than `posts/[id]` when the
identifier is a slug. Optional inputs such as pagination, filtering, sorting,
language, and draft/preview status SHOULD go in search params instead of creating
extra path branches.

## Directory Conventions

Route groups (`(group-name)` directories) SHOULD be used to organize routes
logically without affecting the URL structure — `(app)/` wraps all main
application routes, `(index)/` groups the index route's files. The one exception
is the metadata files below, which the framework resolves only at the `app/`
root.

Underscore-prefixed directories hold files that must not become routes, so a
non-route directory MUST be prefixed with `_` to exclude it from routing: `_/`
for feature-agnostic shared modules such as components, helpers, and repositories
scoped to a layout level, and `_components/` for UI components specific to the
nearest layout or page.

## File Conventions

Route files keep page rendering, route props, not-found handling, metadata
images, and mutation handlers in predictable places.

```typescript
export interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ draft?: "true"; preview?: "true" }>;
}
```

A `page-props.ts` file SHOULD be co-located with each `page.tsx`, exporting a
`PageProps` interface, and `params` and `searchParams` MUST be typed as
`Promise<...>`, per the framework's async route APIs.

A `not-found.tsx` file MAY be co-located with any route segment that requires a
custom 404 UI. OG image files such as `thumbnail.png` SHOULD be co-located with
the route segment they belong to, using file-based metadata conventions.

A route handler (`route.ts`) MUST NOT be placed in the same directory as a
`page.tsx`, and SHOULD instead go in a dedicated sub-directory named after the
resource it manages, such as `posts/[slug]/caches/route.ts` rather than
`posts/[slug]/route.ts`. The five handlers in the tree are `posts/caches/`
(`DELETE`), `posts/[slug]/caches/` (`DELETE`), `posts/[slug]/comments/`
(`POST`), and its two children `comments/token/` (`GET`) and `comments/caches/`
(`DELETE`).

A handler MAY be nested under the resource it serves rather than the resource it
is addressed by, when co-location is what makes it findable. `comments/token/`
issues a CSRF token that is not slug-specific at all; the `[slug]` segment above
it buys nothing functionally and exists so the endpoint sits beside the write
path it protects.

## Root-Level Metadata Files

`robots.ts` and `sitemap.ts` live at `app/robots.ts` and `app/sitemap.ts` — at
the `app/` root, outside the `(app)` group that holds every other reader-facing
route — and MUST be kept there. That is a framework constraint rather than a
preference. Next.js anchors its `robots` matcher (and its `manifest` matcher) to
the app root, so a `robots.ts` inside a route group generates no route at all:
the build succeeds, lint passes, and `/robots.txt` serves the 404 page, which is
how the site shipped without one until
[#182](https://github.com/axross/btnopen.com/issues/182). `sitemap.ts` is matched
at any depth and would work inside the group; it sits beside `robots.ts` so both
follow one rule a reader can see in the tree. A metadata file at the `app/` root
MUST NOT be reported as a violation of the convention that `(app)/` wraps every
application route; this section is that convention's stated exception.

Route groups also rename the metadata *image* routes they contain.
`app/(app)/icon.tsx` serves `/icon-xg4ifa`, not `/icon`, because Next.js hashes
the group-bearing parent path into the route name. That is harmless — the
generated `link rel="icon"` points at the hashed path — but it is why a metadata
route's URL cannot be read off the directory tree alone. A new or moved metadata
route SHOULD therefore be confirmed to appear in
`.next/app-path-routes-manifest.json` after `npm run build`, because a misplaced
metadata file fails silently rather than erroring.

## Route Handler Exposure

A mutation handler is reachable by every client on the internet the moment it
deploys, whether or not any UI links to it. The authentication and access-control
rules for one are in [payload.md](./payload.md), and the CSRF rules in
[security.md](./security.md). `POST /posts/[slug]/comments` is the one handler
here that accepts a write from an unauthenticated member of the public; the
ordered checks it applies before writing are in
[../specs/comments.md](../specs/comments.md), which MUST be read before adding a
second such endpoint.
