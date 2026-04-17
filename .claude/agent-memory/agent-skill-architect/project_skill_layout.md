---
name: project_skill_layout
description: How agent skills and claude agents are laid out in the btnopen.com repo, including conventions.
type: project
---

This repo keeps **agent skills** under `.agents/skills/<kebab-case-name>/` and **Claude subagent definitions** under `.claude/agents/<name>.md`. These are different things — skills are the agentskills.io format (SKILL.md + reference files), while `.claude/agents/` are Anthropic subagent profiles with their own frontmatter (`model`, `color`, `memory`) and role-definition prose body.

Current skills (as of 2026-04-16): `development-guidelines`, `routing-guidelines`, `react-component-guidelines`, `markdown-processing-guidelines`, `observability-guidelines`, `e2e-testing-guidelines`. Each skill uses progressive disclosure: the `SKILL.md` is a short index pointing at topical `.md` reference files in the same directory. Only `routing-guidelines` inlines everything (kept that way because the content is small — splitting would be busywork against the "progressive disclosure only when legitimately needed" rule).

All skills carry a non-standard frontmatter key `user-invocable: false` — treat it as a Claude-specific harness field, not an agentskills.io spec field. Leave it in place.

`AGENTS.md` at repo root is the master index that tells agents which skills to apply for which topic. Keep it in sync whenever a skill is added/removed/renamed — recent history shows broken links are a real failure mode (the "remove 3rd-party agent skills" commit left AGENTS.md pointing at deleted skills until 2026-04-16 cleanup).

**Why:** Understanding this layout lets me audit or extend the skill system without re-discovering the structure.

**How to apply:** When asked to add/edit/audit skills, go straight to `.agents/skills/` and verify AGENTS.md cross-references still resolve. Do not split small skills (< ~100 lines total) into reference files just for consistency — progressive disclosure is a remedy for bloat, not a style rule.
