# Client Components vs. Server Components

## Quick Decision Table

| Need | Server Component | Client Component |
|---|:---:|:---:|
| Fetch data from a database or API | ✅ | ❌ |
| Access server-only modules / secrets (API keys, tokens) | ✅ | ❌ |
| Cache results with `"use cache"` / `cacheLife()` | ✅ | ❌ |
| Read `cookies()`, `headers()`, or Next.js server APIs | ✅ | ❌ |
| Keep JS bundle small / improve FCP | ✅ | — |
| Use React state (`useState`, `useReducer`) | ❌ | ✅ |
| Use React lifecycle hooks (`useEffect`, `useLayoutEffect`) | ❌ | ✅ |
| Use browser-only APIs (`window`, `localStorage`, `navigator`) | ❌ | ✅ |
| Attach DOM event handlers (`onClick`, `onChange`, etc.) | ❌ | ✅ |
| Use context (`useContext`) | ❌ | ✅ |
| Render only side-effects (analytics, tracking) | — | ✅ |

## Use Server Components When

- The component **fetches data** from the database (Payload CMS), an external API, or the filesystem.
- The component uses **server-only secrets** such as API keys or auth tokens that must not reach the browser.
- The component can be **cached** — using `"use cache"` with `cacheLife()` to reduce repeated work.
- The component is purely **presentational** and does not require interactivity or browser APIs.
- You want to **stream** progressively renderable HTML to the client (improves First Contentful Paint).

See [server-components.md](./server-components.md) for implementation details.

## Use Client Components When

- The component needs **state** or **lifecycle logic** (e.g., `useState`, `useEffect`, `useReducer`).
- The component handles **user interaction** through DOM event handlers (e.g., `onClick`, `onChange`, `onSubmit`).
- The component reads from **browser-only APIs** such as `window`, `localStorage`, `navigator.geolocation`, or `document`.
- The component uses a **custom hook** that itself relies on any of the above.
- The component performs a **client-side side effect** such as reporting analytics or page-view tracking.

See [client-components.md](./client-components.md) for implementation details.

## Splitting a Component at the Boundary

- MUST split a component at the boundary when it needs both server-side data and client-side interactivity.

Example:

```tsx
// blog-post-page.tsx (Server Component)
import { LikeButton } from "./_components/like-button";
import { getPost } from "@/repositories/posts";

export default async function BlogPostPage({ params }: PageProps) {
  const post = await getPost(params.slug);

  return (
    <article>
      <h1>{post.title}</h1>

      <LikeButton initialCount={post.likeCount} />
    </article>
  );
}
```

```tsx
// _components/like-button.tsx (Client Component)
"use client";

import { type ComponentProps, useCallback, useState } from "react";

export function LikeButton({ initialCount }: ComponentProps<"button"> & {
  initialCount: number;
}): JSX.Element {
  const [count, setCount] = useState(initialCount);
  const onButtonClick = useCallback(() => {
    setCount((n) => n + 1);
  }, []);

  return <button onClick={onButtonClick}>{count} Likes</button>;
}
```

### Passing Promises as Props

- SHOULD NOT await the promise in the parent Server Component.
- Instead, SHOULD pass `Promise<T>` props to Server Components instead of awaiting them at the call site:
  - When multiple async operations can be parallelized.
  - When the Server Component has caching enabled (with `"use cache"`).
  - When the Server Component is wrapped in a Suspense boundary.
- The receiving component MUST `await` the promise.
- Promise props MUST NOT be passed to Client Components.
- Promise props SHOULD be named normally, without any special suffix.
- Promise props MUST be aliased at the receiving component with `Promise` suffix (e.g. `post` → `postPromise`).

Example:

```tsx
const blogPost = getBlogPost(params.slug);

return <BlogPostHeader blogPost={blogPost} />;
```

```tsx
export async function BlogPostHeader({
  blogPost: blogPostPromise,
}: {
  blogPost: Promise<Post>;
}): Promise<JSX.Element> {
  const blogPost = await blogPostPromise;

  return <header>...</header>;
}
```

## Interleaving Rules

- A **Server Component MAY render Client Components**.
- A **Client Component MUST NOT render Server Components**.
- However, a Client Component MAY accept Server Components via props such as `children` or slot props.
- MUST NOT import a Server Component (one that uses `async`/`await` or server-only modules) from within a `"use client"` file.

```tsx
// ✅ OK — Server Component wraps a Client Component
export default function Layout() {
  return (
    <ClientSidebar>
      <ServerOnlyPage /> {/* passed as children, not imported inside ClientSidebar */}
    </ClientSidebar>
  );
}
```

## Third-Party Components

Third-party components that use client-only APIs (hooks, event handlers) MUST be wrapped in a Client Component before being used in an RSC tree.

```tsx
// _components/carousel-wrapper.tsx
"use client";

export { Carousel } from "some-ui-library"; // re-export from a client boundary
```

## Common Mistakes to Avoid

| Mistake | Why it's wrong |
|---|---|
| Putting `"use client"` on every component | Defeats the purpose of RSC; increases bundle size unnecessarily |
| Fetching data inside a Client Component directly | Data-fetching logic and secrets can leak to the browser |
| Importing a Server Component from a Client file | Breaks the RSC model; Next.js will throw an error |
| Not passing `data-testid` through the boundary | E2E tests won't be able to target the element |
| Using `async/await` in a Client Component | Client Components are not `async`; use `useEffect` with `useState` instead |
