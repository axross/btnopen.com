# React Server Components

## Suspense Boundary

- SHOULD wrap async Server Components in `<Suspense>` at the call site.
- SHOULD provide a meaningful `fallback` for `<Suspense>` when a loading state is needed.
- MAY use `<Suspense>` without a `fallback` when it is supposed to be a blocking component (e.g. a component that fetches data that is semantically required to render the page).
- MAY use `<Suspense>` without a `fallback` for non-visual side-effect components (e.g., JSON-LD injectors, analytics).

Example (page with Suspense boundaries):

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

- SHOULD split components that have a meaningful loading state into two separate files:
  - `[name]/loaded.tsx` — the data-fetching Server Component.
  - `[name]/loading.tsx` — the skeleton/placeholder Client or Server Component.
- The parent component (`[name].tsx`) SHOULD act as the orchestrator, wrapping `loaded` in `<Suspense fallback={<Loading />}>`.

Example (orchestrator component):

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

Example (loaded component):

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

Example (loading component):

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

## Caching with `"use cache"` and `cacheLife()`

- SHOULD use `"use cache"` with `cacheLife()` when the component performs work that is safe to cache.
- MUST use `"use cache"` as a function-body directive (not a file-level directive) within async Server Components that fetch stable data.
- MUST call `cacheLife()` immediately after `"use cache"` with an appropriate lifetime: `"seconds"`, `"minutes"`, `"hours"`, `"days"`, or `"weeks"`.

Example:

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
