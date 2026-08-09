# Route Files

Apply this reference when adding a route, naming a segment, introducing a route group or parallel slot, or reviewing a change that adds files under `app/`.

## The Special Files

Inside `app/`, filenames are API. A file named `page.tsx` creates a publicly reachable URL; the same content named `view.tsx` creates nothing. Every file the router recognizes has its own page under [File-system conventions](https://nextjs.org/docs/app/api-reference/file-conventions).

What that index does not tell you is which of them are **not stable on the 16.2.x line** — it documents each on its own terms, so the stability question has to be asked file by file. Three are unstable, and each must be marked wherever it is used:

- `forbidden.tsx` and `unauthorized.tsx` — with their `forbidden()` and `unauthorized()` functions — require `experimental.authInterrupts: true` and are documented as "currently available in the canary channel and subject to change."
- `global-not-found.tsx` requires `experimental.globalNotFound: true`.

**Guidelines:**

- MUST spell every special file exactly as the framework defines it; a near-miss produces no error, just a route that does not exist.
- MUST place a `default.tsx` in every parallel slot. A build fails without one — this is enforced from v16, where earlier versions inferred a fallback.
- MUST gate any use of `forbidden`, `unauthorized`, or `global-not-found` behind its experimental flag and state in the change that it ships on a pre-stable channel.
- SHOULD NOT adopt a canary-channel API in a codebase that pins a stable release line, unless the change records why the risk is accepted.

## Nesting Order

The files compose in a fixed order, outermost first. Knowing it tells you which boundary catches what:

```
layout.tsx
└── template.tsx
    └── error.tsx
        └── loading.tsx
            └── not-found.tsx
                └── page.tsx
```

A layout sits **outside** its own segment's `error.tsx`, so an error thrown in a layout is caught by the parent segment's boundary, not its own. This is the single most common surprise in the hierarchy.

**Guidelines:**

- MUST place an error boundary in the parent segment when the code that can throw lives in a layout; a sibling `error.tsx` will not catch it.
- SHOULD put `loading.tsx` at the segment whose data is actually slow, rather than at the root where it blanks the whole application.

## Segment Syntax

Directory names carry meaning beyond their spelling, across four separately documented conventions: [dynamic segments](https://nextjs.org/docs/app/api-reference/file-conventions/dynamic-routes) (`[slug]`, `[...slug]`, `[[...slug]]`), [route groups](https://nextjs.org/docs/app/api-reference/file-conventions/route-groups) (`(group)`, and the `_private` folder beside it), [parallel routes](https://nextjs.org/docs/app/api-reference/file-conventions/parallel-routes) (`@slot`), and [intercepting routes](https://nextjs.org/docs/app/api-reference/file-conventions/intercepting-routes) (`(.)`, `(..)`, `(...)`).

The hazard is that none of these is validated. A directory whose name almost matches one of these forms is a literal path segment, so the URL it produces is wrong rather than absent — which is why a name is checked against the reference rather than against memory.

**Guidelines:**

- MUST name routable segments in lowercase kebab-case; the segment becomes the URL, and a mixed-case path is a permanent, externally visible inconsistency.
- SHOULD shape paths as resources rather than actions — `/articles/[slug]/edit`, not `/edit-article?id=`.
- SHOULD use a route group to give a set of routes a shared layout without inventing a URL segment for it.
- SHOULD use a private folder for colocated non-route code only when the repository colocates at all; a domain directory outside `app/` is the stronger default.
- MUST supply an optional catch-all rather than a plain catch-all when the parent path must also match, since `[...slug]` does not match the bare parent.

## Colocation

Files under `app/` that are not one of the special names are not routable — the router only publishes `page` and `route`. Colocating a component beside its route is therefore safe, but it is still a layout decision.

**Guidelines:**

- MAY colocate a component used by exactly one route beside that route's `page.tsx`.
- SHOULD move a colocated file into a domain directory as soon as a second route imports it.
- MUST NOT rely on colocation for privacy: a file under `app/` is not routable, but it is still bundled into whatever imports it.

## Pairs That Cannot Coexist

Two files can each be individually valid and still collide, because the router resolves both to the same URL. These failures surface at build time, which is the good case — the route-group collision below can hide until the second group is added.

**Guidelines:**

- MUST NOT place `route.ts` and `page.tsx` in the same directory; both claim the same URL and the build fails.
- MUST NOT define two routes that resolve the same path through different groups — route groups are erased from the URL, so `(marketing)/about` and `(shop)/about` collide.
- MAY define multiple root layouts by placing each in its own route group with no shared root layout above; each then owns its own `<html>` and `<body>`, and navigating between them is a full page load.

**Review checks:**

- A parallel slot added with no `default.tsx` — **Critical**; the build fails.
- `route.ts` and `page.tsx` added to the same directory — **Critical**; the build fails.
- A canary or experimental route file used with no config flag enabling it, or with no note that it is pre-stable — **Major**.
- A new routable segment in camelCase or PascalCase where siblings are kebab-case — **Minor**, and permanent once shipped.
