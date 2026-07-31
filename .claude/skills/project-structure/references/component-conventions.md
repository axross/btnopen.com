# Component Conventions

Apply this reference when adding or changing a React component. Composition, props contracts, state, and memoization in the abstract belong to the React component development capability; server/client mechanics belong to the Next.js app development capability; appearance belongs to the project's visual-identity skill. This records the shapes this repository has settled on.

## Anatomy

Every component here is typed from the element it roots, so a caller can pass any attribute that element accepts without the component enumerating them.

**Guidelines:**

- SHOULD use `ComponentProps<T>` from React as the base props type, where `T` is the root rendered element type — `ComponentProps<"div">` for a component rooting a `<div>`, `ComponentProps<"ul">` for a `<ul>`.
- SHOULD use `interface` over `type` for props that are purely object types, with no intersection or union.
- MUST NOT use the `any` type; Biome's `noExplicitAny` treats it as a defect.
- MUST spread `...props` onto the root element so caller-supplied `data-*` attributes propagate, per the test-hook rules in [testing-conventions.md](./testing-conventions.md).

## Server and Client Split

Server Components are the default. A component becomes a Client Component only when it needs state or lifecycle (`useState`, `useReducer`, `useEffect`), DOM event handlers (`onClick`, `onChange`, `onSubmit`), a browser-only API (`window`, `localStorage`, `navigator`, `document`), or context.

**Guidelines:**

- MUST split rather than convert when a Server Component needs one of those: keep the server half and move the interactive part into a client child. The import prohibitions that make this necessary are in [architecture-boundaries.md](./architecture-boundaries.md).
- SHOULD have a side-effect-only Client Component — an analytics page-view tracker, for instance — return `null` and declare its return type as `null`.
- SHOULD derive `params`, `searchParams`, and repository calls as promises in the route and pass them to children that `await` them inside `<Suspense>`; `app/(app)/posts/[slug]/page.tsx` is the reference.

## Loading and Loaded Split

A component that fetches its own data and shows a user-visible loading state is built as a triad: `<name>.tsx` orchestrates, `<name>/loaded.tsx` renders real data, `<name>/loading.tsx` renders the skeleton. `app/(app)/_/components/webembed/` is the canonical layout. The design intent behind the split — no layout shift between skeleton and content — belongs to the project's visual-identity skill.

**Guidelines:**

- MUST split a data-fetching component into the orchestrator / `loaded` / `loading` triad when its loading state is user-visible.
- MUST NOT let `loading.tsx` import the loaded data type or render fields from it; the skeleton has to render before the fetch resolves.
- MUST keep the `loaded` and `loading` siblings on the same CSS-Module selectors and tokens across their paired `loaded.module.css` / `loading.module.css`, so adding a cell on one side cannot silently diverge from the other.
- SHOULD have the `loading` sibling accept the same `className` passthrough and a `data-testid` suffixed with `-loading`, so a parent swaps only the component and not the surrounding markup.
- SHOULD wrap async Server Components in `<Suspense>` at the call site with a meaningful `fallback`. A `<Suspense>` without a fallback is legitimate for a blocking component whose data the page semantically requires, and for non-visual side-effect components such as JSON-LD injectors.

## Images

`app/(app)/_/components/media.tsx` reads `file.width` / `file.height` from Payload and falls back to `unoptimized: true` when they are missing; new image components should match it. Image processing itself fails soft — uploads keep succeeding while silently skipping conversion and resizing — so its loss shows up as slow pages rather than errors.

**Guidelines:**

- MUST keep `payload/config.ts` passing `sharp` to Payload. Removing it makes uploads copy files unprocessed, breaking the WebP and resize pipeline without any error.
- MUST NOT render `<Image src={userControlled} unoptimized />` for a host absent from `next.config.ts` `images.remotePatterns`; see the SSRF rules in [security-conventions.md](./security-conventions.md).

## Compiler and Rendering Flags

`next.config.ts` enables `reactCompiler: true` and `cacheComponents: true`. Both change what a component gets for free — automatic memoization from the compiler, and partial prerendering of the static shell — so hand-written memoization and assumptions about when a component renders should be checked against them rather than added reflexively.
