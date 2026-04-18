---
name: project_skill_layout
description: How agent skills and claude agents are laid out in the btnopen.com repo, including conventions.
type: project
---

This repo keeps **agent skills** under `.agents/skills/<kebab-case-name>/` and **Claude subagent definitions** under `.claude/agents/<name>.md`. These are different things — skills are the agentskills.io format (SKILL.md + reference files), while `.claude/agents/` are Anthropic subagent profiles with their own frontmatter (`model`, `color`, `memory`) and role-definition prose body.

Current skills (as of 2026-04-16): `development-guidelines`, `routing-guidelines`, `react-component-guidelines`, `ui-design-principles`, `markdown-processing-guidelines`, `observability-guidelines`, `e2e-testing-guidelines`, `code-review-guideline`, `maintainable-code-guidelines`, `quality-assurance-guidelines`, `application-security-requirements`, `performance-and-reliability-requirements`. Each skill uses progressive disclosure: the `SKILL.md` is a short index pointing at topical `.md` reference files in the same directory. Only `routing-guidelines` inlines everything (kept that way because the content is small — splitting would be busywork against the "progressive disclosure only when legitimately needed" rule).

All skills carry a non-standard frontmatter key `user-invocable: false` — treat it as a Claude-specific harness field, not an agentskills.io spec field. Leave it in place.

`AGENTS.md` at repo root is the master index that tells agents which skills to apply for which topic. Keep it in sync whenever a skill is added/removed/renamed — recent history shows broken links are a real failure mode (the "remove 3rd-party agent skills" commit left AGENTS.md pointing at deleted skills until 2026-04-16 cleanup). Note: AGENTS.md only links to top-level `SKILL.md` files under each skill dir; adding a new reference file *inside* an existing skill does not require an AGENTS.md edit.

**Known scope boundaries worth remembering:**
- `development-guidelines` = developer-authoring rules (format/lint, scope discipline, npm deps, migrations, commit messages).
- `code-review-guideline` = reviewer's cross-cutting process (scoping, severity, evidence, tone, escalation) and routes to the four review lenses.
- `maintainable-code-guidelines` / `quality-assurance-guidelines` / `application-security-requirements` / `performance-and-reliability-requirements` = the four reviewer-lens skills.
- `react-component-guidelines` vs `ui-design-principles`: the former owns **mechanics** (file naming, prop types, client/server split, CSS Modules usage, `@layer components`, style-isolation rules like no `position`/`margin`/root-sizing, `clsx` merging, `data-testid` conventions). The latter owns **design decisions** on top of those mechanics (OKLCH palette semantics à la Radix 12-step, typography/weight usage, squircle shape language, motion tokens, imagery sepia recipe, logical-property mandate, `@container` + `--variant` convention, UI copy voice, `aria-label`/`alt` strings, `:focus-visible` rings, external-link `rel`). Added 2026-04-16. When a rule is about *how to wire it up*, put it in react-component-guidelines; when it's about *what decision to make*, put it in ui-design-principles.
- When adding a *developer-facing* convention (e.g., Conventional Commits, added 2026-04-16), it goes inside `development-guidelines/` as a new sibling reference file, wired into SKILL.md and the skill's frontmatter `description`. Do NOT duplicate into `code-review-guideline`; the reviewer cites developer-facing rules rather than restating them.
- Both `development-guidelines/SKILL.md` (topic table) and `code-review-guideline/SKILL.md` (developer-facing defer table) need updating when a new topical skill is added.

**Why:** Understanding this layout lets me audit or extend the skill system without re-discovering the structure.

**How to apply:** When asked to add/edit/audit skills, go straight to `.agents/skills/` and verify AGENTS.md cross-references still resolve. Do not split small skills (< ~100 lines total) into reference files just for consistency — progressive disclosure is a remedy for bloat, not a style rule. When in doubt about where a developer-facing rule goes, default to `development-guidelines/` with a new reference file and a SKILL.md entry.
