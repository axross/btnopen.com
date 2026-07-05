# Directory Structure

Use this tree to decide where repository-level files and app features belong before adding new files. The `app/(app)/_/` directory owns feature-agnostic app modules, route-local `_components/` directories own route-specific UI, `payload/` owns Payload CMS configuration, and `app/(payload)/` is generated/owned by Payload routing and should not be changed for normal app work.

```text
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

**Guidelines:**

- MUST use Next.js App Router conventions under `app/`.
- MUST place feature-agnostic application modules under `app/(app)/_/`.
- MUST place feature-specific route modules under the owning route directory, using underscore-prefixed folders such as `_components/` for route-local implementation details.
- MUST NOT change `app/(payload)/` for normal application work.
- MUST place Payload CMS collection and configuration changes under `payload/`.
- MUST place Playwright end-to-end tests under `e2e/`.
- MUST place static public assets under `public/`.
- MUST treat `.data/` as local temporary data storage, not durable application source.
- SHOULD update this tree when a durable top-level directory or route-structure convention changes.
