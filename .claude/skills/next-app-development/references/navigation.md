# Navigation

Apply this reference when adding links between routes, wiring imperative navigation, tuning prefetch behaviour, reading search params, or building a modal route.

## Linking

`<Link>` is the default. It renders a real anchor — so it keeps middle-click, open-in-new-tab, and the accessibility semantics of a link — and additionally prefetches the target and performs a client-side transition. A bare `<a>` to an internal route throws all of that away and does a full document load.

```tsx
import Link from "next/link";

<Link href={`/articles/${article.slug}`}>{article.title}</Link>;
```

**Guidelines:**

- MUST use `<Link>` for internal navigation; reserve `<a>` for external URLs, downloads, and `mailto:`/`tel:` targets.
- MUST NOT wrap a `<Link>` in an `<a>` or nest an `<a>` inside one; the component renders the anchor itself.
- SHOULD pass a typed route literal rather than a hand-assembled string where typed routes are enabled, so a renamed segment is a build error.

## Imperative Navigation

`useRouter` exists for navigation that follows an event rather than a click on a link — after a successful mutation, on a timer, or in response to a state change.

**Guidelines:**

- MUST import `useRouter` from `next/navigation`, never from `next/router`, which is the Pages Router hook and does not work here.
- SHOULD prefer `redirect()` in a Server Component or server function over routing from the client after a round trip; the redirect happens on the server and saves a render.
- SHOULD use `router.back()` for a dismissal that should restore the previous entry, rather than pushing a new one and growing the history stack.
- MUST NOT call `router.refresh()` as a substitute for cache invalidation after a mutation; invalidate the tag or path that changed instead (see the caching reference).

## Prefetching

[Links](https://nextjs.org/docs/app/api-reference/components/link) prefetch by default when they enter the viewport. In v16 the prefetch model became incremental — a shared layout is fetched once across sibling links, and only the parts not already cached are requested. The result is more requests carrying less total data, which is the right trade for nearly every application.

The default stops being right when a route is expensive to produce and rarely followed: a viewport full of links to heavy dynamic pages will prefetch all of them.

**Guidelines:**

- SHOULD leave prefetching at its default; it is tuned for the common case.
- SHOULD set `prefetch={false}` on links to routes that are expensive to render and unlikely to be visited — a long list of admin detail pages, a footer's worth of legal routes.
- SHOULD NOT disable prefetch across the board to reduce request counts; the transfer size is what matters, and it went down.
- MUST account for the proxy when tuning prefetch: prefetch requests run through it, so proxy work is paid per prefetched link, not per navigation.

## Pending State on a Link

A navigation that takes time with no feedback reads as a broken link. `useLinkStatus` reports the pending state of the enclosing link, so a spinner can live in a child component without lifting state.

```tsx
"use client";
import { useLinkStatus } from "next/link";

function LinkSpinner() {
  const { pending } = useLinkStatus();
  return pending ? <Spinner data-testid="link-spinner" /> : null;
}
```

**Guidelines:**

- SHOULD render pending feedback on any navigation that can exceed the project's response-time budget, using `useLinkStatus` inside the link rather than tracking navigation state globally.
- MUST render the hook's consumer as a descendant of the `<Link>` whose status it reports; outside one it reports nothing.

## `useSearchParams` and the Static Bailout

`useSearchParams` reads a value that only exists per request. Calling it in a component that would otherwise be statically rendered forces that route to client-side render — and without a Suspense boundary the bailout climbs to the whole route.

**Guidelines:**

- MUST wrap the component that calls `useSearchParams` in its own Suspense boundary, so the bailout is contained to that subtree.
- SHOULD read search params from the `searchParams` prop on the server instead, whenever the value is needed for rendering rather than for interaction.
- SHOULD keep the hook in the smallest possible leaf — a filter control, not the page shell.

## Typed Routes and History Updates

A route string is the one part of navigation the compiler cannot check by default, and a renamed segment leaves working-looking links that 404. Separately, not every URL change is a navigation: reflecting a filter in the query string should update the address bar without re-running the router's data loading.

**Guidelines:**

- SHOULD enable typed routes in a new application so `href` values are checked against the routes that actually exist.
- SHOULD use the native History API (`history.pushState`, `history.replaceState`) for URL updates that must not trigger a navigation — a filter or sort reflected in the query string — and let the router observe the change.
- MUST NOT use the History API to move between routes; it bypasses the router's data loading entirely.

## Modals from Parallel and Intercepting Routes

A modal that must also be a shareable, refreshable URL is built from a parallel slot plus an intercepting route: the intercepted path renders into the slot as an overlay on soft navigation, and the same URL renders the full page on a hard load.

```
app/
├── layout.tsx            # renders {children} and {modal}
├── @modal/
│   ├── default.tsx       # returns null — required
│   └── (.)photos/[id]/page.tsx
└── photos/[id]/page.tsx  # the full page on direct load
```

**Guidelines:**

- MUST provide `default.tsx` in the slot, returning `null` for a modal that is absent by default.
- MUST implement dismissal with `router.back()` so the URL returns to the underlying route, rather than by hiding the overlay with local state while the URL still points at the modal.
- MUST keep the non-intercepted route a complete page; it is what a shared link, a refresh, and a crawler receive.

**Review checks:**

- An `<a href="/internal-route">` where a `<Link>` belongs — **Major**; it forces a full document load and loses the client transition.
- `useRouter` imported from `next/router` — **Critical**; it is the wrong router and fails at runtime.
- `useSearchParams` called with no enclosing Suspense boundary — **Major**; it opts the whole route out of static rendering.
- A modal overlay dismissed by local state while the intercepting URL remains — **Minor**; back and refresh then disagree with the UI.
