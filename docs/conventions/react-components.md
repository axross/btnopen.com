# React Components

How a component here is typed, when it splits across the server/client boundary,
and how it reaches its data.

Composition, props contracts, state, and memoization in the abstract belong to
the installed React-component capability; server/client mechanics belong to the
installed Next.js capability; appearance belongs to
[visual-identity.md](./visual-identity.md) and the token mechanics to
[styling.md](./styling.md). This document records the shapes this repository has
settled on, and the seams a component must not cross.

## Anatomy

Every component this repository renders is typed from the element it roots, so a
caller can pass any attribute that element accepts without the component
enumerating them. A component SHOULD therefore use `ComponentProps<T>` from React
as its base props type, where `T` is the root rendered element type —
`ComponentProps<"div">` for a component rooting a `<div>`, `ComponentProps<"ul">`
for a `<ul>` — and SHOULD use `interface` over `type` for props that are purely
object types, with no intersection or union. The rules below reach the components
under `app/` — the ones this repository's own code instantiates.

They do not reach a Payload admin slot component under `payload/components/`,
whose props contract is Payload's rather than ours and which no caller here
renders. That departure, and why it was accepted, is recorded in
[../operations/agent-skills.md](../operations/agent-skills.md).

The same openness reaches the runtime: a component MUST spread `...props` onto
the root element so caller-supplied `data-*` attributes propagate, per the
test-hook rules in [testing.md](./testing.md).

## Server and Client Split

Server Components are the default. A component becomes a Client Component only
when it needs state or lifecycle (`useState`, `useReducer`, `useEffect`), DOM
event handlers (`onClick`, `onChange`, `onSubmit`), a browser-only API
(`window`, `localStorage`, `navigator`, `document`), or context. When a Server
Component needs one of those, it MUST be split rather than converted: keep the
server half and move the interactive part into a client child.

A `"use client"` component MUST NOT import `@/repositories/*`, `@/payload/*`,
`payload`, or any module that itself imports `server-only`; each leaks server
code into the client bundle. Data fetching (`fetch()`, `getPayload(…)`,
`getBlogPost(…)`) MUST stay out of a `"use client"` component as well, lifted
into the parent Server Component or its repository, and a `Promise<T>` prop
MUST NOT be passed into one — promise props are RSC-only here.

A side-effect-only Client Component — an analytics page-view tracker, for
instance — SHOULD return `null` and declare its return type as `null`. On the
server side, `params`, `searchParams`, and repository calls SHOULD be derived as
promises in the route and passed to children that `await` them inside
`<Suspense>`; `app/(app)/posts/[slug]/page.tsx` is the reference.

## Loading and Loaded Split

A component that fetches its own data and shows a user-visible loading state is
built as a triad: `<name>.tsx` orchestrates, `<name>/loaded.tsx` renders real
data, `<name>/loading.tsx` renders the skeleton.
`app/(app)/_/components/webembed/` is the canonical layout. The design intent
behind the split — no layout shift between skeleton and content — is in
[../specs/reader-surfaces.md](../specs/reader-surfaces.md). A data-fetching
component MUST be split into that orchestrator / `loaded` / `loading` triad when
its loading state is user-visible.

What holds a triad together is file adjacency: `loaded.module.css` and
`loading.module.css` sit side by side, so a cell added to one is hard to forget
on the other. The `loaded` and `loading` siblings MUST therefore stay on the same
CSS-Module selectors and tokens across their paired `loaded.module.css` /
`loading.module.css`, so adding a cell on one side cannot silently diverge from
the other, and `loading.tsx` MUST NOT import the loaded data type or render
fields from it; the skeleton has to render before the fetch resolves. The
`loading` sibling SHOULD accept the same `className` passthrough and a
`data-testid` suffixed with `-loading`, so a parent swaps only the component and
not the surrounding markup.

A skeleton standing at a **route-level** `<Suspense>` boundary cannot buy that
adjacency, because no single component owns both states there — the page does.
`<IndexPageMain>` and `<Comments>` each have a component file of their own, but
neither mounts its own skeleton: `app/(app)/(index)/page.tsx` and
`app/(app)/posts/[slug]/page.tsx` each mount one unconditionally behind the
route's own `<Suspense>` — on the post page even where `<Comments>` is not
rendered at all, because that post has comments disabled — so the pending state
belongs to the page's boundary rather than to the component. Neither has a
`loaded` half for a `loading` sibling to pair with, and giving either one a
skeleton of its own would move a decision the route makes into a component the
route is the only caller of. A standalone `<region>-loading.tsx` MAY be built
beside the region it covers instead, when the pending state is owned by a
route-level `<Suspense>` boundary rather than by a component with a `loaded`
sibling; it is the sanctioned shape there, and it carries by hand the discipline
adjacency used to enforce. `index-page-main-loading.tsx` and
`comments/comments-loading.tsx` are the two that exist.

Carrying it by hand means two things. A standalone skeleton MUST be given a
stylesheet whose rules mirror the loaded region's selectors, and the two MUST
move together on any change to either. And it MUST record in its doc comment why
it is not a triad, since no `loaded` sibling is there to imply it.

An async Server Component SHOULD be wrapped in `<Suspense>` at the call site with
a meaningful `fallback`. A `<Suspense>` without a fallback is legitimate for a
blocking component whose data the page semantically requires, and for non-visual
side-effect components such as JSON-LD injectors.

## Images

`app/(app)/_/components/media.tsx` reads `file.width` / `file.height` from
Payload and falls back to `unoptimized: true` when they are missing; a new image
component SHOULD match it. Image processing itself fails soft — uploads keep
succeeding while silently skipping conversion and resizing — so its loss shows up
as slow pages rather than errors. `payload/config.ts` MUST therefore keep passing
`sharp` to Payload: removing it makes uploads copy files unprocessed, breaking
the WebP and resize pipeline without any error.

`<Image src={userControlled} unoptimized />` MUST NOT be rendered for a host
absent from `next.config.ts` `images.remotePatterns`; see the SSRF rules in
[security.md](./security.md).

## Compiler and Rendering Flags

`next.config.ts` enables `reactCompiler: true` and `cacheComponents: true`. Both
change what a component gets for free — automatic memoization from the compiler,
and partial prerendering of the static shell — so hand-written memoization and
assumptions about when a component renders SHOULD be checked against them rather
than added reflexively.

## Data-Access Split

Payload CMS runs in-process with Next.js: `payload/` owns collections and config,
`app/` owns the UI, and data access runs through Payload's local API. When a
Server Component or route handler reaches into Payload directly, caching, schema
validation, and logging scatter across every call site instead of living in one
place. Data access MUST therefore route through a function under
`app/(app)/_/repositories/` (or a route-local `_/repositories/`); a Server
Component or `route.ts` that calls `getPayload({ config })` or `payload.find(…)`
directly is the finding.

A repository function MUST return a Zod-parsed view type (`BlogPostDetail`,
`BlogPostSummary`) rather than the raw Payload document type (`BlogPost` from
`@/payload/types`). The repository layer owns the schema-to-domain transform, via
`PayloadBlogPost.parse(…)` from `@/shared/payload-types`.

Repositories MUST stay UI-free: a repository that calls a React API or imports
from `react`, `next/link`, or a component module is the finding. They MUST also
stay read-only. A Server Component that mutates data is the finding; mutations
belong in a `route.ts` handler or a Payload hook.

## Cross-Tier Imports

An import that runs against the tier hierarchy couples layers meant to stay
independent. The tiers themselves are in
[directory-structure.md](./directory-structure.md).

`payload/` MUST NOT import from `app/`. The Payload realm owns collections and
config and stays UI-free; `app/` reaches it only through Payload's local API, via
repositories. Logic both realms need MUST route through `shared/` (imported as
`@/shared/*`) rather than being imported from `app/`. `shared/logger.ts`,
`shared/url-origin.ts`, `shared/comments.ts`, and `shared/payload-types.ts` are
the current members; each is framework-free, and `shared/` itself imports from
neither realm.

Environment values inside `payload/` MUST be read through
`payload/helpers/runtime.ts`, the realm's own barrel, not through
`app/(app)/_/runtime.ts`. The two resolve the origin with the same shared
`resolveUrlOrigin`, so they cannot drift, while the realm keeps a dependency
graph the Payload CLI can load outside Next's bundler.

An `app/(app)/_/` module MUST NOT import a specific route's `_components/` or
`_/`. Shared code must not depend on route-local code.

## Payload Hook Boundary

Payload lifecycle hooks run server-side, outside the React runtime, so a UI
import there either breaks at runtime or drags view code into a realm that must
stay UI-free. A Payload `beforeOperation` / `afterOperation` hook MUST therefore
stay free of imports from `@/components/*` or any React module.

A Payload collection field's `admin.hidden: true` MUST NOT be treated as access
control; it is a UI affordance only. Gate the field with `access.read`, and
justify any field-level rule that opens an admin-only field — see
[payload.md](./payload.md).

## Markdown Pipeline Boundary

The single-owning-module rule for the Remark/Rehype chain, the server-only
constraint on rendering it, and the component-map pairing rule are in
[markdown-pipeline.md](./markdown-pipeline.md) and
[markdown-extensions.md](./markdown-extensions.md). A change that adds any module
parsing or rendering markdown MUST read those first, rather than re-deriving the
boundary here.
