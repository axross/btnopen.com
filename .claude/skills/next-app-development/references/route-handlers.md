# Route Handlers

Apply this reference when adding a `route.ts`, shaping an HTTP response, or reviewing an endpoint that is not a server function.

## Method Exports and Context

A `route.ts` exports one function per HTTP method it serves. The supported names are `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `HEAD`, and `OPTIONS`. An undefined `OPTIONS` is implemented automatically with an `Allow` header derived from the others.

```ts
// app/api/articles/[id]/route.ts
import type { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  ctx: RouteContext<"/api/articles/[id]">,
) {
  const { id } = await ctx.params;
  return Response.json(await getArticleView(id));
}
```

`RouteContext` is a globally available generated helper, like `PageProps` — it takes the route literal and types `params` from it. It is not imported.

**Guidelines:**

- MUST export handlers under the exact method names; a lowercase or misspelled export serves nothing and reports nothing.
- MUST await `ctx.params`; it is a promise, as everywhere else in v16.
- SHOULD type the context with `RouteContext<'/literal/[param]'>` so a renamed segment becomes a type error.
- MUST NOT place `route.ts` in a directory that already has `page.tsx`.

## Handler or Server Function

Both are server-side endpoints. They are not interchangeable.

Reach for a **route handler** when the caller is not this application's own React tree: a webhook, a third-party integration, an OAuth callback, a native mobile client, a feed or file download, an endpoint with a stable public contract, or a response whose headers, status, or streaming shape you need to control.

Reach for a **server function** when this application's own UI initiates a mutation and wants the affected tree re-rendered in the same round trip.

**Guidelines:**

- SHOULD use a server function for this application's own mutations, and a route handler for everything with an external caller or a non-UI response.
- SHOULD use a route handler when the response needs specific status codes, headers, content types, or streaming — a server function's return value has none of that control.
- MUST NOT build a route handler purely to be called by this application's own form; that is what a server function is.

## Environment Functions Inside a Handler

These are supported inside a route handler:

| Function       | Use                                                 |
| -------------- | --------------------------------------------------- |
| `cookies()`    | Read, set, and delete cookies                       |
| `headers()`    | Read request headers (read-only)                    |
| `draftMode()`  | Read and toggle draft mode                          |
| `after()`      | Schedule work for after the response is sent        |
| `connection()` | Force a runtime boundary before reading environment |
| `userAgent()`  | Parse the user-agent header                         |

All of them are async and must be awaited.

**Guidelines:**

- MUST await every one of these; synchronous access was removed in v16.
- SHOULD read simple values off `request` (`request.cookies`, `request.nextUrl.searchParams`, `request.headers`) rather than importing the equivalent helper, when the request object is already in hand.
- MUST use `headers()` for reading only; to set a header, return a `Response` carrying it.

## Shaping the Response

Control over the response is the main reason to write a handler rather than a server function, so the status, headers, and body are the deliverable rather than an afterthought. The most common defect is a failure path that returns an error body with a default 200, which every caller reads as success.

**Guidelines:**

- SHOULD use `Response.json(body, init)` for JSON rather than constructing a `Response` with a manual `Content-Type`.
- SHOULD use `Response.redirect(url, status)` or `redirect()` from `next/navigation` for redirects, and set the status deliberately — 307 and 308 preserve the method, 302 and 301 do not.
- MUST set an explicit status on every non-200 outcome; a handler returning a body with a default 200 on failure is indistinguishable from success to its caller.
- MUST set `Cache-Control` deliberately on a handler whose response is cacheable; `GET` handlers default to dynamic since v15.
- SHOULD stream a large or incremental response with a `ReadableStream` rather than buffering it.

## Web Standards First, Node.js Where Needed

Handlers run on the Node.js runtime and have the whole Node API available. Preferring Web-standard APIs where a choice exists keeps handlers portable and testable, but this is a preference, not a prohibition — where only a Node.js API will do, use it.

**Guidelines:**

- SHOULD prefer `Request`, `Response`, `Headers`, `URL`, `URLSearchParams`, `fetch`, `ReadableStream`, and `crypto.subtle` where they cover the need.
- MAY use Node.js APIs — `node:crypto`, `node:fs`, `node:buffer`, a database driver — where a Web-standard equivalent does not exist or does not fit.
- MUST NOT assume an Edge runtime or write to the constraints of one; nothing here runs on Edge by default.
- SHOULD declare `runtime` on the segment only when the handler genuinely requires a specific one, and not as a habit.

## Authenticated Writes

A handler is reachable by anyone who knows its URL, from anywhere, with any method and body. Session cookies are attached by the browser on cross-origin requests too, which is why a cookie-authenticated write needs a second factor the attacker's page cannot supply.

**Guidelines:**

- MUST authenticate and authorize inside every handler that reads or mutates non-public data — the proxy is not sufficient, and a matcher change can silently remove its coverage.
- MUST verify a webhook's signature against its shared secret before acting on the payload, and reject on mismatch.
- MUST protect a state-changing handler against cross-origin invocation — check `Origin` against an allowlist, or require a header a simple cross-origin form cannot set.
- SHOULD make a state-changing handler idempotent, keyed on a client-supplied idempotency key where the operation permits, so a retried delivery does not double-apply.
- MUST NOT treat a `GET` handler as safe by convention while letting it mutate; keep reads in `GET` and writes in the method that matches.

## Image Responses

`ImageResponse` renders JSX to an image, which is how Open Graph images and dynamic icons are produced.

**Guidelines:**

- SHOULD generate social images through the metadata file conventions rather than a hand-written handler when the image belongs to a route; see the metadata reference.
- MUST keep an `ImageResponse` handler's input bounded and validated — it renders on demand, and unbounded input makes it a denial-of-service surface.
- SHOULD cache generated images rather than regenerating per request.

**Review checks:**

- A handler reading or mutating non-public data with no authentication check in its body — **Critical**.
- A webhook handler acting on a payload before verifying its signature — **Critical**.
- A state-changing handler with no cross-origin protection — **Critical**.
- A route parameter or query value interpolated into a query, path, or outbound URL unvalidated — **Critical**.
- A failure path returning a body with an implicit 200 — **Major**.
- `route.ts` added beside an existing `page.tsx` — **Critical**; the build fails.
