# Current External Documentation

Apply this reference when a change depends on framework, platform, service, or tool behavior that may have changed since the local skill was written. Official docs are part of the implementation context for these surfaces.

## When to Refresh Docs

Use current official docs before changing behavior governed by fast-moving frameworks or services.

| Surface | Refresh docs before changing |
| ------- | ---------------------------- |
| Next.js | App Router conventions, route handlers, metadata files, caching, Server Components, config, instrumentation, image behavior |
| Payload CMS | Collections, fields, globals, access control, hooks, admin customization, migrations, rich text, storage adapters |
| Sentry | Next.js setup, instrumentation, source maps, event capture, PII behavior, runtime-specific config |
| Vercel | Deployment/runtime behavior, image optimization, Blob storage, environment variables |
| Playwright | Test runner configuration, snapshot behavior, locator/assertion APIs |
| Biome | Formatter/linter configuration, suppression syntax, rule names |

**Guidelines:**

- MUST consult current official docs before changing any surface listed in the table.
- MUST use official docs as the primary source; use blog posts, examples, or issues only as secondary context.
- MUST mention the docs consulted in the final summary when the implementation depends on a current-docs decision.
- MUST NOT rely only on memory for APIs, defaults, or behavior that the relevant vendor may have changed.
- SHOULD limit the docs lookup to the smallest surface needed for the task.

## Project-Specific Current-Docs Triggers

Some project areas are especially sensitive because a small API mismatch can produce production-only failures.

**Guidelines:**

- MUST refresh Next.js docs before changing `page.tsx` async props, `generateMetadata`, file-based metadata routes, route handlers, `cacheLife()`, or `next.config.ts`.
- MUST refresh Payload docs before changing collection schemas, auth/access rules, Lexical editor configuration, migrations, or Vercel Blob storage integration.
- MUST refresh Sentry docs before changing `instrumentation.ts`, `instrumentation-client.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`, `captureException()` behavior, source maps, or PII settings.
- MUST refresh Vercel docs before changing deployment/runtime assumptions, Vercel Blob usage, or environment-variable exposure.
- SHOULD refresh Playwright or Biome docs before changing `playwright.config.ts`, snapshot behavior, `biome.jsonc`, or suppression syntax.
