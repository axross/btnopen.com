---
name: agent-skill-authoring
description: The ability to author, structure, name, refine, split, and audit agent skills in the agentskills.io format under the host project's skill root (e.g., `.claude/skills/`). Covers capability framing (naming and voice that present a skill as an ability, not a document), frontmatter and invocation-control fields, kebab-case naming, writing `description`/`when_to_use` for discovery, section anatomy with concise examples plus RFC-2119 guideline bullets, progressive disclosure into reference files, topic-based cross-references, archetype skeletons for the project skills a scaffolding pass creates (structure, component, UI/design), and a runnable structure validator.
when_to_use: Apply whenever creating, refining, restructuring, splitting, consolidating, renaming, deleting, or auditing an agent skill — drafting a `SKILL.md`, editing frontmatter, tightening a `description`, deciding where a new rule belongs, running the structure validator, or refreshing a skill's discovery metadata. Use for "add a skill", "split this skill", "audit skills", "recast this skill as a capability", or any change to `SKILL.md` files or their references.
user-invocable: false
---

# Agent Skill Authoring

Use this capability whenever you create, refine, split, consolidate, rename, or audit an agent skill under the host project's skill root. It is what turns a durable convention into a well-formed, discoverable skill and keeps the skill tree coherent as it grows.

Skills authored here follow the agentskills.io format. For the host project's active skill inventory and topic-to-skill routing, defer to each skill's own `description`/`when_to_use` discovery metadata and the directory listing under the skill root; where a host also maintains a written index (e.g. `AGENTS.md`), keep it in sync too.

**Guidelines:**

- MUST run the bundled `scripts/check-skill.mjs` validator over every skill a change touches; it is the enforcement path for the frontmatter, naming, discovery length-cap, and reference-linkage rules this skill states nowhere else (see [audit-checklist.md](./references/audit-checklist.md)).
- SHOULD propose or implement a skill update when any task exposes a reusable convention, outdated guidance, a recurring review issue, or a missing project rule — skill maintenance happens when work reveals durable learning, not after every narrow fix.
- SHOULD skip skill maintenance when the work produced no generalizable learning, and state that it was skipped.

## Scoping and MECE

See [scoping-and-mece.md](./references/scoping-and-mece.md) for:

- choosing a coherent skill boundary, skill name, split, consolidation, or source-of-truth location
- checking overlap with neighboring skills before adding new guidance
- using section length and topic growth as signals for restructuring

## Capability Framing

See [capability-framing.md](./references/capability-framing.md) for:

- framing a skill as an ability the agent gains rather than a document it reads
- naming the activity a skill enables, and the document-style suffixes to avoid
- the voice of the `description` opening clause, the H1, and the opening paragraph
- recasting an existing guideline-style skill in a fixed order, without changing what it requires

## Frontmatter and Naming

See [frontmatter-and-naming.md](./references/frontmatter-and-naming.md) for:

- creating or editing discovery-critical `SKILL.md` frontmatter
- setting the invocation-control fields (`when_to_use`, `argument-hint`, `arguments`, `user-invocable`, `disable-model-invocation`) by skill archetype — guideline skill vs workflow entry point
- choosing the skill directory name and keeping it aligned with the `name` field
- porting or preserving host-project harness fields

## Description Writing

See [description-writing.md](./references/description-writing.md) for:

- drafting, trimming, or auditing the `description` and `when_to_use` fields
- splitting what the skill covers (`description`) from when to apply it (`when_to_use`), within the length caps
- adding likely user phrasings and symptom-based triggers without over-broadening the skill

## Body Content Style

See [body-content-style.md](./references/body-content-style.md) for:

- writing or revising substantive skill-body or reference-file sections
- balancing concise topic explanation, examples, and guideline bullets
- placing normative RFC-2119 requirement bullets in detailed reference content rather than parent routing sections

## Progressive Disclosure

See [progressive-disclosure.md](./references/progressive-disclosure.md) for:

- deciding when a skill should stay single-file or split into `references/`
- the size thresholds that signal a skill or reference file has grown too large
- using the parent routing-section format: `## Topic`, `See [file.md](./references/file.md) for:`, then descriptive situation bullets
- keeping parent routing bullets free of RFC-2119-style requirement keywords so they remain routing cues, not duplicated rules

## Cross-Referencing and Discovery

See [cross-referencing.md](./references/cross-referencing.md) for:

- adding, renaming, moving, deleting, or linking skills and reference files
- choosing one source of truth instead of copying detailed rules across skills
- using topic-based cross-skill references, verifying intra-skill relative links, and keeping skill discovery current (plus any written index a host maintains)

## Project Skill Archetypes

See [project-skill-archetypes.md](./references/project-skill-archetypes.md) for:

- creating the project-specific skills a scaffolding pass calls for: structure, component, and UI/design
- the three-way ownership triangle and each archetype's skeleton, topics checklist, or table patterns
- growing archetype skeletons with worked examples and mechanical boundary checks

## Auditing and Validation

See [audit-checklist.md](./references/audit-checklist.md) for:

- auditing multiple skills or reporting skill-tree quality
- running the bundled structure validator (`scripts/check-skill.mjs`) to check frontmatter, naming, discovery length caps, reference linkage, and routing-section format mechanically
- checking inventory, skill discovery, section anatomy, RFC-2119 bullets, topic-based cross-skill references, and relative links
- identifying overlap, stale assumptions, orphan references, and missing source-of-truth links
