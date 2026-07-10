# Tech Stack

This website is built as a Next.js App Router app backed by Payload CMS. Markdown content is rendered through the local Remark/Rehype/Shiki pipeline, end-to-end behavior is verified with Playwright, Biome owns formatting and linting, and Vercel is the deployment/runtime environment.

| Area | Technology |
| ---- | ---------- |
| Web framework | [Next.js](https://nextjs.org/) |
| Content management | [Payload CMS](https://payloadcms.com/) |
| Markdown processing | [Remark](https://remark.js.org/) |
| Syntax highlighting | [Shiki](https://shiki.style/) |
| End-to-end testing | [Playwright](https://playwright.dev/) |
| Formatting and linting | [Biome](https://biomejs.dev/) |
| Hosting/runtime | [Vercel](https://vercel.com/) |

**Guidelines:**

- MUST treat Next.js App Router and Payload CMS as the primary architectural constraints when placing app or content-management code.
- MUST route markdown rendering changes through the project's markdown-processing guidelines.
- MUST route Playwright work through the project's e2e testing guidelines.
- MUST route formatting and linting behavior through the project's development guidelines.
- SHOULD keep technology-stack summaries here instead of duplicating them in `AGENTS.md`.
