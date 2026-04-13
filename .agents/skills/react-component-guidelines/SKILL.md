---
name: react-component-guidelines
description: React component guidelines for writing, reviewing, and refactoring components in this project.
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
