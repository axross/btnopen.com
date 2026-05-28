---
name: react-component-guidelines
description: Use this skill when writing, reviewing, or refactoring React components. Covers kebab-case files, prop typing, explicit JSX return types, Server vs Client component boundaries, `"use client"`, Suspense loading/loaded splits, `"use cache"`/`cacheLife()`, `Promise<T>` props, CSS Modules, `clsx`, style isolation, modern CSS properties, and `data-testid` conventions. Use for "component", "use client", "RSC", "Suspense", "styling", "container query", "oklch", "@scope", "animation-timeline", or "data-testid".
---

# React Component Guidelines

Apply these rules when writing, reviewing, or refactoring React components in this project.

## Component Conventions

See [React Component Conventions](./conventions.md) for:

- Overall React component guidelines
- Props and return type declarations
- Naming and file/module organization

**Guidelines:**

- SHOULD read the linked reference when work touches this topic.

## React Client Components vs Server Components

See [React Client Components vs Server Components](./client-vs-server-components.md) for:

- When to determine whether to use React Client Components or Server Components
- How to split components into Client and Server Components

See [React Client Components](./client-components.md) when implementing a client boundary:

- `"use client"` directive placement
- Side-effect-only Client Component return types

See [React Server Components](./server-components.md) when implementing server-side rendering or async loading:

- Suspense boundary placement
- Loading / loaded split pattern
- `"use cache"` and `cacheLife()` usage

**Guidelines:**

- SHOULD read the linked reference when work touches this topic.

## CSS and Styling

See [React Component Styling](./styling.md) for:

- CSS Modules usage
- CSS variables and theme tokens
- CSS layers
- Class name merging patterns

**Guidelines:**

- SHOULD read the linked reference when work touches this topic.

## CSS Property Usage

See [CSS Property Usage](./css-property-usage.md) for:

- The logical-property mandate (`margin-block`, `padding-inline`, `border-inline-*`, `inline-size`, `block-size`, `inset-*`)
- Mandatory design tokens (color / spacing / radius / duration / ease / font) and the prohibition on hard-coded values
- `oklch()` and relative-color syntax (`oklch(from var(--accent-11) l c calc(h + 64))`) for derivations
- `@container` inline-size queries and `@container style(--variant: "desktop")` style queries over `@media` for layout variants, plus the `--variant` / `--page-variant` custom-property convention
- `@scope` for component-level selector isolation paired with `@layer components`
- Container-relative and modern units (`100cqw`, `1dvh`, `1lh`, `1ch`, `stretch`)
- `currentColor` for SVG strokes/fills, and `color-scheme` / `prefers-color-scheme` for theme-aware styling
- Font-feature activation via `--font-sans-features` / `--font-mono-features`
- `-webkit-line-clamp` multi-line truncation and `word-break` defaults
- Transition conventions: `transition: <property> var(--duration-md) ease-in-out` for interactive hover, `filter <property> 3s ease-in-out` for atmospheric reveals, and the "toggle only `--brightness` / `--saturation`, never rewrite the `filter` chain" rule
- Scroll-driven animations: `@supports (animation-timeline: scroll())` guard, and the `timeline-scope` + named `scroll-timeline` pattern when the animated element is an outer non-scrolling ancestor of the scroll container
- Canonical `:focus-visible` template (`outline: var(--accent-5) solid var(--size-3); outline-offset: var(--size-3)`) and the rule that width / offset / color are not per-surface knobs
- Hit-area expansion template: matching `padding: var(--size-8); margin: calc(var(--size-8) * -1)` to grow the tap target without moving the visual position

**Guidelines:**

- SHOULD read the linked reference when work touches this topic.

## Testable Components

See [Testable Components](./testable-components.md) for:

- `data-testid` attribute conventions
- `data-testid` nesting patterns and how E2E and unit tests traverse the component tree
- Loading-state ID conventions (`-loading` suffix)

**Guidelines:**

- SHOULD read the linked reference when work touches this topic.
