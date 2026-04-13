# AGENTS.md

## Instruction Keywords

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in [RFC 2119](https://www.ietf.org/rfc/rfc2119.txt).

## Project Overview

- This is a personal blogging website built with [Next.js](https://nextjs.org/).

### NPM Run-scripts

- `npm run dev` — Starts the development server.
- `npm run test:e2e` — Runs the end-to-end tests.
- `npm run build` — Builds the production bundle.
- `npm run start` — Starts the production server that built by `npm run build`.
- `npm run migrate:status` — Shows the DB migration status.
- `npm run migrate:create` — Creates a new DB migration entry.
- `npm run migrate:up` — Runs the DB migrations against the DB. The target DB is determined by the environment variables.
- `npm run lint` — Runs the linter (Biome).
- `npm run format` — Formats the code with Biome.

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

## Development Guidelines

- MUST see the following agent skills for detailed guidelines for the corresponding topics.

### General Development Workflow

- MUST follow [Development Workflow Convention](/.agents/skills/development-workflow-convention/SKILL.md).

### Routing

- MUST follow [Routing Guidelines](/.agents/skills/routing-guidelines/SKILL.md).

### React Components

- MUST follow [Vercel React Component Guidelines](/.agents/skills/react-component-guidelines/SKILL.md).
- MUST follow [React Best Practices](/.agents/skills/react-best-practices/SKILL.md). This guideline takes precedence over the former one.

### Next.js

- MUST follow [Next.js Best Practices](/.agents/skills/nextjs-best-practices/SKILL.md).

### Error Handling

- MUST follow [Error Handling Guidelines](/.agents/skills/error-handling-guidelines/SKILL.md).

### Logging

- MUST follow [Logging Guidelines](/.agents/skills/logging-guidelines/SKILL.md).

### End-to-End Testing

- MUST follow [E2E Testing Guidelines](/.agents/skills/e2e-testing-guidelines/SKILL.md).
