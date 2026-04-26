# Cross-Referencing and Index Sync

Apply these rules whenever a skill cites another skill, whenever a reference file is added or renamed inside a skill, or whenever a skill itself is added, renamed, moved, or removed.

## Relative-Path Links

- Cross-skill references MUST use relative paths from the citing file (`../other-skill/SKILL.md`, `../other-skill/topic.md`).
- Within-skill references MUST use the leading-dot relative form (`./topic.md`), never an absolute or bare name.
- MUST NOT use absolute paths from the repo root (e.g., `/.agents/skills/other-skill/SKILL.md` under a Claude Code / VS Code skill root) for cross-skill links — they reduce portability when the skill directory is relocated.
- References to repo-root documents (e.g., the host project's master skill index — commonly `AGENTS.md` or `CLAUDE.md`) are the one exception; link them with a leading-slash absolute path so they resolve from any depth in the skill tree.

## No Content Duplication

- A rule MUST live in exactly one skill. When two skills both seem to need it, pick a source of truth and have the other skill cite it.
- MUST NOT copy a rule's wording across skills "for convenience" — duplicates rot independently and produce contradictions over time.
- When a citing skill needs the *gist* of a rule for context, the citing skill SHOULD give a one-line summary plus a link to the source of truth, never the full rule.

## Triggering Conditions on Cross-Skill Links

- Every cross-skill link MUST state the condition under which the agent should consult the linked skill (`"Consult X when the change touches the routing layer"`).
- A bare cross-reference without a triggering condition (`"See X for more"`) forces the agent to guess whether the link is relevant; replace it with a concrete trigger.
- The triggering condition SHOULD be specific enough that the agent can decide *not* to follow the link when the condition does not apply.

## Master Skill Index Sync

The host project typically maintains a master index file at the repo root that routes topics to skills (commonly `AGENTS.md`, `CLAUDE.md`, or a similar name). Apply the rules below against whichever file the host project uses.

- MUST update the master skill index whenever a skill is added, renamed, moved, or removed. Broken index links are a routine failure mode after a skill rename or deletion.
- MUST add a new skill to the appropriate role/topic section in the master index (e.g., "For Developer", "For Code Reviewer", or whatever taxonomy the host project uses) when the skill is meant to be invoked from that role.
- MUST NOT leave the master index pointing at a deleted or renamed skill — verify by following every link the change touches.
- Adding a new reference file *inside* an existing skill MUST NOT require a master-index edit; the master index links to top-level `SKILL.md` files only, not to reference files within a skill.

## Parent SKILL.md Sync

- When adding or renaming a reference file inside a skill, MUST update the parent `SKILL.md` in the same change — the index MUST reflect every reference file, and every reference file MUST be referenced.
- When a skill's `description` frontmatter no longer matches its content (e.g., a new reference file adds a topic the description doesn't mention), MUST refresh the description in the same change.
- An orphan reference file (a `.md` file under the skill directory not linked from `SKILL.md`) MUST be either wired into the index or deleted — orphans are dead weight.

## Link Resolution Check

- Before finalizing a change that touches cross-references, MUST verify every relative link resolves on disk; broken links silently degrade the agent's behavior.
- Renaming a skill MUST update, in a single change: the directory, the `name` frontmatter field, every relative-path reference inside other skills, the host project's master skill index, and any subagent or role-profile definitions the host harness keeps alongside the skills (e.g., `.claude/agents/` for Claude Code).
- A rename SHOULD include a list of touched files in the changelog so future audits can confirm completeness.
