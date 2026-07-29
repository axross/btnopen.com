# Directives

Apply this reference when adding or reviewing any of the module-level markers that change where code runs or how it is cached — `server-only`, `"use server"`, `"use cache"`, `client-only`.

## Four Markers, Four Jobs

They look similar and do entirely different things. Confusing the first two is a security defect, not a style problem.

| Marker                 | Form        | What it does                                                     |
| ---------------------- | ----------- | ---------------------------------------------------------------- |
| `import "server-only"` | An import   | **Fences**: makes the build fail if a client module imports this |
| `"use server"`         | A directive | **Exposes**: makes exports callable from the client as endpoints |
| `"use cache"`          | A directive | **Caches**: memoizes the return value under a generated key      |
| `import "client-only"` | An import   | **Fences**: makes the build fail if a server module imports this |

## `server-only` — the Fence

`server-only` is a package whose import throws at build time if the module ends up in a client bundle. It adds no runtime behaviour and exposes nothing. It is the correct marker for a module that reads secrets, queries a database, or holds anything that must never ship.

```ts
// src/article/article-repository.ts
import "server-only";

export async function getArticleBySlug(slug: string) {
  return db.article.findUnique({ where: { slug } });
}
```

**Guidelines:**

- MUST place `import "server-only"` at the top of every module that reads a secret, opens a database connection, or calls an internal service.
- SHOULD fence the module rather than trusting that no client file will ever import it; the fence turns a future mistake into a build failure.
- MUST NOT treat a `server-only` import as making a function safe to expose — it makes the module unreachable from the client, which is the opposite of exposure.

## `"use server"` — the Exposure

`"use server"` marks a **server function**: a function the client may call. The framework generates an endpoint for it and the client calls it over the network as a POST. Placed at the top of a file, it exposes **every export in that file**.

This is a public surface. Anyone who can reach the application can invoke it, with arguments of their choosing, in any order, regardless of what UI you built around it.

```ts
// src/article/article-actions.ts
"use server";

export async function publishArticle(id: string) {
  const session = await verifySession(); // authenticate
  await assertCanPublish(session, id); // authorize
  await articleRepository.publish(id); // then write
}
```

**Guidelines:**

- MUST treat every `"use server"` export as a public, unauthenticated endpoint until it authenticates and authorizes inside its own body.
- MUST use `"use server"` only on functions that genuinely need to be callable from the client — a mutation, or a client-initiated query that cannot be a route handler.
- SHOULD prefer an inline `"use server"` inside a single function over a file-level directive, so exposure is opted into per function rather than per file.
- MUST NOT combine `"use server"` with `"use cache"` in the same module: the first exposes a callable endpoint, the second memoizes a return value, and a cached endpoint serves one caller's result to another.

## The Read-Only Repository Anti-Pattern

The most damaging confusion between the two markers looks like this:

```ts
// ANTI-PATTERN — do not copy
"use server"; // intended as "this runs on the server"

export async function getArticleBySlug(slug: string) {
  "use cache";
  return db.article.findUnique({ where: { slug } });
}

export async function getAllArticlesIncludingDrafts() {
  return db.article.findMany(); // now a public endpoint
}
```

The author meant "this module is server code". What they wrote is "every export here is a POST endpoint any visitor may call" — including the one that returns unpublished drafts. The `"use cache"` in the same body compounds it: a cached function reachable as an endpoint hands a cached result to whoever calls next.

The fix is one line, and it inverts the meaning:

```ts
import "server-only"; // fences instead of exposing
```

**Guidelines:**

- MUST NOT put `"use server"` at the top of a module of read-only data-access functions; use `import "server-only"`.
- MUST audit every export of any file carrying a file-level `"use server"`, and confirm each one is intended to be publicly callable and performs its own authorization.
- SHOULD keep data-access modules (`server-only`) and mutation modules (`"use server"`) in separate files, so neither directive can accidentally cover the other's exports.

## `"use cache"` and Its Variants

`"use cache"` marks a route, component, or function as cacheable. It requires the `cacheComponents` option to be enabled. The full semantics — lifetimes, tags, keys, and invalidation — belong to the caching reference; what matters here is the marker's relationship to the other three.

- `"use cache"` — the standard directive; entries are shared and must not read request data.
- `"use cache: private"` — for scopes that genuinely need runtime request APIs, at the cost of a per-user entry.
- `"use cache: remote"` — lets the platform supply a dedicated cache handler; a network round trip, and usually a bill.

**Guidelines:**

- MUST enable `cacheComponents` before using any form of the directive; without it the directive does nothing recognizable.
- SHOULD reach for the standard directive first and treat the private and remote variants as deliberate escapes with a stated reason.
- MUST NOT read `cookies()`, `headers()`, or `searchParams` inside a standard `"use cache"` scope; pass the value in as an argument instead.

## `client-only` — the Mirror

`client-only` is the symmetric fence: importing it makes the build fail if a server module pulls the file in. It is the right marker for a module that touches `window`, `document`, or a browser-only API at module scope.

**Guidelines:**

- SHOULD fence a browser-only module with `import "client-only"` when it would otherwise fail confusingly during server rendering.
- MUST NOT use `client-only` as a substitute for `"use client"`; the fence declares where a module may not go, the directive declares where a boundary begins.

**Review checks:**

- A file-level `"use server"` on a module of read-only queries — **Critical**; every export becomes a public endpoint, including any that return unpublished or other users' data.
- A `"use server"` export with no authentication and authorization check in its body — **Critical**.
- `"use server"` and `"use cache"` in the same module or function — **Critical**; a cached public endpoint serves one caller's data to another.
- A module reading secrets or querying a database with no `server-only` fence — **Major**; it works until an import makes it not work.
- `cookies()` or `headers()` read inside a standard `"use cache"` scope — **Critical**; it throws, and where it does not it means a per-request value was baked into a shared entry.
