---
name: maintainable-code-guidelines
description: Use this skill when reviewing maintainability and design of changed code. Covers naming and file organization, route-local vs shared abstraction boundaries, complexity/readability limits, magic-number and dead-code discipline, scope control, and SOLID/DRY/KISS/YAGNI judgment for RSC trees and Payload repositories. This is the reviewer's lens on top of development, project-structure, React, and routing rules. Use for "readable", "too long", "refactor", "abstraction", or "should this live elsewhere".
---

# Maintainable Code Guidelines

Apply these rules when reviewing the maintainability and design of any changed code. This is the reviewer's lens — flag violations and link to the developer-facing rule rather than restating it.

## Naming and Organization

See [naming-and-organization.md](./references/naming-and-organization.md) for:

- File names match the project's kebab-case convention and CSS module pairing
- Components, helpers, and repositories live in the correct directory tier (`_components/` vs `_/components/` vs `_/helpers/` vs `_/repositories/`)
- New routes follow the project's routing guidelines and co-locate `page-props.ts`, `not-found.tsx`, OG image files
- Identifier names match in/around the changed file's existing conventions

## Abstraction Boundaries

See [abstraction-boundaries.md](./references/abstraction-boundaries.md) for:

- New shared logic lives at the lowest tier that has more than one caller (route-local before route-group, route-group before global `_/`)
- Server / Client component boundary is split per the project's React component guidelines (client-vs-server-components rules)
- The markdown pipeline stays behind its single owning module, and plugins follow the project's markdown-processing guidelines (custom-plugins rules)

## Complexity and Readability

See [complexity-and-readability.md](./references/complexity-and-readability.md) for:

- Biome lint thresholds are not silently bypassed (`noExcessiveCognitiveComplexity: 24`, `noExcessiveLinesPerFunction: 120`)
- Magic numbers and strings have a named constant or CSS variable, with `// biome-ignore lint/style/noMagicNumbers: …` (and a justifying reason) only when justified
- Dead code (unused imports, unreachable branches, commented-out blocks) is removed
- Missing doc-comments on changed public types/functions, restating comments, and comment-voice violations (rules owned by development-guidelines › code-quality)
- Inline TypeScript types are extracted into `interface` or `type` aliases when reused

## Scope Discipline

See [scope-discipline.md](./references/scope-discipline.md) for:

- The diff matches the stated user goal — no drive-by refactors per the project's development guidelines (change-management rules)
- Pre-existing problems are flagged separately, not bundled into this change
- New abstractions are justified by ≥ 2 concrete call sites (YAGNI)
- Repeated logic across the diff is consolidated only when the duplication is truly the same concern (DRY without coupling unrelated callers)
