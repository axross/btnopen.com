# Code Quality

Apply these rules whenever you write or modify code in this project.

## Check Sequence

- MUST always run checks in this order after making any code change:
  1. **Format** (`npm run format`) — auto-formats all modified files.
  2. **Lint** (`npm run lint`) — detects code quality and remaining format issues.
  3. **Fix all reported errors.**
  4. **Re-run lint** — confirm all errors are resolved.
  5. **Test** (`npm run test:e2e`) — only when the change affects a UI output surface; see [verification.md](./verification.md) for which changes require testing.
- MUST NOT skip or reorder these steps.
- `npm run format` runs `biome format --write`, which applies auto-fixable formatting. `npm run lint` runs `biome check`, which enforces both lint rules and format rules. Some format violations are only caught by `biome check`, so the lint step may still report format issues even after running format.

## Formatting

- MUST run `npm run format` after every set of code changes, before committing or considering the task done.
- Formatting is enforced by [Biome](https://biomejs.dev/). MUST NOT manually adjust spacing, indentation, or line endings — let the formatter handle it.
- MUST NOT submit code that has not been passed through the formatter.

## Linting

- MUST run `npm run lint` after formatting to surface code quality issues.
- MUST fix every lint **error** before considering the task complete.
- SHOULD fix lint **warnings** in any file that was modified as part of the task. MAY also fix pre-existing warnings in those files.
- MUST NOT suppress lint rules with inline disable comments (e.g., `// biome-ignore`) unless there is a clear, documented reason why the rule cannot be satisfied.
  - When suppression is genuinely necessary, add an inline comment on the same line explaining the reason.
  - Example: `// biome-ignore lint/suspicious/noExplicitAny: external library type is untyped`

## Comments

- MUST start `//`, `/* */`, JSDoc, and each visually-line-starting sentence inside a multi-line comment with a lowercase letter in `.ts` / `.tsx` / `.js` source files. Proper nouns (`Chromium`, `React`, `Next.js`), code identifiers (`Promise.all`, `<Table>`), acronyms (`API`, `JSON`, `GFM`), and deliberate all-caps emphasis keep their natural casing.
  - Example: `// resolve the draft first, then fall back to the published version`
- Applies to TS/JS source only. Does NOT apply to CSS `/* */` comments, Markdown prose, or commit messages (see [commit-messages.md](./commit-messages.md)).
- `biome-ignore` / `eslint-disable` directive comments follow the tool's required casing; the trailing human-readable reason after the colon also starts lowercase (e.g., `// biome-ignore lint/suspicious/noExplicitAny: external library type is untyped`).

## Import Hygiene

- MUST NOT leave unused imports in modified files. The linter will flag these, but resolve them proactively.
- MUST NOT use barrel re-export files (`index.ts` that re-exports everything) as import sources when a direct import path is available. Import directly from the module file.
  - This keeps bundle size small and avoids accidentally pulling in server-only code into client bundles.
- SHOULD use type-only imports (`import type { ... }`) when importing types that are not used as values.
  - Example: `import type { JSX } from "react";`
