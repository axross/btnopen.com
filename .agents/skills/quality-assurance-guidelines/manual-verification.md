# Manual Verification Evidence

Apply these rules to verify the author exercised the change in the dev server before relying on the e2e suite. Manual verification is the **first line** of confirmation per [development-guidelines › verification](../development-guidelines/verification.md).

## Required Manual Checks

The reviewer MUST ask the author to confirm (in the PR description or the review thread) that the following were checked when the diff touches the listed surface:

| Diff touches | Required manual check |
|---|---|
| Any `page.tsx`, `layout.tsx`, route-local `_components/`, or `app/(app)/_/components/` | The affected route was loaded at `http://localhost:3000` via `npm run dev` |
| Any CMS-driven route (anything reading from a Payload repository) | The route was loaded with `?draft=true` while signed in to `/admin` |
| `posts/[slug]` or anything calling `PayloadLivePreview` | The Payload live-preview path (`?preview=true&draft=true`) was loaded inside the Payload admin |
| `not-found.tsx`, `global-not-found.tsx`, or any routing change | A non-existent slug was requested and the not-found UI rendered correctly |
| `generateMetadata`, `sitemap.ts`, `robots.ts`, OG image `route.tsx` | The metadata response was inspected (e.g., view-source, `/sitemap.xml`, `/robots.txt`, OG-tag preview) |
| Markdown processing pipeline (`app/(app)/_/helpers/markdown.ts`, `app/(app)/_/components/markdown.tsx`) | A blog post containing the affected markdown construct was rendered end-to-end |
| Sentry config or `instrumentation.ts` | Dev server starts without throwing, and a test exception was confirmed to land in Sentry (or the author confirmed the DSN is intentionally null in dev) |

- MUST flag a Major when the diff touches a row in the table above and the author has not confirmed the corresponding check.

## Dev-Server Output Inspection

- MUST flag a Major when the diff introduces new Pino `warn`-level log lines that were not in the dev-server output before the change (or removes existing `warn` lines without explanation). The dev server pipes through `pino-pretty` so these are visible inline.
- MUST flag a Critical when the diff causes the dev server to throw an uncaught exception during a normal navigation — Sentry will receive it but users will see `global-error.tsx`.
- SHOULD ask the author to include the dev-server output snippet for the affected route in the PR description when the change adds new repository calls or new logger usage.

## Local Production Build

- SHOULD ask the author to run `npm run build && npm run start` and reload the affected route when the diff touches:
  - `next.config.ts`
  - Anything affecting the React Compiler output (e.g., a new component file that triggers different memoization)
  - `"use cache"` / `cacheLife()` calls (cache behavior in dev vs prod differs)
  - `next/image` configuration or `images.remotePatterns`

## What Manual Verification Cannot Replace

- MUST NOT accept "I tested it manually" as a substitute for the e2e coverage required by [e2e-coverage.md](./e2e-coverage.md). Manual is the first line; e2e is the second and the one that runs in CI.
- MUST NOT accept "the dev server didn't error" as a substitute for the lint gate per [lint-and-format-gate.md](./lint-and-format-gate.md). Lint runs separately.
