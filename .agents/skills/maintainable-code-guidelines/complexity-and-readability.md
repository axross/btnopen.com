# Complexity and Readability

Apply these rules to verify that changed code is straightforward to read and within the project's enforced complexity budget.

## Biome Thresholds

The project enforces these thresholds in `biome.jsonc`. The reviewer MUST flag changes that approach or breach them:

| Rule | Project setting | Flag when |
|---|---|---|
| `noExcessiveCognitiveComplexity` | `error` at 24 | A new or modified function exceeds 24 — Critical (lint will fail) |
| `noExcessiveLinesPerFunction` | `info` at 120 | A new or modified function exceeds 120 lines — Major (won't fail lint, but indicates the function should be split) |
| `noMagicNumbers` | `style` warn | A literal number with no semantic meaning appears outside a CSS variable or named constant — Minor, unless the magic value affects security/auth (then Major) |
| `noExplicitAny` | suspicious | `any` appears in changed code — Critical per [react-component-guidelines › conventions](../react-component-guidelines/conventions.md) |

## Magic Values

- MUST flag a magic number / string that is not paired with either a CSS variable (`var(--spacing-4)`), a named constant, or a `// biome-ignore lint/style/noMagicNumbers: <reason>` comment that explains the meaning.
- MUST NOT flag durations expressed via `cacheLife("hours")` or `cacheLife("days")` — those are project-approved tokens.
- SHOULD flag a hard-coded URL or origin (`"https://btnopen.com"`, `"http://localhost:3000"`) that should come from `urlOrigin` exported by `app/(app)/_/runtime.ts`.

## Dead Code

- MUST flag commented-out code blocks introduced by the change. Remove or restore them — do not leave them as TODO breadcrumbs.
- MUST flag an unused import in a changed file (the linter will too, but call it out so it does not slip through).
- MUST flag an exported symbol from a changed module that has zero callers in the diff or in the existing codebase. Either remove the export or add the caller in the same change.
- SHOULD flag an empty `try`/`catch` (e.g., `catch { /* swallow */ }`) — see [observability-guidelines › error-handling](../observability-guidelines/error-handling.md) for the rethrow rule.

## Type Reuse

- MUST flag an inline object type repeated more than once in the diff — extract into a named `interface` or `type`.
- MUST flag a new prop type that does not extend `ComponentProps<…>` for a component rendering a DOM element, per [react-component-guidelines › conventions](../react-component-guidelines/conventions.md).
- SHOULD flag a `type` alias used where an `interface` would suffice (object-only, no intersection/union) — the project prefers `interface` for those.

## Control Flow

- SHOULD flag a deeply nested ternary or `if`/`else` chain that could be flattened with early returns — improves the cognitive complexity score.
- SHOULD flag a `switch` with no `default` branch when the discriminant is a string union — Biome will warn, but call it out so the author considers an exhaustive check.
- SHOULD flag a `Promise.all([…])` that is awaited and then immediately destructured into independent values — those values may be passable as Promise props per [react-component-guidelines › client-vs-server-components](../react-component-guidelines/client-vs-server-components.md).
