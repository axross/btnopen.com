# Complexity and Readability

Apply this reference to keep changed code straightforward to read and within the project's enforced complexity budget — while writing it, and while reviewing it.

## Complexity Budget

A codebase's linter usually enforces complexity, length, and (in a statically-typed language) typing budgets. Those thresholds are project configuration, not constants to memorize — read the project's actual linter config rather than assuming a number. A function that breaches a configured threshold is a blocking concern, because the lint gate fails on it; a length breach that only warns is still a signal the function should be split.

**Guidelines:**

- MUST keep a changed function within the project's configured complexity and length thresholds; a function that breaches them and would fail (or warn in) the lint gate is the finding — never silence the linter to slip it through.
- SHOULD split a function whose length breaches the configured budget even when the linter only warns, rather than leaving one oversized function.
- MUST keep an untyped escape hatch (e.g., `any` in a statically-typed language) out of changed code where the project's linter or typing convention forbids it; this is conditional on the project defining such a rule.

## Magic Values

A bare literal forces every later reader to reverse-engineer what it means, and scatters a value that should have one authoritative definition.

**Guidelines:**

- MUST pair a magic number or string with a design token, a named constant, or — only when genuinely justified — the linter's inline-suppression directive plus a comment explaining the meaning. An unexplained literal is the finding.
- MUST NOT treat a value expressed through the project's approved named tokens as magic (e.g., a caching-duration helper that takes `"hours"` / `"days"`).
- SHOULD source a hard-coded URL or origin (e.g., `"https://example.com"`, `"http://localhost:3000"`) from a single configured origin/runtime-config value rather than inlining it. A magic value that affects security or auth is a higher-priority concern than a cosmetic one.

## Dead Code

Commented-out code cannot be tested or type-checked and only rots, and version control already preserves anything worth recovering.

**Guidelines:**

- MUST remove a commented-out code block rather than leaving it as a TODO breadcrumb; a commented-out block introduced by the change is the finding.
- MUST remove an unused import in a changed file (the linter catches it too, but do not rely on that alone).
- MUST either remove an exported symbol that has zero callers in the diff and the existing codebase, or add its caller in the same change — a dangling export is the finding.
- SHOULD treat an empty `try`/`catch` (e.g., `catch { /* swallow */ }`) as a dead-code smell; the rule that a caught error must be rethrown or reported rather than swallowed belongs to the project's error-handling and instrumentation rules where it defines them, so cite that lens rather than restating it here.

## Comments and Doc-Comments

A project's comment and doc-comment rules belong to its own code-quality conventions; this lens raises violations of them and cites that owner rather than restating the rules.

**Guidelines:**

- MUST give a changed or added type/function the doc-comment the project's code-quality conventions require of it (including documenting throwing conditions), where it defines them; a missing doc-comment is the finding, and it matters most on an exported API.
- MUST keep a line comment in the project's chosen comment voice; a comment that breaks it is the finding.
- SHOULD remove or rewrite a line comment that merely restates the code it precedes.

## Type Reuse

A repeated inline type has to be changed in every copy when it evolves, whereas a single named alias documents the concept in one place. This section applies to statically-typed languages.

**Guidelines:**

- MUST extract an inline object/structural type repeated more than once into a single named type alias; the repeated inline shape is the finding.
- MUST keep a new prop/parameter type on the project's established base-type convention for the kind of value it wraps (e.g., a component rendering a DOM element extending that element's prop type), per the project's own component convention, if it defines one.
- SHOULD match the project's established type-declaration form (e.g., a project preference between `interface` and `type` for plain object shapes) rather than introducing the other.

## Control Flow

Deep nesting forces a reader to hold every branch condition at once, while early returns let each case be understood and dismissed on its own.

**Guidelines:**

- SHOULD flatten a deeply nested ternary or `if`/`else` chain with early returns; the nested version is the finding, and flattening lowers the cognitive-complexity score.
- SHOULD give a `switch` on a string-union discriminant a `default` branch (or an exhaustiveness check) so an unhandled case cannot pass silently.
- SHOULD, where the framework supports deferring resolution, pass independent async values unresolved rather than eagerly awaiting them together (e.g., a `Promise.all([…])` destructured up front); this is conditional on the project's own component convention, if it defines one.
