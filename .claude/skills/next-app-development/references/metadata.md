# Metadata

Apply this reference when setting page titles and descriptions, adding social-sharing tags, generating sitemaps or robots files, or reviewing a change to a route's head content.

## Static Versus Generated

A route exports either a static `metadata` object or an async `generateMetadata` function. Static is cheaper and should be the default; the generated form exists for metadata that depends on the route's data.

```tsx
// Static — no data dependency
export const metadata: Metadata = { title: "Pricing" };

// Generated — depends on params
export async function generateMetadata(
  props: PageProps<"/articles/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const article = await getArticle(slug); // wrapped in cache() — see data fetching
  if (!article) return { title: "Not found" };
  return { title: article.title, description: article.summary };
}
```

**Guidelines:**

- SHOULD export a static `metadata` object whenever the values do not depend on route data.
- MUST await `params` inside [`generateMetadata`](https://nextjs.org/docs/app/api-reference/functions/generate-metadata), as everywhere else in v16.
- MUST wrap a read shared by `generateMetadata` and the page component in React's `cache()`, or the record is fetched twice per request.
- MUST NOT throw from `generateMetadata` when the record is missing; return fallback metadata and let the page call `notFound()`.
- MUST NOT read `cookies()` or `headers()` in `generateMetadata` unless the route is already dynamic; it opts the route out of static rendering.

## The Fields That Matter

Most metadata fields are optional and inconsequential. A handful are neither: they decide whether a shared link renders a card, whether a private page shows up in a search index, and whether duplicate URLs split their own ranking.

**Guidelines:**

- MUST set `metadataBase` in the root layout when the application emits absolute URLs; without it, Open Graph and canonical URLs resolve relative and break when shared.
- SHOULD define a title template in the root layout (`title: { template: '%s · Acme', default: 'Acme' }`) so child routes supply only their own segment.
- MUST set `robots` deliberately on routes that should not be indexed — staging, previews, user-specific pages, search-result pages — rather than relying on a `robots.txt` disallow alone.
- SHOULD provide `openGraph` with a title, description, and image on any route intended to be shared, and `twitter` where its card differs.
- SHOULD set `alternates.canonical` on routes reachable by more than one URL.

## Viewport Is a Separate Export

`viewport` and `themeColor` are no longer part of `metadata`; they are their own export. Leaving them inside a metadata object means they are silently dropped.

```tsx
export const viewport: Viewport = { themeColor: "#111", width: "device-width" };
```

**Guidelines:**

- MUST export `viewport` separately rather than nesting it under `metadata`.
- SHOULD declare `themeColor` per colour scheme where the application supports dark mode.

## File Conventions

The router picks these up from a route directory without any export:

| File                                    | Produces           |
| --------------------------------------- | ------------------ |
| `favicon.ico`, `icon.*`, `apple-icon.*` | Icon links         |
| `opengraph-image.*`, `twitter-image.*`  | Social card images |
| `sitemap.ts` / `sitemap.xml`            | A sitemap          |
| `robots.ts` / `robots.txt`              | A robots file      |
| `manifest.ts` / `manifest.json`         | A web app manifest |

The code-generated variants (`opengraph-image.tsx`, `icon.tsx`) receive `params` and, when paired with `generateImageMetadata`, an `id` — **both promises in v16**.

**Guidelines:**

- SHOULD use the file conventions rather than hand-written `<link>` and `<meta>` tags; the router handles hashing, sizing, and cache headers.
- MUST await `params` and `id` in a generated image or sitemap function; both became promises in v16.
- MUST provide `alt` text alongside a generated Open Graph image.
- SHOULD colocate a route-specific social image in that route's directory, and a default one at the root.

## Sitemaps and Robots

A sitemap generated from a different source than the routes drifts, and a drifted sitemap is worse than none: it advertises URLs that 404, which crawlers treat as a quality signal about the whole site.

**Guidelines:**

- SHOULD generate `sitemap.ts` from the same source of truth the routes render from, so it cannot list URLs that 404.
- MUST use `generateSitemaps` to shard when the URL count exceeds the 50,000-entry limit, and await the `id` it passes.
- MUST NOT list non-canonical, parameterized, or noindex URLs in a sitemap.
- SHOULD emit a `robots.ts` that references the sitemap URL absolutely.

## Structured Data

JSON-LD is data written into a `<script>` tag, which makes it an injection sink like any other — a title containing `</script>` closes the block and everything after it becomes markup.

**Guidelines:**

- SHOULD embed JSON-LD as a `<script type="application/ld+json">` rendered by the Server Component that owns the entity, so it stays beside the data it describes.
- MUST escape the serialized JSON before injecting it, since it is written into a script tag — the general injection rules belong to an application security capability and apply here.
- MUST NOT describe content in structured data that the page does not actually render.

**Review checks:**

- A route emitting Open Graph or canonical URLs with no `metadataBase` set — **Major**; shared links resolve to relative URLs.
- `generateMetadata` and the page fetching the same record with no `cache()` wrapper — **Minor**; the query doubles per request.
- `viewport` or `themeColor` nested inside `metadata` — **Minor**; silently dropped.
- A generated image or sitemap function reading `params` or `id` without `await` — **Critical**; both are promises in v16.
- A user-specific, preview, or staging route with no `robots` noindex directive — **Major**.
- Unescaped data interpolated into a JSON-LD script tag — **Critical**.
