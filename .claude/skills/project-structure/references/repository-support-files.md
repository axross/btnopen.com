# Repository Support Files

Repository support files define runtime, build, type-checking, test, and observability behavior. Read the relevant file before changing the surface it configures.

| File or directory | Responsibility |
| ----------------- | -------------- |
| `package.json` | npm scripts, dependencies, Node/npm engine expectations |
| `tsconfig.json` | TypeScript compiler settings and path aliases |
| `next.config.ts` | Next.js config, image remote patterns, compiler/runtime integration |
| `payload.config.ts` | Payload CMS top-level configuration |
| `payload/` | Payload collections, globals, helpers, migrations, and seed helpers |
| `instrumentation.ts` / `instrumentation-client.ts` | Next.js instrumentation entry points |
| `sentry.server.config.ts` / `sentry.edge.config.ts` | Sentry runtime initialization |
| `playwright.config.ts` | Playwright e2e runner configuration |
| `biome.jsonc` | Biome formatting and linting rules |
| `.env.example` | Documented environment-variable shape |
| `.pino-prettyrc` | Local pretty-printing for Pino logs |
| `e2e/.data/` | Local e2e fixture/runtime data |

**Guidelines:**

- MUST consult the project's development guidelines before changing npm scripts, dependencies, formatting, linting, or verification commands.
- MUST consult the project's application-security requirements before changing environment-variable shape, secrets, Payload access control, or public exposure.
- MUST consult the project's observability guidelines before changing instrumentation, Sentry config, or logger setup.
- MUST consult the project's e2e testing guidelines before changing `playwright.config.ts` or files under `e2e/`.
- MUST treat generated outputs such as `.next/`, `node_modules/`, `payload/types.ts`, and Payload-generated route files as non-source unless the task explicitly concerns generation.
