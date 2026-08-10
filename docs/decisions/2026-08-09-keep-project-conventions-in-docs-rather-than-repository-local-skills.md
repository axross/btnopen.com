---
status: accepted
---

# Keep project conventions in docs rather than repository-local skills

This repository kept three skills of its own — a structure skill, a
visual-identity skill, and a markdown-pipeline skill — holding what the shared
skill library could not know about it. Together they carried 533 guideline bullets
across 2,815 lines, readable only by an agent whose discovery happened to surface
them, and describing a mix of what the product does and how the code is written.

Adopting a product-specification corpus forced the question of where each half
belongs, because that capability scopes conventions and runbooks out of the corpus
without naming a home for them. The answer taken here is that `docs/` is the
single documentation root for both: `specs/` for what the product does,
`conventions/` for how the code is written, `operations/` for how the repository
is built and run, with `decisions/` beside them. All three skills were retired
into it, and `.claude/skills/` now holds installed skills only.

Two alternatives were rejected. Keeping the three skills and moving only their
product-behaviour halves would have left the same content split across two
mechanisms with a boundary to re-adjudicate on every change. Putting the
conventions in a separate `CONTRIBUTING.md` tree beside `docs/` would have created
a second documentation root and a decision, at every write, about which tree a
paragraph belongs in.

What the change costs is discovery. A skill loads because its frontmatter matched
the surface being edited, with nobody remembering to ask; a document loads because
an instruction file said to read it. The reasoning for accepting that is that
`CLAUDE.md` is injected into every session unconditionally while skill discovery
fires only conditionally, so explicit routing from `CLAUDE.md` to `docs/index.md`
is at least as reliable — but it is reliable *because* that routing names a
document per surface, and it stops being reliable if the routing decays into a
general pointer.

The arrangement also contradicts `agent-skill-management`, which expects a
project's own structure and process to live in a repository-local skill. That
capability is treated as wrong rather than as a rule to deviate from, on the
grounds that the same library now ships two capabilities routing this material
somewhere that is not a skill; it is filed upstream as axross/skills#315.
