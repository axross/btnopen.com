---
name: agent-skills-best-practices
description: Apply this skill whenever creating, refining, restructuring, renaming, or auditing an agent skill under the host project's skill root (e.g., `.agents/skills/`) — drafting a `SKILL.md`, splitting a skill into reference files, tightening a `description`, or deciding where a new rule belongs. Covers agentskills.io frontmatter, host-project harness fields, kebab-case naming, description writing for discovery (768-char target / 1024-char spec limit), RFC-2119 keywords, decision-vs-implementation tone, progressive disclosure (~500-line ceiling, one-level-deep references), section-length ceilings, relative-path cross-references that never duplicate content, and keeping the host project's master skill index in sync. Use even when the user says "skill", "SKILL.md", "MECE", or "audit skills".
---

# Agent Skills Best Practices

Apply these rules whenever creating, refining, splitting, consolidating, renaming, or auditing any agent skill under the host project's *skill root* — the directory the local agent harness scans for skills, commonly `.agents/skills/` for Claude Code / VS Code, or a similar path under another harness.

This skill governs the **authoring discipline** for skills written in the [agentskills.io](https://agentskills.io/) format. For the host project's current skill inventory and topic-to-skill routing, defer to the project's master skill index (commonly `AGENTS.md`, `CLAUDE.md`, or a similar root file) and the directory listing under the skill root — this skill deliberately does not enumerate the active skill set, because that list drifts.

## Scoping and MECE

See [scoping-and-mece.md](./scoping-and-mece.md) for:

- Coherent-unit sizing — what one skill covers and what belongs to a neighbor
- Mutual-exclusivity checks and how to resolve overlaps with adjacent skills
- Collective-exhaustiveness checks within the declared scope
- When to split a skill, when to consolidate, and when neither is justified
- How to name a skill so its scope is legible from the directory name alone
- Section-length ceilings (~7 items per section, hard max 10) as a split signal

## Frontmatter and Naming

See [frontmatter-and-naming.md](./frontmatter-and-naming.md) for:

- Required fields (`name`, `description`) and their character limits
- Optional fields (`license`, `compatibility`, `metadata`, `allowed-tools`) and when each applies
- Host-project harness fields (non-spec frontmatter keys enforced by the local runtime, e.g., `user-invocable: false` for Claude Code) and the rules for preserving, applying, and porting them
- Kebab-case naming rules (1–64 chars, no leading / trailing / consecutive hyphens) and the parent-directory match
- Choosing a name that signals scope without leaking implementation detail

## Description Writing

See [description-writing.md](./description-writing.md) for:

- Imperative "Apply this skill when…" phrasing over "This skill does…"
- Covering both *what the skill does* and *when to apply it* in the same field
- Triggering-keyword discipline — listing user phrasings, including ones that don't name the domain
- The 768-character working target and 1024-character spec hard limit, plus the trim order when overshooting
- Common failure modes (too narrow, too broad, vague verbs, missing keywords)

## Body Content Style

See [body-content-style.md](./body-content-style.md) for:

- RFC-2119 keyword definitions (MUST / MUST NOT / SHOULD / SHOULD NOT / MAY / REQUIRED / RECOMMENDED) inlined for portability, plus the application rules for marking requirement levels
- Decision-language for design skills vs implementation-language for mechanics skills, and how to choose
- The "add what the agent lacks, omit what it knows" rule and how to spot dead weight
- Gotchas, defaults-not-menus, and calibrate-specificity-to-fragility patterns
- Precise verbs over vague ones — "handle", "manage", and "support" without a qualifier are anti-patterns

## Progressive Disclosure

See [progressive-disclosure.md](./progressive-disclosure.md) for:

- The two-level structure: a short `SKILL.md` index plus topical `.md` reference files in the same directory
- The ~500-line / ~5,000-token ceiling on `SKILL.md` and the one-level-deep file-reference rule
- When a split is legitimately justified and when it is busywork against a small skill
- The canonical wiring form — `See [file.md](./file.md) for:` followed by a bullet list of topics
- Stating an explicit triggering condition on every reference link so the agent knows *when* to load it

## Cross-Referencing and Index Sync

See [cross-referencing.md](./cross-referencing.md) for:

- Relative-path links between sibling skills (`../other-skill/SKILL.md`) and the no-content-duplication rule
- Stating the triggering condition on any cross-skill consultation rather than copying the rule across
- Keeping the host project's master skill index (e.g., `AGENTS.md` or `CLAUDE.md`) up-to-date when skills are added, renamed, moved, or removed
- Keeping the parent `SKILL.md` index up-to-date when reference files are added, renamed, or removed inside a skill
- Verifying every relative link resolves before finalizing the change
