# Route Files

Apply this reference when adding a route, naming a segment, introducing a route group or parallel slot, or reviewing a change that adds files under `app/`.

## The Special Files

Inside `app/`, filenames are API. A file named `page.tsx` creates a publicly reachable URL; the same content named `view.tsx` creates nothing. These are the files the router recognizes:

| File                   | What it creates                                                     |
| ---------------------- | ------------------------------------------------------------------- |
| `layout.tsx`           | Shared UI wrapping a segment and its children; preserves state      |
| `template.tsx`         | Like a layout, but remounted on every navigation                    |
| `page.tsx`             | The publicly routable UI for a segment                              |
| `loading.tsx`          | A Suspense fallback for the segment and everything below it         |
| `error.tsx`            | An error boundary for the segment (a Client Component)              |
| `global-error.tsx`     | An error boundary replacing the root layout, including its `<html>` |
| `not-found.tsx`        | UI for a `notFound()` interrupt or an unmatched URL                 |
| `route.ts`             | A request handler for the segment; no UI                            |
| `default.tsx`          | The fallback a parallel slot renders when it has no match           |
| `forbidden.tsx`        | UI for a `forbidden()` interrupt — **canary**, see below            |
| `unauthorized.tsx`     | UI for an `unauthorized()` interrupt — **canary**, see below        |
| `global-not-found.tsx` | A whole-document not-found page — **experimental**, see below       |
| `instrumentation.ts`   | Server startup registration and the request-error hook              |

Two of these are not stable on the 16.2.x line and must be marked wherever they are used:

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

Directory names carry meaning beyond their spelling:

| Syntax         | Meaning                                                     |
| -------------- | ----------------------------------------------------------- |
| `[slug]`       | A single dynamic segment                                    |
| `[...slug]`    | A catch-all matching one or more segments                   |
| `[[...slug]]`  | An optional catch-all, also matching the parent path itself |
| `(group)`      | A route group: organizes files without appearing in the URL |
| `_private`     | A private folder: opted out of routing entirely             |
| `@slot`        | A parallel route slot, passed to the layout as a prop       |
| `(.)segment`   | Intercepts a route at the same level                        |
| `(..)segment`  | Intercepts one level above                                  |
| `(...)segment` | Intercepts from the root                                    |

**Guidelines:**

- MUST name routable segments in lowercase kebab-case; the segment becomes the URL, and a mixed-case path is a permanent, externally visible inconsistency.
- SHOULD shape paths as resources rather than actions — `/articles/[slug]/edit`, not `/edit-article?id=`.
- SHOULD use a route group to give a set of routes a shared layout without inventing a URL segment for it.
- SHOULD use a private folder for colocated non-route code only when the repository colocates at all; a feature directory outside `app/` is the stronger default.
- MUST supply an optional catch-all rather than a plain catch-all when the parent path must also match, since `[...slug]` does not match the bare parent.

## Colocation

Files under `app/` that are not one of the special names are not routable — the router only publishes `page` and `route`. Colocating a component beside its route is therefore safe, but it is still a layout decision.

**Guidelines:**

- MAY colocate a component used by exactly one route beside that route's `page.tsx`.
- SHOULD move a colocated file into a feature directory as soon as a second route imports it.
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
