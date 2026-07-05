# Complexity and Readability

Apply these rules to verify that changed code is straightforward to read and within the project's enforced complexity budget.

## Lint Complexity Thresholds

The project enforces these thresholds in `biome.jsonc`; use the table as the reviewer's severity map:

| Rule | Project setting | Flag when |
|---|---|---|
| `noExcessiveCognitiveComplexity` | `error` at 24 | A new or modified function exceeds 24 — Critical (lint will fail) |
| `noExcessiveLinesPerFunction` | `info` at 120 | A new or modified function exceeds 120 lines — Major (won't fail lint, but indicates the function should be split) |
| `noMagicNumbers` | `style` warn | A literal number with no semantic meaning appears outside a CSS variable or named constant — Minor, unless the magic value affects security/auth (then Major) |
| `noExplicitAny` | suspicious | `any` appears in changed code — Critical per [react-component-guidelines › conventions](../../react-component-guidelines/references/conventions.md) |

**Guidelines:**

- MUST flag changed functions that breach the enforced `biome.jsonc` complexity/length thresholds — these MUST NOT be silently bypassed.
- MUST use the severity shown in the table when a threshold maps to a project-specific review finding.

## Magic Values

A bare literal forces every later reader to reverse-engineer what it means, and scatters a value that should have one authoritative definition.

**Guidelines:**

- MUST flag a magic number / string that is not paired with either a CSS variable (`var(--spacing-4)`), a named constant, or a `// biome-ignore lint/style/noMagicNumbers: <reason>` comment that explains the meaning.
- MUST NOT flag durations expressed via `cacheLife("hours")` or `cacheLife("days")` — those are project-approved tokens.
- SHOULD flag a hard-coded URL or origin (`"https://btnopen.com"`, `"http://localhost:3000"`) that should come from `urlOrigin` exported by `app/(app)/_/runtime.ts`.

## Dead Code

Commented-out code cannot be tested or type-checked and only rots, and version control already preserves anything worth recovering.

**Guidelines:**

- MUST flag commented-out code blocks introduced by the change. Remove or restore them — do not leave them as TODO breadcrumbs.
- MUST flag an unused import in a changed file (the linter will too, but call it out so it does not slip through).
- MUST flag an exported symbol from a changed module that has zero callers in the diff or in the existing codebase. Either remove the export or add the caller in the same change.
- SHOULD flag an empty `try`/`catch` (e.g., `catch { /* swallow */ }`) — see [observability-guidelines › error-handling](../../observability-guidelines/references/error-handling.md) for the rethrow rule.

## Comments and Doc-Comments

The project's comment and doc-comment rules are owned by [development-guidelines › code-quality › Comments](../../development-guidelines/references/code-quality.md); this lens flags violations of them and links back rather than restating them.

**Guidelines:**

- MUST flag a changed/added type or function that lacks the doc-comment [code-quality › Doc-Comments](../../development-guidelines/references/code-quality.md) requires of it (including undocumented throwing conditions) — Minor, Major when it is an exported API.
- MUST flag a line comment that violates the project's lowercase-first comment voice — Nit.
- SHOULD flag a line comment that merely restates the code it precedes.

## Type Reuse

A repeated inline shape has to be changed in every copy when it evolves, whereas a single named alias documents the concept in one place.

**Guidelines:**

- MUST flag an inline object type repeated more than once in the diff — extract into a named `interface` or `type`.
- MUST flag a new prop type that does not extend `ComponentProps<…>` for a component rendering a DOM element, per [react-component-guidelines › conventions](../../react-component-guidelines/references/conventions.md).
- SHOULD flag a `type` alias used where an `interface` would suffice (object-only, no intersection/union) — the project prefers `interface` for those.

## Control Flow

Deep nesting forces a reader to hold every branch condition at once, while early returns let each case be understood and dismissed on its own.

**Guidelines:**

- SHOULD flag a deeply nested ternary or `if`/`else` chain that can be flattened with early returns — improves the cognitive complexity score.
- SHOULD flag a `switch` with no `default` branch when the discriminant is a string union — Biome will warn, but call it out so the author considers an exhaustive check.
- SHOULD flag a `Promise.all([…])` that is awaited and then immediately destructured into independent values — those values may be passable as Promise props per [react-component-guidelines › client-vs-server-components](../../react-component-guidelines/references/client-vs-server-components.md).
