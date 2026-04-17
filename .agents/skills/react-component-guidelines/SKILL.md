---
name: react-component-guidelines
description: Use this skill when writing, reviewing, or refactoring any React component in this project — kebab-case file naming, TypeScript prop types with `ComponentProps<T>`, explicit `JSX.Element` / `Promise<JSX.Element>` return types, deciding Server vs Client components, `"use client"` placement, the loading/loaded split with `<Suspense>`, `"use cache"` + `cacheLife()` caching, passing `Promise<T>` props (never to Client Components), CSS Modules under `@layer components` with `clsx` class merging and variables, style-isolation rules (no position/margin/width/height on root), and the `data-testid` nesting / `-loading` suffix conventions that E2E tests depend on. Use even when the user only says "component", "use client", "RSC", "Suspense", "data-testid", "styling", or "clsx".
user-invocable: false
---

# React Component Guidelines

Apply these rules when writing, reviewing, or refactoring React components in this project.

## Component Conventions

See [React Component Conventions](./conventions.md) for:

- Overall React component guidelines
- Props and return type declarations
- Naming and file/module organization

## React Client Components vs Server Components

See [React Client Components vs Server Components](./client-vs-server-components.md) for:

- When to determine whether to use React Client Components or Server Components
- How to split components into Client and Server Components

## CSS and Styling

See [React Component Styling](./styling.md) for:

- CSS Modules usage
- CSS variables and theme tokens
- CSS layers
- Class name merging patterns

## Testable Components

See [Testable Components](./testable-components.md) for:

- `data-testid` attribute conventions
- `data-testid` nesting patterns and how E2E and unit tests traverse the component tree
- Loading-state ID conventions (`-loading` suffix)
