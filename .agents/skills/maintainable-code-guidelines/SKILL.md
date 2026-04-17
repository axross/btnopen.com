---
name: maintainable-code-guidelines
description: Use this skill when reviewing the maintainability and design of changed code in this project — naming and file organization (kebab-case files, the `_components/` vs `_/components/` distinction, page-co-located `page-props.ts`), abstraction boundaries (route-local vs route-group-shared modules under `app/(app)/_/`, where helpers/repositories/components belong), complexity and readability (Biome `noExcessiveCognitiveComplexity` cap of 24, `noExcessiveLinesPerFunction` of 120, magic-number discipline, dead-code removal), scope discipline (changes confined to the stated task per `development-guidelines › change-management`), and the SOLID/DRY/KISS/YAGNI lens applied to RSC trees and Payload repositories. This is the **reviewer's** lens — what to flag — and layers on top of [development-guidelines](../development-guidelines/SKILL.md), [react-component-guidelines](../react-component-guidelines/SKILL.md), and [routing-guidelines](../routing-guidelines/SKILL.md), which the developer follows when writing the code. Use even when the user only says "is this readable", "this function feels too long", or "should this live somewhere else".
user-invocable: false
---

# Maintainable Code Guidelines

Apply these rules when reviewing the maintainability and design of any changed code. This is the reviewer's lens — flag violations and link to the developer-facing rule rather than restating it.

## Naming and Organization

See [naming-and-organization.md](./naming-and-organization.md) for what to verify:

- File names match the project's kebab-case convention and CSS module pairing
- Components, helpers, and repositories live in the correct directory tier (`_components/` vs `_/components/` vs `_/helpers/` vs `_/repositories/`)
- New routes follow [routing-guidelines](../routing-guidelines/SKILL.md) and co-locate `page-props.ts`, `not-found.tsx`, OG image files
- Identifier names match in/around the changed file's existing conventions

## Abstraction Boundaries

See [abstraction-boundaries.md](./abstraction-boundaries.md) for what to verify:

- New shared logic lives at the lowest tier that has more than one caller (route-local before route-group, route-group before global `_/`)
- Repository functions own data fetching; components MUST NOT call `getPayload({ config })` directly
- Server / Client component boundary is split per [react-component-guidelines › client-vs-server-components](../react-component-guidelines/client-vs-server-components.md)
- Markdown plugins, if any, follow [markdown-processing-guidelines › custom-plugins](../markdown-processing-guidelines/custom-plugins.md)

## Complexity and Readability

See [complexity-and-readability.md](./complexity-and-readability.md) for what to verify:

- Biome lint thresholds are not silently bypassed (`noExcessiveCognitiveComplexity: 24`, `noExcessiveLinesPerFunction: 120`)
- Magic numbers and strings have a named constant or CSS variable, with `// biome-ignore lint/style/noMagicNumbers: …` only when justified
- Dead code (unused imports, unreachable branches, commented-out blocks) is removed
- Inline TypeScript types are extracted into `interface` or `type` aliases when reused

## Scope Discipline

See [scope-discipline.md](./scope-discipline.md) for what to verify:

- The diff matches the stated user goal — no drive-by refactors per [development-guidelines › change-management](../development-guidelines/change-management.md)
- Pre-existing problems are flagged separately, not bundled into this change
- New abstractions are justified by ≥ 2 concrete call sites (YAGNI)
- Repeated logic across the diff is consolidated only when the duplication is truly the same concern (DRY without coupling unrelated callers)
