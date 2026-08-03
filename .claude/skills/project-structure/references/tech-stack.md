# Tech Stack

This website is built as a Next.js App Router app backed by Payload CMS. Markdown content is rendered through the local Remark/Rehype/Shiki pipeline, Clerk brokers the GitHub sign-in that authenticates a reader leaving a comment, end-to-end behavior is verified with Playwright, unit behavior with Jest, Biome owns formatting and linting, and Vercel is the deployment/runtime environment.

| Area | Technology |
| ---- | ---------- |
| Web framework | [Next.js](https://nextjs.org/) (App Router) |
| Content management | [Payload CMS](https://payloadcms.com/) |
| Markdown processing | [Remark](https://remark.js.org/) |
| Syntax highlighting | [Shiki](https://shiki.style/) |
| Comment authentication | [Clerk](https://clerk.com/) |
| Unit testing | [Jest](https://jestjs.io/) |
| End-to-end testing | [Playwright](https://playwright.dev/) |
| Formatting and linting | [Biome](https://biomejs.dev/) |
| Structured logging | [Pino](https://getpino.io/) |
| Hosting/runtime | [Vercel](https://vercel.com/) |

**Guidelines:**

- MUST treat Next.js App Router and Payload CMS as the primary architectural constraints when placing app or content-management code.
- MUST route markdown rendering changes through the project's markdown-processing capability, which owns the pipeline.
- MUST route App Router mechanics — rendering, caching, route handlers, metadata, the server/client boundary — through the Next.js app development capability, and this skill's [routing-conventions.md](./routing-conventions.md) for the shapes this repository gives them.
- MUST consult Clerk's own current documentation before changing a Clerk API surface, and [comments-subsystem.md](./comments-subsystem.md) for how this repository wires it. No installed capability covers Clerk, so those two are the whole of its contract here — there is no vendor skill to defer the practice to, as there is for Sentry.
- MUST route commands — running the dev server, tests, build, format, lint, or a migration — through `README.md`, which is this project's contributor documentation and the source of truth for them.
- SHOULD keep durable technology-stack rules here. `README.md`'s tech-stack table is the human-facing orientation summary and is expected to overlap with the table above; `CLAUDE.md` carries neither, holding only how agents work in this repository.
