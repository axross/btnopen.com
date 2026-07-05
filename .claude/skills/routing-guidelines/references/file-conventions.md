# File Conventions

Route files should keep page rendering, route props, not-found handling, metadata images, and mutation handlers in predictable places.

**Example:**

```typescript
export interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ draft?: "true"; preview?: "true" }>;
}
```

**Guidelines:**

- SHOULD define a `page-props.ts` file co-located with each `page.tsx` to export a `PageProps` interface.
- MUST type `params` and `searchParams` as `Promise<...>` to comply with Next.js 15+ async APIs.
- MAY co-locate a `not-found.tsx` file with any route segment that requires a custom 404 UI.
- SHOULD co-locate OG image files such as `thumbnail.png` with the route segment they belong to, using Next.js file-based metadata conventions.
- MUST NOT place route handlers (`route.ts`) in the same directory as a `page.tsx`.
- SHOULD place route handlers in a dedicated sub-directory named after the resource they manage, such as `posts/[slug]/caches/route.ts` rather than `posts/[slug]/route.ts`.
