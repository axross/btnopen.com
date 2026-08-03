# Directory Structure

Use this tree to decide where repository-level files and app features belong before adding new files. The `app/(app)/_/` directory owns feature-agnostic app modules, route-local `_components/` directories own route-specific UI, `payload/` owns Payload CMS configuration, `shared/` owns the few modules both realms import, and `app/(payload)/` is generated/owned by Payload routing and should not be changed for normal app work.

```text
<root>
├── app/
│   ├── (app)/                 # main application files
│   │   ├── _/                 # feature-agnostic modules
│   │   │   ├── components/    # generic UI components
│   │   │   ├── helpers/       # generic or core helper functions
│   │   │   ├── repositories/  # generic data access functions
│   │   │   ├── translations/  # per-locale UI message catalogs
│   │   │   ├── runtime.ts     # the app realm's environment barrel
│   │   │   └── ...
│   │   ├── _components/       # root layout sub-components
│   │   ├── layout.tsx         # root layout
│   │   ├── (index)/           # index route
│   │   │   ├── _components/   # index route sub-components
│   │   │   └── page.tsx       # index page
│   │   ├── posts/             # posts routes
│   │   │   ├── caches/        # blog post list cache invalidation (route.ts)
│   │   │   └── [slug]/        # blog post route
│   │   │       ├── _components/   # post route sub-components, incl. comments/
│   │   │       ├── caches/        # post cache invalidation (route.ts)
│   │   │       ├── comments/      # comment create (route.ts)
│   │   │       │   ├── caches/    # comment cache invalidation (route.ts)
│   │   │       │   └── token/     # CSRF token issuance (route.ts)
│   │   │       └── ...
│   │   ├── variables.css      # css variables
│   │   ├── globals.css        # global styles
│   │   ├── layers.css         # css layers definitions
│   │   └── ...
│   ├── (payload)/             # Payload CMS routes (do not change)
│   └── global-not-found.tsx   # not-found page outside the (app) root layout
├── e2e/                       # end-to-end tests
│   └── ...
├── public/                    # public assets
├── .data/                     # local temporary data files
├── payload/                   # Payload CMS configurations
│   └── ...
├── shared/                    # realm-neutral modules both app/ and payload/ import
│   └── ...
├── docs/                      # deployment pipeline documentation
├── scripts/                   # repository maintenance scripts (*.mjs)
├── proxy.ts                   # Next.js proxy, on the Node.js runtime
└── ...
```

**Guidelines:**

- MUST use Next.js App Router conventions under `app/`.
- MUST place feature-agnostic application modules under `app/(app)/_/`.
- MUST place feature-specific route modules under the owning route directory, using underscore-prefixed folders such as `_components/` for route-local implementation details.
- MUST NOT change `app/(payload)/` for normal application work.
- MUST place Payload CMS collection and configuration changes under `payload/`.
- MUST place a module under `shared/` only when both `app/` and `payload/` import it, and MUST keep it free of imports from either — a `shared/` module that reaches back into `app/` re-creates the boundary violation it exists to remove.
- MUST place Playwright end-to-end tests under `e2e/`.
- MUST place static public assets under `public/`.
- MUST treat `.data/` as local temporary data storage, not durable application source.
- SHOULD update this tree when a durable top-level directory or route-structure convention changes.
