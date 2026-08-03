# Proxy

Apply this reference when adding or editing `proxy.ts`, writing a matcher, migrating from the deprecated middleware convention, or reviewing what a change puts in front of every request.

## The File, the Function, and the Config

The convention is `proxy.ts` (or `.js`), placed beside `app/` — at the repository root when `app/` is at the root, inside `src/` when it is not. It exports a single function, named `proxy` or default, plus an optional config object.

```ts
// proxy.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  if (!request.cookies.has("session")) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
```

The config object is exported as `config`. Separately, the _next.config_ flags that carried "middleware" in their names were renamed: `skipMiddlewareUrlNormalize` became `skipProxyUrlNormalize`.

`middleware.ts` and its `middleware` export are deprecated. A codemod (`npx @next/codemod@canary middleware-to-proxy .`) performs the rename.

**Guidelines:**

- MUST use `proxy.ts` with a `proxy` function in new code; treat `middleware.ts` only as a migration source.
- MUST name the config export `config`.
- MUST rename `skipMiddlewareUrlNormalize` to `skipProxyUrlNormalize` in `next.config.ts` when migrating.
- MUST place the file at the same level as `app/`; anywhere else it silently never runs.
- MUST NOT define more than one proxy function in the file; multiple are unsupported.

## Runtime

The proxy runs on the **Node.js runtime**. This is not configurable — setting the `runtime` segment config in a proxy file throws. The Edge runtime is not supported in `proxy`; a project that requires Edge has to stay on the deprecated `middleware` convention.

**Gotcha:** the self-hosting documentation page still describes middleware as running on Edge. That page is stale on this point; the v16 upgrade guide and the `proxy` API reference are authoritative, and both state Node.js.

**Guidelines:**

- MUST assume the Node.js runtime and its full API surface in a proxy.
- MUST NOT set a `runtime` config option in a proxy file; it throws.
- MUST NOT write proxy code to Edge-runtime constraints, and MUST NOT cite the self-hosting page's Edge claim as current.

## The Matcher

Without a matcher, the proxy runs on **every request** — including `_next/static`, `_next/image`, and everything in `public/`. Auth logic with no matcher therefore blocks the CSS and JavaScript of the sign-in page it redirects to.

The matcher accepts strings, arrays, regular expressions, and objects with `source`, `locale`, `has`, and `missing`. Values must be statically analyzable constants; a variable is ignored silently.

**Guidelines:**

- MUST declare a matcher; the default of "everything" is almost never correct.
- MUST exclude `_next/static`, `_next/image`, and static asset paths from an auth or redirect matcher.
- MUST write matcher values as literal constants, since a computed value is ignored at build time with no error.
- SHOULD anchor patterns deliberately — a `source` matches from the start of the path, so `/about` also matches `/about/team`.
- MUST NOT assume excluding `_next/data` works: the proxy is invoked for those routes regardless, deliberately, so a protected page's data route cannot be left unprotected by an oversight in the matcher.

## What Belongs Here

The proxy sits in front of everything, on every matched request, before any render. That budget is small and shared.

**Belongs:** rewrites and redirects, locale negotiation, setting a request or response header, an A/B bucketing cookie, a coarse optimistic session-presence check, and blocking obviously bad requests.

**Does not belong:** database queries, authorization decisions, session validation against a store, heavy computation, anything needing a module the render also uses, and anything with per-request state.

**Guidelines:**

- MUST keep the proxy free of database and network calls to a session store; it runs on every matched request including prefetches.
- MUST NOT rely on shared modules or globals between the proxy and the application; the proxy may be deployed separately from the render, and in optimized cases to a CDN.
- SHOULD pass information from the proxy to the application through headers, cookies, rewrites, redirects, or the URL — never through in-process state.
- SHOULD keep headers small; oversized headers produce a 431 at the upstream server.
- MUST use `NextResponse.next({ request: { headers } })` to make a header visible to the application, not `NextResponse.next({ headers })`, which sends it to the client instead.

## Prefetches and Data Routes

The proxy runs on prefetch requests. Since links prefetch by default, a viewport of links produces proxy invocations before any user intent — which matters for anything the proxy does that has a cost, a side effect, or a rate limit.

**Guidelines:**

- MUST NOT put a side effect — analytics writes, rate-limit counters, audit logging — in the proxy without accounting for prefetches inflating it.
- MAY distinguish prefetches by matching on the `next-router-prefetch` header or `purpose: prefetch`, using `has`/`missing` matcher entries.
- SHOULD set `prefetch={false}` on links whose targets make the proxy do real work.

## Never the Only Authorization Check

This is the load-bearing rule. **Server functions are not separate routes.** They are handled as POST requests to the route where they are used — so a matcher that excludes a path also skips every server function called on that path. A matcher edit, or a refactor moving a server function to a different route, silently removes proxy coverage with no error and no test failure.

The proxy is an optimistic gate: it cheaply redirects an obviously-unauthenticated visitor away from a protected area. It is never the thing that decides whether a caller may read or write a record.

**Guidelines:**

- MUST verify authentication and authorization inside every server function, route handler, and data-access function, independently of the proxy.
- MUST NOT treat a proxy cookie-presence check as authentication; a cookie's presence is not its validity.
- SHOULD limit the proxy to reading a session cookie's presence and shape, leaving validation to the data layer.
- MUST re-audit the data layer, not the matcher, when a review asks "is this route protected".

**Review checks:**

- Authorization implemented only in the proxy, with the protected server function or handler doing no check of its own — **Critical**; a matcher change or a route move removes it silently.
- A proxy with no matcher, or one that does not exclude static and image paths — **Major**; it runs on every asset.
- A database or session-store call inside the proxy — **Major**; it runs on every matched request including prefetches.
- A `runtime` config set in a proxy file — **Critical**; it throws.
- A matcher value built from a variable — **Major**; it is silently ignored.
- `middleware.ts` added as new code rather than migrated — **Minor**; it is deprecated.
- `NextResponse.next({ headers })` used where the header was meant for the application — **Major**; it leaks to the client instead.
