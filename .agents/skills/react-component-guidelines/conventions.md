# Component Conventions

## File Naming

File Naming sets the required project default: use kebab-case for file names (e.g., `blog-post-header.tsx`).

**Guidelines:**

- MUST use kebab-case for file names (e.g., `blog-post-header.tsx`).
- MUST name CSS Module files with the same base name as their component file (e.g., `blog-post-header.module.css`).

## TypeScript Requirements

TypeScript Requirements sets the required project default: be written in TypeScript.

**Guidelines:**

- MUST be written in TypeScript.
- MUST NOT use the `any` type.
- MUST use `interface` over `type` for props that are only object types (no intersection or union).

### Component Type Declarations

Component Type Declarations sets the required project default: declare the props type explicitly.

**Guidelines:**

- MUST declare the props type explicitly.
- SHOULD use `ComponentProps<T>` from React as the base type where `T` is the root rendered element type.
  - If the component renders a `<div>` at its root, use `ComponentProps<"div">`.
  - If the component renders a `<ul>`, use `ComponentProps<"ul">`.
  - If the component wraps another component (e.g. `Media`), use `ComponentProps<typeof Media>`.
- SHOULD merge custom props with `ComponentProps<T>` using `&`.

**Example:**

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

Return Types sets the required project default: declare the return type of the component explicitly.

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

**Guidelines:**

- MUST declare the return type of the component explicitly.
- MUST type Client Components as returning `JSX.Element` or `JSX.Element | null`.
- MUST type Server Components as returning `Promise<JSX.Element>` or `Promise<JSX.Element | null>`.
- MAY allow side-effect-only Client Components (e.g., analytics trackers) to declare return type as `null`.

## Exports

Exports sets the required project default: use named exports for all components. Next.js page-level components are the explicit exception and use `export default`.

**Guidelines:**

- MUST use named exports for all components.
- MUST use `export default` only for Next.js page-level components.
