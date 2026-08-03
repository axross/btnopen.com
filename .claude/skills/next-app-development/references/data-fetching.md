# Data Fetching

Apply this reference when reading data for a route, structuring a data-access layer, removing a request waterfall, or reviewing where and how a change fetches.

## Pick One Approach

Three approaches are available, and a codebase that mixes them pays for all three:

1. **Server Components awaiting a fenced data-access layer.** The default. Data is read where it is rendered; nothing about the query reaches the client.
2. **Route handlers consumed by client-side fetching.** Necessary when the client must re-fetch on its own schedule, or when an external consumer needs the same endpoint.
3. **A server-state library over a REST or GraphQL backend.** The right shape when the application is a client to a service it does not own.

**Guidelines:**

- MUST default to reading data in Server Components through a fenced data-access layer.
- SHOULD adopt a second approach only for the cases the first cannot serve — client-driven refetching, polling, infinite scroll, or an endpoint with an external consumer.
- MUST NOT fetch the same resource through two approaches in one codebase; pick the owner and route both call sites through it.
- MUST follow the host repository's server-state conventions where it has them; how queries, keys, and invalidation are organized belongs to the project — or to a TanStack Query development capability where the project uses that library — not to this skill.

## The Data-Access Layer

Route modules should not contain queries. A fenced module per domain gives the query one home, one place to enforce authorization, and one place to shape what leaves the server.

```ts
// src/article/models/article-repository.ts
import "server-only";

export async function getPublishedArticle(
  slug: string,
): Promise<ArticleView | null> {
  const row = await db.article.findUnique({
    where: { slug, publishedAt: { not: null } },
  });
  return row ? toArticleView(row) : null;
}
```

`ArticleView` is a **transfer object**: the fields the UI needs, and nothing else. Returning the database row instead ships whatever the schema happens to contain — internal flags, moderation notes, the author's email — to anything that renders it.

**Guidelines:**

- MUST fence every data-access module with `import "server-only"`.
- MUST return a transfer object shaped for the caller, never a raw database row or ORM entity.
- MUST enforce the read's authorization inside the data-access function, not only at the call site; the function is what a future caller reuses.
- SHOULD keep the data-access layer free of framework imports so it stays testable without a request context.
- MUST NOT put `"use server"` on a data-access module — see the directives reference for why that turns every query into a public endpoint.

## Removing Waterfalls

Two sequential awaits that do not depend on each other cost the sum of their latencies for no reason.

```tsx
// Waterfall: the second query waits for the first.
const article = await getArticle(slug);
const related = await getRelatedArticles(slug);

// Parallel: both start immediately.
const [article, related] = await Promise.all([
  getArticle(slug),
  getRelatedArticles(slug),
]);
```

When the results are consumed by different parts of the tree, pass the **promise** down instead of awaiting it, and let each consumer suspend independently:

```tsx
export default async function Page(props: PageProps<"/articles/[slug]">) {
  const { slug } = await props.params;
  const commentsPromise = getComments(slug); // not awaited
  const article = await getArticle(slug);

  return (
    <>
      <ArticleBody article={article} />
      <Suspense fallback={<CommentsLoading />}>
        <Comments promise={commentsPromise} />
      </Suspense>
    </>
  );
}
```

The **preload pattern** starts a fetch before the component that needs it renders — useful when a parent knows what a child will ask for:

```ts
export function preloadArticle(slug: string) {
  void getArticle(slug); // deduplicated by cache(); result discarded here
}
```

**Guidelines:**

- MUST use `Promise.all` for independent awaits in the same scope rather than sequential `await` statements.
- SHOULD pass an unawaited promise as a prop to a Suspense-wrapped child when only that child needs the result, so it does not block its siblings.
- SHOULD call a preload function at the start of a route when a descendant will certainly need the data, rather than discovering the fetch several components deep.
- MUST NOT create a waterfall by awaiting a parent's data solely to derive an argument that was already available from `params`.

## Deduplicating a Shared Read

`generateMetadata` and the page component of the same route almost always need the same record. Wrapping the read in React's `cache()` makes the second call free within one request.

```ts
import { cache } from "react";

export const getArticle = cache(async (slug: string) => {
  return articleRepository.getPublishedArticle(slug);
});
```

**Guidelines:**

- MUST wrap a read consumed by both `generateMetadata` and its route component in React's `cache()`, or fetch it once and thread it through.
- SHOULD use `cache()` for any per-request read called from more than one component in a tree — a session lookup is the canonical case.
- MUST NOT expect `cache()` to deduplicate across requests; it is request-scoped memoization, not a cache with a lifetime.
- MUST NOT expect a `cache()` value to be visible inside a `"use cache"` scope; cached scopes run with their own isolated memoization, and reads from outside do not carry in.

## Fetching from the Client

Moving a read to the client moves only where it is _called_. The endpoint it calls is as public as any other, so every check the Server Component path performed still has to happen — on the server.

**Guidelines:**

- MUST validate and authorize on the server for every client-initiated read; a route handler is as public as a server function.
- MUST NOT rely on a client-side filter to keep data out of a response — filter in the query.
- SHOULD return the same transfer-object shape from a route handler that a Server Component would render, so the two paths cannot diverge.
- SHOULD prefer reading on the server and passing data down over fetching from the client, whenever the data is known at render time.

**Review checks:**

- A raw database row or ORM entity returned from a data-access function or passed to a client component — **Critical** when it carries fields the caller should not see, **Major** otherwise.
- A read of non-public data with no authorization check inside the data-access function — **Critical**.
- Sequential awaits of independent queries in one scope — **Major**; it is a user-visible latency regression.
- A data-access module with no `server-only` fence — **Major**.
- The same record fetched separately by `generateMetadata` and the page with no `cache()` wrapper — **Minor**; it doubles the query per request.
