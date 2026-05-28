# Client Components vs. Server Components

## Quick Decision Table

Quick Decision Table maps common component needs to the default Server Component or Client Component choice.

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

**Guidelines:**

- SHOULD use this table as the first pass when choosing a component boundary.
- MUST defer to the detailed sections below when a component combines server-only and browser-only needs.

## Use Server Components When

Server Components are the default when work can stay on the server: data fetching, secret access, caching, streaming, and presentational markup do not need browser JavaScript.

- The component **fetches data** from the database (Payload CMS), an external API, or the filesystem.
- The component uses **server-only secrets** such as API keys or auth tokens that must not reach the browser.
- The component can be **cached** — using `"use cache"` with `cacheLife()` to reduce repeated work.
- The component is purely **presentational** and does not require interactivity or browser APIs.
- You want to **stream** progressively renderable HTML to the client (improves First Contentful Paint).

See [server-components.md](./server-components.md) for implementation details.

**Guidelines:**

- MUST choose a Server Component when the component needs server-only data, secrets, cache directives, or Next.js server APIs and does not require browser APIs.
- SHOULD keep presentational components on the server unless interaction, lifecycle hooks, or browser-only APIs require a client boundary.

## Use Client Components When

Client Components are the exception used for browser-only behavior. The `"use client"` boundary should sit at the smallest component that needs state, effects, event handlers, browser APIs, or client-side side effects.

- The component needs **state** or **lifecycle logic** (e.g., `useState`, `useEffect`, `useReducer`).
- The component handles **user interaction** through DOM event handlers (e.g., `onClick`, `onChange`, `onSubmit`).
- The component reads from **browser-only APIs** such as `window`, `localStorage`, `navigator.geolocation`, or `document`.
- The component uses a **custom hook** that itself relies on any of the above.
- The component performs a **client-side side effect** such as reporting analytics or page-view tracking.

See [client-components.md](./client-components.md) for implementation details.

**Guidelines:**

- MUST choose a Client Component when the component needs React state, lifecycle hooks, DOM event handlers, browser-only APIs, or client-side side effects.
- MUST keep the client boundary as small as the behavior allows.

## Splitting a Component at the Boundary

Boundary splits keep server-side data loading in the page or server child while isolating browser state in a small `"use client"` leaf.

**Example:**

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

**Guidelines:**

- MUST keep server-side data loading in a Server Component when only a small leaf needs browser interactivity.
- MUST move browser state, lifecycle hooks, and event handlers into the smallest practical Client Component.
- MUST pass only serializable data props from Server Components into Client Components unless the prop is a Server Component slot covered by the interleaving rules below.

### Passing Promises as Props

**Example:**

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

**Guidelines:**

- MUST split a component at the boundary when it needs both server-side data and client-side interactivity.
- SHOULD NOT await the promise in the parent Server Component.
- SHOULD pass `Promise<T>` props to Server Components instead of awaiting them at the call site:
  - When multiple async operations can be parallelized.
  - When the Server Component has caching enabled (with `"use cache"`).
  - When the Server Component is wrapped in a Suspense boundary.

- MUST ensure the receiving component awaits the promise.
- MUST NOT pass Promise props to Client Components.
- SHOULD name Promise props normally, without any special suffix.
- MUST alias Promise props at the receiving component with a `Promise` suffix (e.g. `post` → `postPromise`).

## Interleaving Rules

Interleaving Rules captures the project-specific context for the checklist below: A **Server Component MAY render Client Components**.

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

**Guidelines:**

- MAY allow a **Server Component to render Client Components**.
- MUST NOT render Server Components from a Client Component.
- MAY allow a Client Component to accept Server Components via props such as `children` or slot props.
- MUST NOT import a Server Component (one that uses `async`/`await` or server-only modules) from within a `"use client"` file.

## Third-Party Components

Third-party components that use client-only APIs (hooks, event handlers) need a client boundary before they enter an RSC tree.

```tsx
// _components/carousel-wrapper.tsx
"use client";

export { Carousel } from "some-ui-library"; // re-export from a client boundary
```

**Guidelines:**

- MUST wrap third-party components that use client-only APIs in a Client Component before using them in an RSC tree.

## Common Mistakes to Avoid

| Mistake | Why it's wrong |
|---|---|
| Putting `"use client"` on every component | Defeats the purpose of RSC; increases bundle size unnecessarily |
| Fetching data inside a Client Component directly | Data-fetching logic and secrets can leak to the browser |
| Importing a Server Component from a Client file | Breaks the RSC model; Next.js will throw an error |
| Not passing `data-testid` through the boundary | E2E tests won't be able to target the element |
| Using `async/await` in a Client Component | Client Components are not `async`; use `useEffect` with `useState` instead |

**Guidelines:**

- MUST treat these mistakes as implementation or review findings when they appear in changed React code.
- SHOULD fix boundary mistakes by moving the boundary to the smallest component that actually needs client behavior.
