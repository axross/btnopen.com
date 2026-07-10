# React Server Components

## Suspense Boundary

Suspense Boundary describes the preferred project default: wrap async Server Components in `<Suspense>` at the call site.

**Guidelines:**

- SHOULD wrap async Server Components in `<Suspense>` at the call site.
- SHOULD provide a meaningful `fallback` for `<Suspense>` when a loading state is needed.
- MAY use `<Suspense>` without a `fallback` when it is supposed to be a blocking component (e.g. a component that fetches data that is semantically required to render the page).
- MAY use `<Suspense>` without a `fallback` for non-visual side-effect components (e.g., JSON-LD injectors, analytics).

**Example:**

```tsx
export default async function BlogPostPage({ params, searchParams }: PageProps) {
  // ...
  return (
    <>
      <article>
        <Suspense>
          <BlogPostHeader blogPost={blogPost} />
        </Suspense>

        <main>
          <Suspense>
            <BlogPostContent slug={slug} draft={draft} />
          </Suspense>
        </main>
      </article>

      {/* Side-effect, no fallback needed */}
      <Suspense>
        <BlogPostingJsonLd blogPost={blogPost} draft={draft} />
      </Suspense>
    </>
  );
}
```

## Loading / Loaded Split Pattern

Loading / Loaded Split Pattern describes the preferred project default: split components that have a meaningful loading state into two separate files:

**Example:**

```tsx
import { Suspense } from "react";
import { WebembedLoaded } from "./webembed/loaded";
import { WebembedLoading } from "./webembed/loading";

export async function Webembed({
  url,
  className,
  "data-testid": dataTestId,
  ...props
}: ComponentProps<"div"> & {
  url: string;
  "data-testid": string;
}): Promise<JSX.Element> {
  return (
    <Suspense
      fallback={
        <WebembedLoading
          className={className}
          data-testid={dataTestId ? `${dataTestId}-loading` : undefined}
          {...props}
        />
      }
    >
      <WebembedLoaded
        url={url}
        className={className}
        data-testid={dataTestId}
        {...props}
      />
    </Suspense>
  );
}
```

**Example:**

```tsx
import { cacheLife } from "next/cache";
import type { ComponentProps, JSX } from "react";

export async function WebembedLoaded({
  url,
  ...props
}: ComponentProps<"div"> & { url: string }): Promise<JSX.Element> {
  const webembed = await getWebembed({ url });

  return (
    <div {...props}>
      {/* ... render webembed ... */}
    </div>
  );
}
```

**Example:**

```tsx
import type { ComponentProps, JSX } from "react";

export function WebembedLoading({ ...props }: ComponentProps<"div">): JSX.Element {
  return (
    <div {...props}>
      {/* ... render skeleton ... */}
    </div>
  );
}
```

**Guidelines:**

- SHOULD split components that have a meaningful loading state into two separate files:
  - `[name]/loaded.tsx` — the data-fetching Server Component.
  - `[name]/loading.tsx` — the skeleton/placeholder Client or Server Component.

- SHOULD make the parent component (`[name].tsx`) act as the orchestrator, wrapping `loaded` in `<Suspense fallback={<Loading />}>`.
- MUST keep the `loaded` and `loading` siblings on the same CSS-Module selectors and tokens across their paired `loaded.module.css` / `loading.module.css` files so adding a cell on one side does not silently diverge from the other. The design rationale (no layout shift between skeleton and real content) lives in the project's UI design principles (loading-and-empty-states rules).
- SHOULD make the `loading` sibling accept the same `className` passthrough and a `data-testid` suffixed with `-loading` (see [testable-components.md](./testable-components.md)) so parents swap only the component, not the surrounding markup.

## Caching with `"use cache"` and `cacheLife()`

Caching with `"use cache"` and `cacheLife()` describes the preferred project default: use `"use cache"` with `cacheLife()` when the component performs work that is safe to cache.

**Guidelines:**

- SHOULD use `"use cache"` with `cacheLife()` when the component performs work that is safe to cache.
- MUST use `"use cache"` as a function-body directive (not a file-level directive) within async Server Components that fetch stable data.
- MUST call `cacheLife()` immediately after `"use cache"` with an appropriate lifetime: `"seconds"`, `"minutes"`, `"hours"`, `"days"`, or `"weeks"`.

**Example:**

```tsx
import { cacheLife } from "next/cache";
import type { ComponentProps, JSX } from "react";

async function Media({
  src,
  alt,
  className,
}: ComponentProps<"img">): Promise<JSX.Element | null> {
  "use cache";

  cacheLife("hours");

  // ... fetch and render
}
```
