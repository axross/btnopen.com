# Component Conventions

## File Naming

- MUST use kebab-case for file names (e.g., `blog-post-header.tsx`).
- CSS Module files MUST share the same base name as their component file (e.g., `blog-post-header.module.css`).

## TypeScript Requirements

- MUST be written in TypeScript.
- MUST NOT use the `any` type.
- MUST use `interface` over `type` for props that are only object types (no intersection or union).

### Component Type Declarations

- MUST declare the props type explicitly.
- SHOULD use `ComponentProps<T>` from React as the base type where `T` is the root rendered element type.
  - If the component renders a `<div>` at its root, use `ComponentProps<"div">`.
  - If the component renders a `<ul>`, use `ComponentProps<"ul">`.
  - If the component wraps another component (e.g. `Media`), use `ComponentProps<typeof Media>`.
- SHOULD merge custom props with `ComponentProps<T>` using `&`.

Example:

```tsx
import type { ComponentProps, JSX } from "react";

function BlogPostHeader({
  blogPost,
  className,
  ...props
}: ComponentProps<"header"> & {
  blogPost: Promise<BlogPostDetail | null>;
}): JSX.Element {
  // ...
}
```

## Return Types

- MUST declare the return type of the component explicitly.
- Client Components MUST return `JSX.Element` or `JSX.Element | null`.
- Server Components MUST return `Promise<JSX.Element>` or `Promise<JSX.Element | null>`.
- Side-effect-only Client Components (e.g., analytics trackers) MAY declare return type as `null`.

Server Component Example:

```tsx
async function BlogPostHeader({
  blogPost,
  className,
  ...props
}: ComponentProps<"header"> & {
  blogPost: Promise<BlogPostDetail | null>;
}): Promise<JSX.Element> {
  // ...
}
```

Side-effect-only Client Component Example:

```tsx
"use client";

function PageViewTracking(): null {
  useEffect(() => {
    // ...
  }, [/* ... */]);

  return null;
}
```

## Exports

- MUST use named exports for all components.
- Page-level components (Next.js page files) SHALL use `export default`.
