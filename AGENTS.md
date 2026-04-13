# AGENTS.md

## Instruction Keywords

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in [RFC 2119](https://www.ietf.org/rfc/rfc2119.txt).

## Project Overview

- This is a personal blogging website built with [Next.js](https://nextjs.org/).

### NPM Run-scripts

- `npm run dev` - Starts the development server.
- `npm run test:e2e` - Runs the end-to-end tests.
- `npm run build` - Builds the production bundle.
- `npm run start` - Starts the production server that built by `npm run build`.
- `npm run migrate:status` - Shows the DB migration status.
- `npm run migrate:create` - Creates a new DB migration entry.
- `npm run migrate:up` - Runs the DB migrations against the DB. The target DB is determined by the environment variables.
- `npm run lint` - Runs the linter (Biome).
- `npm run format` - Formats the code with Biome.

### Tech Stack

- **[Next.js](https://nextjs.org/)** as the web framework.
- **[Payload CMS](https://payloadcms.com/)** as the admin dashboard and content management system.
- **[Remark](https://remark.js.org/)** for markdown processing and **[Shiki](https://shiki.style/)** for syntax highlighting.
- **[Playwright](https://playwright.dev/)** for end-to-end testing.
- **[Biome](https://biomejs.dev/)** for linting and formatting.
- **[Vercel](https://vercel.com/)** as the hosting/running environment.

### Third-Party Services

- **[Sentry](https://sentry.io/)** for error tracking.
- **[Mixpanel](https://mixpanel.com/)** for analytics.

### Directory Structure

- It uses Next.js App Router.
- It uses nested routes for feature-specific pages.
- It uses `_` directory under `app/` for feature-agnostic modules.
- It uses `_` directory under feature-specific routes for feature-specific modules (e.g. `app/(index)/_components/`).

Example:

```
<root>
├── app/
│   ├── (app)/                 # main application files
│   │   ├── _/                 # feature-agnostic modules
│   │   │   ├── components/    # generic UI components
│   │   │   ├── helpers/       # generic or core helper functions
│   │   │   ├── repositories/  # generic data access functions
│   │   │   └── ...
│   │   ├── _components/       # root layout sub-components
│   │   ├── layout.tsx         # root layout
│   │   ├── (index)/           # index route
│   │   │   ├── _components/   # index route sub-components
│   │   │   └── page.tsx       # index page
│   │   ├── posts/             # posts routes
│   │   │   └── ...
│   │   ├── variables.css      # css variables
│   │   ├── globals.css        # global styles
│   │   ├── layers.css         # css layers definitions
│   │   └── ...
│   └── (payload)/             # Payload CMS routes (do not change)
├── e2e/                       # end-to-end tests
│   └── ...
├── public/                    # public assets
├── .data/                     # local temporary data files
├── payload/                   # Payload CMS configurations
│   └── ...
└── ...
```

### Formatting

- MUST run `npm run format` before committing.
- MUST run `npm run lint` to verify the code quality before committing.

### TypeScript

- MUST use TypeScript.
- MUST not use `any` type.
- SHALL use `never` or `unknown` type only when it is impossible to determine the type and it won't affect the type safety.
- SHOULD clearly declare the input and output types.
- SHOULD prefer to use `interface` over `type` for object types.

### Routing

- SHOULD follow the common RESTful API design principles regarding the path structure.
  - The path structure always SHOULD be repeating the type of resource and the resource identifier.
    - For example, `posts/[id]` instead of `[id]`.
    - For example, `posts/[id]/comments/[id]` instead of `[id]/[id]`.
  - The path elements SHOULD be lowercased and kebab-cased.
  - SHOULD use search params for any optional inputs.
    - For example, use search params for pagination, filtering, and sorting.
    - For example, use search params for language, draft/preview status, etc.

### Components

- MUST be written in TypeScript.
- MUST declare the props type.
  - SHOULD use `ComponentProps<T>` following to the root rendered element type.
    - For example, if the component renders a `div` HTML element at the root, it SHOULD use `ComponentProps<"div">`.
    - For example, if the component renders a `Media` component at the root, it SHOULD use `ComponentProps<typeof Media>`.
- MUST declare the return type of the component.
- MUST use React Server Components when it needs some async data access.
  - SHOULD use `"use cache"` with appropriate `cacheLife()`.
- MUST use React Client Components when it needs some interactive features.
  - MUST use `"use client";` directive at the top of the file.

### CSS

- MUST use CSS Modules for component-scoped styles.
- MUST use CSS variables for theme-related styles.
- MUST be written in appropriate CSS layers for the style target.
  - Components MUST use `@layer components` layer.
- MUST use `variables.css` for the theme-related styles.
- MUST use `globals.css` for the global/base styles.

### Error Handling

- MUST use `try-catch` blocks at the root call sites.
- MUST let the error propagate to the root call site when it was caught in a nested call site.
- MUST rethrow the caught error when it was caught just for logging so that the error can be caught at the root call site.
- MUST call `captureException()` from `@sentry/nextjs` to send the error to Sentry.

### Logging

- SHOULD extend the `rootLogger` from `@/helpers/logger` and use it for logging.
- SHOULD set the appropriate scope identifier at the `module` field when extending the `rootLogger` (e.g. `rootLogger.child({ module: "🪝" })`).
- MUST use `logger.info()` for informational messages.
- MUST use `logger.warn()` for warning messages.
- SHOULD NOT use `logger.error()` for error messages.
  - Instead, SHOULD use `captureException()` from `@sentry/nextjs` to send the error to Sentry.

### End-to-End Testing

See [E2E Testing Guidelines](/.agents/skills/e2e-testing-guidelines/SKILL.md).

## Security Considerations