# AGENTS.md

## Requirement Level Keywords

Here is the list of keywords to signify the requirements. Apply the following rules for each keyword in this document and the documents linked from this document.

1. MUST — This word, or the terms "REQUIRED", mean that the definition is an absolute requirement of the specification.
2. MUST NOT — This word mean that the definition is an absolute prohibition of the specification.
3. SHOULD — This word, or the adjective "RECOMMENDED", mean that there may exist valid reasons in particular circumstances to ignore a particular item, but the full implications must be understood and carefully weighed before choosing a different course.
4. SHOULD NOT — This phrase, or the phrase "NOT RECOMMENDED" mean that there may exist valid reasons in particular circumstances when the particular behavior is acceptable or even useful, but the full implications should be understood and the case carefully weighed before making any behavior described with this label.
5. MAY — This word, or the adjective "OPTIONAL", mean that an item is truly optional.

## Project Overview

- This is a personal blogging website. It displays a portrait, a bio, and links to the author's social media accounts.
- Blog posts are the primary content type. They support tags, cover images, and rich Markdown including syntax-highlighted code blocks and embedded web content previews.
- Content is written primarily in Japanese, with English provided as a fallback for readers in other locales.

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

### Markdown Processing

- MUST follow [Markdown Processing Guidelines](/.agents/skills/markdown-processing-guidelines/SKILL.md).

### End-to-End Testing

- MUST follow [E2E Testing Guidelines](/.agents/skills/e2e-testing-guidelines/SKILL.md).
