# Lint and Format Gate

Apply these rules to verify the author respected the project's mandatory checks.

## Format

- MUST mentally run `npm run format` (Biome) over the diff. Flag any tab/space inconsistency, trailing whitespace, missing trailing newline, or quote-style drift as Critical (lint will fail).
- MUST flag a hand-applied formatting change to a file the diff did not otherwise need to touch — that violates [development-guidelines › change-management](../development-guidelines/change-management.md) scope discipline.

## Lint

- MUST flag a Critical for any introduced lint **error** (not warning). Common categories that show up in this project:
  - `noExplicitAny`
  - `noUndeclaredDependencies` — a new `import` from a package not in `package.json`
  - `noNodejsModules` — a `node:` import in a non-Payload-config file (Payload config is the only file that legitimately imports `node:path`)
  - `noNextAsyncClientComponent` — `async` function in a `"use client"` file
  - `noProcessEnv` — a `process.env.*` access outside of `payload/config.ts`, `next.config.ts`, `playwright.config.ts`, or `app/(app)/_/runtime.ts` (the only files where this is whitelisted)
  - `noNonInteractiveElementInteractions`
- MUST flag a Major when modified files carry **new** lint warnings (e.g., a new `noExcessiveLinesPerFunction` info-level message).
- SHOULD report pre-existing lint warnings in changed files as Minor with a "consider fixing while you're here" framing — these are explicitly allowed to be cleaned up per [development-guidelines › code-quality](../development-guidelines/code-quality.md).

## Suppressions

- MUST flag a new `// biome-ignore lint/<rule>:` directive that lacks an inline justification on the same line. The project rule is "explain why, not just what".
- MUST flag a new `// biome-ignore-start` / `// biome-ignore-end` block in any file that is not one of the whitelisted env-access points listed above.
- SHOULD flag a `@ts-expect-error` or `@ts-ignore` introduced without a comment explaining the upstream type bug it works around.

## TypeScript Compliance

- MUST flag any introduced `any`, `as any`, `as unknown as <T>`, or `// @ts-expect-error` swallowing a real error per [react-component-guidelines › conventions](../react-component-guidelines/conventions.md).
- MUST flag a missing return type on a new exported function, especially React components — the rules require explicit `JSX.Element` / `Promise<JSX.Element>` / `null`.
- SHOULD flag a non-`type`-only import for symbols used only as types (`import { ComponentProps } from "react"` where it should be `import type { ComponentProps } from "react"`).
