---
name: code-maintainability
description: The ability to keep changed code maintainable — the naming and file organization, route-local vs shared abstraction boundaries, complexity and readability limits, magic-number and dead-code discipline, scope control, and SOLID/DRY/KISS/YAGNI judgment that keep a codebase readable and cheap to change. Applied both while writing or refactoring code and while reviewing a change, on top of the project's development and structure conventions and any project-defined component/routing rules.
when_to_use: Use when writing, refactoring, or reviewing code for maintainability or design — "readable", "too long", "refactor", "abstraction", "magic number", "dead code", or "should this live elsewhere". While authoring, each concern below is a practice to uphold; while reviewing, it is a finding to raise against the diff.
user-invocable: false
---

# Code Maintainability

Use this capability whenever you write, refactor, or review changed code, to keep it readable and cheap to change. Each concern below is one lens with two modes: a practice to uphold while you author the code, and a finding to raise while you review a change. Hold the line the same way in both modes — the standard does not soften because you wrote the code yourself.

Where the project's development or structure conventions own a rule — or a project-defined component, routing, or domain skill does — this capability applies the maintainability lens and defers to that owner by name rather than restating it. Rules gated on "if the project has such a convention" are conditional: skip them cleanly on a project that has none.

**Guidelines:**

- MUST defer each rule to its owning skill by name where one exists (the project's development, structure, component, routing, or domain conventions), summarizing rather than duplicating its wording.
- MUST treat a concern gated on a project-specific convention as inapplicable — not a violation — on a project that does not ship that convention.

## Naming and Organization

See [naming-and-organization.md](./references/naming-and-organization.md) for:

- Keeping file names on the project's established file-naming convention (e.g., kebab-case) and the co-located sibling files that convention requires (such as a paired style-module file)
- Placing components, helpers, and data-access modules in the correct directory tier (route-local before group-shared before global), with a decision flowchart for the tier
- Following the project's own routing convention, if it defines one, and co-locating a route's required sibling files (props/types, not-found, social-image)
- Matching identifier names and casing to the conventions in and around the changed file

## Abstraction Boundaries

See [abstraction-boundaries.md](./references/abstraction-boundaries.md) for:

- Placing new shared logic at the lowest tier that has more than one caller (route-local before group-shared before global)
- Splitting the server / client boundary per the project's own component convention, if it defines one
- Keeping a domain-specific pipeline (such as a content-rendering chain) behind its single owning module, per the project's own domain convention, if it defines one
- Keeping tier imports pointed the right way, so shared code never depends on route-local code

## Complexity and Readability

See [complexity-and-readability.md](./references/complexity-and-readability.md) for:

- Staying within the project's configured linter and complexity budget instead of silently bypassing it
- Giving magic numbers and strings a named constant or design token, reserving an inline lint-suppression directive (with a justifying comment) for the rare justified case
- Removing dead code (unused imports, unreachable branches, commented-out blocks)
- Deferring doc-comment, restating-comment, and comment-voice rules to the project's development conventions, and extracting a repeated inline type into a named alias in a statically-typed language

## Scope Discipline

See [scope-discipline.md](./references/scope-discipline.md) for:

- Keeping the change matched to its stated goal — no drive-by refactors, per the project's development conventions
- Flagging pre-existing problems separately instead of bundling them into this change
- Justifying a new abstraction with two or more concrete call sites (YAGNI), and consolidating repeated logic only when it is truly the same concern (DRY without coupling unrelated callers)
