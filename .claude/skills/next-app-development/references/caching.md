# Caching

Apply this reference when adding a `"use cache"` scope, choosing a lifetime or a tag, invalidating after a write, or reviewing a change that caches or should have.

## Where the Directive Goes

`"use cache"` applies at three levels, and the level decides what the cache entry contains:

```tsx
// File level — every export in the file is cached. All exports must be async.
"use cache";

// Component level — the component's rendered output is cached, keyed by its props.
export async function ArticleCard({ id }: { id: string }) {
  "use cache";
  // ...
}

// Function level — the return value is cached, keyed by the arguments.
export async function getArticle(slug: string) {
  "use cache";
  return db.article.findUnique({ where: { slug } });
}
```

Caching a whole route means putting the directive at the top of **both** `layout.tsx` and `page.tsx`; each segment is a separate entry point and is cached independently.

All of this requires `cacheComponents: true`.

**Guidelines:**

- MUST enable `cacheComponents` before adding any `"use cache"` scope.
- SHOULD cache at the smallest scope that captures the expensive work — a function or a component, rather than a whole route.
- MUST make every export async when the directive is at file level.
- MUST NOT put `"use cache"` in the same module or function as `"use server"`; a cached public endpoint serves one caller's result to the next.

## Declare a Lifetime

An undeclared scope inherits the `default` profile: five minutes stale on the client, fifteen minutes server-side revalidation, and no expiry. That is a real policy, and it is almost never the one the data wants — but because it is silent, nobody notices it was chosen by omission.

```ts
import { cacheLife } from "next/cache";

export async function getArticle(slug: string) {
  "use cache";
  cacheLife("hours");
  // ...
}
```

**Guidelines:**

- MUST call `cacheLife()` explicitly in every `"use cache"` scope this project adds, rather than inheriting the default profile. This is a house rule on top of the framework's default, and it exists so the lifetime is a visible decision in the diff.
- SHOULD use a named built-in profile where one fits, and define a named custom profile in `next.config.ts` rather than repeating an inline object.
- SHOULD match the profile to how stale the data may acceptably be, not to how expensive it is to produce.
- MUST import `cacheLife` and `cacheTag` from `next/cache` without the `unstable_` prefix; both are stable as of v16.

## No Runtime Data Inside a Cached Scope

A cached entry is shared. `cookies()`, `headers()`, and `searchParams` are per-request. Reading one inside a standard `"use cache"` scope fails immediately with a dedicated error — and where it does not fail, it means a per-user value was baked into an entry other users will receive.

The fix is always the same: read outside, pass in as an argument.

```tsx
// Wrong
async function Greeting() {
  "use cache";
  const c = await cookies(); // throws
}

// Right
async function Page() {
  const c = await cookies();
  return <Greeting theme={c.get("theme")?.value ?? "light"} />;
}

async function Greeting({ theme }: { theme: string }) {
  "use cache";
  cacheLife("days");
  // ...
}
```

A related failure is quieter: passing a **promise** of runtime data into a cached scope. That does not throw — it hangs, and the build times out after fifty seconds with a message about request-specific arguments. Await the value first, pass the value.

**Guidelines:**

- MUST NOT call `cookies()`, `headers()`, or read `searchParams` inside a standard `"use cache"` scope.
- MUST pass resolved values, not promises of runtime data, into a cached scope.
- MAY read `draftMode().isEnabled` inside a cached scope; it is the one request API permitted there, and while draft mode is on, cached scopes re-execute per request and are not stored.
- SHOULD use `"use cache: private"` only when the scope genuinely cannot be refactored to take arguments, and record why; it produces per-user entries.
- SHOULD use `"use cache: remote"` only when in-memory caching is demonstrably insufficient, accepting the network round trip and the platform cost.

## Cache Keys and Cardinality

An entry's key is built from the build id, a hash of the function's identity, and its serialized arguments — **including variables captured from an enclosing scope**, which are bound as implicit arguments.

That last part is where cardinality explodes. A cached helper defined inside a component closes over that component's props, so every distinct prop combination produces its own entry, even if the helper never used them.

**Guidelines:**

- MUST define cached functions at module scope rather than inside a component, so their key is their declared arguments and nothing else.
- MUST keep arguments to a cached scope narrow — pass the id, not the whole request-derived object.
- MUST NOT pass a value with per-user or per-request cardinality (a session id, a timestamp, a nonce) into a cached scope's key; it produces a cache that never hits.
- MUST keep arguments serializable: primitives, plain objects, arrays, dates, maps, sets, typed arrays. Class instances, functions, symbols, and `URL` instances are not.
- MAY pass non-serializable values through as `children` or slot props, as long as the cached body never reads them.

## Tagging and Invalidating

`cacheTag()` labels an entry so it can be invalidated by name later. Three APIs then act on tags, and they are not interchangeable:

| API                           | Semantics                                                  | Callable from                    |
| ----------------------------- | ---------------------------------------------------------- | -------------------------------- |
| `revalidateTag(tag, profile)` | Marks stale; serves stale while revalidating in background | Server functions, route handlers |
| `updateTag(tag)`              | Expires and refreshes immediately — read-your-writes       | Server functions only            |
| `refresh()`                   | Refreshes the client router                                | Server functions only            |

`revalidateTag` **requires** a second argument in v16 naming a cache-life profile; `'max'` is the recommended value. The single-argument form is deprecated and produces a TypeScript error.

**Guidelines:**

- MUST pass the profile argument to `revalidateTag`; the one-argument form is deprecated.
- MUST use `updateTag` when the user who performed the write must immediately see their own change; `revalidateTag` shows them stale data on the next read.
- SHOULD use `revalidateTag(tag, 'max')` for content where a delay is acceptable — published articles, catalogues, documentation.
- MAY pass `{ expire: 0 }` to `revalidateTag` from a route handler when an external system requires immediate expiry and `updateTag` is unavailable there.
- SHOULD tag entries by the entity they contain (`article-${id}`), so a write invalidates exactly what it changed.
- MUST keep a tag within 256 characters, and treat it as case-sensitive.

## Path-Based Invalidation

`revalidatePath` invalidates by route path rather than by tag. It is blunter — it invalidates the page or layout at that path — and it takes a value that must never come from the caller.

**Guidelines:**

- SHOULD prefer tag-based invalidation; a tag names the data, a path names a page that happens to show it.
- MUST NOT build a `revalidatePath` argument from user input; a caller-controlled path lets anyone invalidate arbitrary routes, which is a cache-eviction denial-of-service surface.
- MUST pass the correct type when invalidating a layout path rather than a page path; the wrong one silently invalidates nothing.

## Wire Invalidation to the Write

A cache with no invalidation is a bug with a delay on it. The invalidation belongs in the same function as the write, not in a separate cleanup path someone must remember to call.

**Guidelines:**

- MUST invalidate the tags a mutation affects inside the server function that performs it, before it returns.
- MUST invalidate every entry a write affects, not only the most obvious one — a published article usually invalidates the article, its list, and its feed.
- SHOULD colocate the tag name with the read that sets it, so the write and the read cannot drift apart.

## Limitations

The directive does not mean the same thing everywhere it runs. A cache that hits reliably in local development can miss on every request in production, because the storage behind it is per-instance memory and the instance does not survive.

**Guidelines:**

- MUST NOT rely on runtime cache persistence in a serverless deployment; entries are in-memory per instance and typically do not survive between requests. Build-time caching still works normally.
- MUST NOT use `"use cache"` with a static export; it is unsupported there.
- SHOULD configure a cache handler when self-hosting and needing entries to outlive a process, and bound memory with the max-memory option.

**Review checks:**

- A `"use cache"` scope with no `cacheLife()` call — **Major**; the lifetime was chosen by omission.
- `cookies()`, `headers()`, or `searchParams` read inside a standard `"use cache"` scope — **Critical**; it either throws or bakes one user's data into a shared entry.
- `"use cache"` and `"use server"` in the same module or function — **Critical**.
- A mutation that writes data with no invalidation of the tags covering it — **Major**; readers keep serving stale content.
- `revalidateTag` called with one argument — **Critical**; it is deprecated and type-errors, failing the build gate.
- `revalidatePath` called with a value derived from user input — **Critical**.
- A cached function defined inside a component, capturing its props — **Major**; cardinality explodes and the cache stops hitting.
- `updateTag` expected where `revalidateTag` was used after a user's own write — **Major**; the user sees stale data immediately after acting.
