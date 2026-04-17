# Naming and Organization

Apply these rules to verify that changed files live in the right place with the right name.

## File Naming

- MUST flag any new `.ts` / `.tsx` / `.module.css` file whose name is not kebab-case (e.g., `BlogPostHeader.tsx` or `blog_post_header.tsx`). The project rule is in [react-component-guidelines › conventions](../react-component-guidelines/conventions.md).
- MUST flag a new component file that lacks its CSS module sibling when the component renders any DOM (e.g., `blog-post-header.tsx` requires `blog-post-header.module.css` if it has any visual styling).
- SHOULD flag a CSS module file whose base name does not match its component file (e.g., `blog-post-header.tsx` paired with `header.module.css`).

## Directory Tier

The project has three tiers of shared code under `app/(app)/`. The reviewer MUST verify a new module lives at the **lowest** tier that has more than one caller:

| Tier | Path | When to use |
|---|---|---|
| Route-local | `app/(app)/<route>/_components/`, `app/(app)/<route>/_/` | Used only by `page.tsx` / `layout.tsx` / sibling files of one route |
| Route-group-shared | `app/(app)/_/components/`, `app/(app)/_/helpers/`, `app/(app)/_/repositories/` | Used by ≥ 2 routes inside `(app)/` |
| Payload-side | `payload/collections/`, `payload/globals/`, `payload/helpers/` | Runs inside the Payload CMS realm only |

- MUST flag a new file placed in `app/(app)/_/` that is only consumed by one route — it SHOULD live in that route's `_/` or `_components/` instead.
- MUST flag a new file placed in a route-local `_components/` that is also imported by another route — it SHOULD be promoted to `app/(app)/_/components/`.
- MUST flag any new file placed under `app/(payload)/` — that directory is owned by Payload CMS per [development-guidelines › change-management](../development-guidelines/change-management.md).
- MUST flag any helper or component placed at the repository root or inside `app/` directly (i.e., not inside an `_/` or `_components/` directory) — Next.js will treat the directory as a route segment.

## Route File Layout

When the diff adds or moves a route, the reviewer MUST verify per [routing-guidelines](../routing-guidelines/SKILL.md):

- A `page-props.ts` co-located with `page.tsx`, exporting a `PageProps` interface with `Promise<…>`-typed `params` and `searchParams`.
- A `not-found.tsx` co-located when the route can fail to resolve (e.g., dynamic `[slug]` that may not exist).
- OG image files co-located with the route they belong to (e.g., `app/(app)/posts/[slug]/thumbnail.png`).
- Any `route.ts` lives in its own sub-directory, never next to a `page.tsx` (e.g., `posts/caches/route.ts`, never `posts/route.ts`).

## Identifier Naming

- MUST flag identifier-naming inconsistency within the changed file's neighborhood. Examples to flag:
  - A new component named in `PascalCase` when its siblings use `camelCase` (or vice versa) — match the existing file.
  - A repository function not prefixed with `get…` (e.g., `fetchBlogPost`) when siblings are `getBlogPost`, `getBlogPosts`, `getWebsite`.
  - A child logger module emoji that duplicates an existing module's emoji (the project uses unique emojis per module per [observability-guidelines › logging](../observability-guidelines/logging.md)).
- SHOULD flag opaque abbreviations in new identifiers (`bp` for "blog post", `usr` for "user"). The project favors full words.
- SHOULD flag a `Promise<T>` prop received without the `Promise` suffix alias at the receiving component per [react-component-guidelines › client-vs-server-components](../react-component-guidelines/client-vs-server-components.md).
