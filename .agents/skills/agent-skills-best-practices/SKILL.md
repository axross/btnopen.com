---
name: agent-skills-best-practices
description: Apply this skill whenever creating, refining, restructuring, renaming, or auditing an agent skill under the host project's skill root (e.g., `.agents/skills/`) - drafting a `SKILL.md`, splitting a skill into reference files, tightening a `description`, or deciding where a new rule belongs. Covers agentskills.io frontmatter, host-project harness fields, kebab-case naming, description writing for discovery, section anatomy with concise examples plus RFC-2119 guideline bullets, progressive disclosure, relative-path cross-references, audit checks, and keeping the host project's master skill index in sync.
---

# Agent Skills Best Practices

Apply this skill whenever creating, refining, splitting, consolidating, renaming, or auditing any agent skill under the host project's skill root.

This skill governs authoring discipline for skills written in the agentskills.io format. For the host project's active skill inventory and topic-to-skill routing, defer to the project's master skill index and the directory listing under the skill root.

## Scoping and MECE

This reference explains how to choose one coherent responsibility per skill, keep neighboring skills mutually exclusive, and decide whether new guidance belongs in an existing skill or a new one.

**Guidelines:**

- SHOULD read [scoping-and-mece.md](./scoping-and-mece.md) when deciding a skill boundary, skill name, split, consolidation, or source-of-truth location.
- MUST use its MECE checks before adding guidance that overlaps an existing skill.
- SHOULD use its section-length ceiling as an early signal that a skill or reference needs restructuring.

## Frontmatter and Naming

This reference covers the discovery-critical metadata in `SKILL.md` and the directory/name rules that let host runtimes find the skill reliably.

**Guidelines:**

- SHOULD read [frontmatter-and-naming.md](./frontmatter-and-naming.md) when creating or editing frontmatter, choosing a skill directory name, or porting harness-specific fields.
- MUST keep the `name` frontmatter field synchronized with the parent directory.
- SHOULD preserve host-project harness fields unless the porting target explicitly uses different runtime metadata.

## Description Writing

This reference shows how to write the `description` field so the agent can decide when to load the skill from discovery metadata alone.

**Guidelines:**

- SHOULD read [description-writing.md](./description-writing.md) when drafting, trimming, or auditing a skill description.
- MUST include both what the skill covers and when the agent should apply it.
- SHOULD include likely user phrasings and symptom-based triggers without broadening beyond the skill's actual scope.

## Body Content Style

This reference defines the required section shape for skill bodies and reference files: explain or demonstrate the topic first, then provide RFC-2119 guideline bullets.

**Guidelines:**

- MUST read [body-content-style.md](./body-content-style.md) when writing or revising any `SKILL.md` body or reference file.
- MUST structure every substantive section with a concise topic description or demonstration before its guideline list.
- MUST express requirement bullets with RFC-2119 keywords such as MUST, SHOULD, or MAY.

## Progressive Disclosure

This reference describes how to keep `SKILL.md` lean while moving detailed, topic-specific guidance into one-level-deep reference files.

**Guidelines:**

- SHOULD read [progressive-disclosure.md](./progressive-disclosure.md) when a skill is getting long, when reference files are proposed, or when an index needs rewiring.
- MUST keep the parent `SKILL.md` focused on routing when reference files exist.
- SHOULD avoid splitting small skills for symmetry alone.

## Cross-Referencing and Index Sync

This reference covers relative links between skills, avoiding duplicated rules, and keeping the host project's master index synchronized with skill changes.

**Guidelines:**

- SHOULD read [cross-referencing.md](./cross-referencing.md) when adding, renaming, moving, deleting, or linking skills or reference files.
- MUST make one skill the source of truth for a rule instead of copying the same rule across multiple skills.
- MUST verify relative links and master-index links before finalizing skill-tree changes.

## Audit Checklist

This reference provides the repeatable checks for a skill audit: inventory, index sync, section anatomy, RFC-2119 bullets, relative links, and content-level ownership review.

**Guidelines:**

- SHOULD read [audit-checklist.md](./audit-checklist.md) before auditing multiple skills or reporting skill-tree quality.
- MUST run or manually perform the structural checks when skill files are added, moved, renamed, or broadly rewritten.
- SHOULD use the content-review checklist to identify overlap, stale project assumptions, and missing source-of-truth links.
