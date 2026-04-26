# Progressive Disclosure

Apply these rules when deciding whether to split a `SKILL.md` into reference files, how to wire those files, and when a small skill should remain a single file.

## Two-Level Structure

- A skill MUST consist of either (a) a single `SKILL.md` file, or (b) a short `SKILL.md` index plus topical `.md` reference files in the same directory.
- Reference files MUST live one level deep under the skill directory (`./topic.md`) — never in a nested subdirectory.
- The `SKILL.md` index SHOULD contain only an opening rule statement, a short scope/boundary note, and one H2 per reference file with a `See [...] for:` bullet list.
- Detail content MUST live in reference files, not in the index. The index's job is routing; routing files that also carry detail are doing two jobs poorly.

## Size Thresholds

- A `SKILL.md` SHOULD stay under ~500 lines and ~5,000 tokens — once it crosses that, the agent loses focus and overhead grows.
- A skill SHOULD split into reference files when its `SKILL.md` exceeds the size threshold, when a single H2 grows past 10 bullets, or when distinct sub-topics emerge that each merit their own list.
- A reference file SHOULD itself stay under ~500 lines for the same reason; if a reference file outgrows that, split it into siblings rather than nesting deeper.

## When NOT to Split

- A skill that fits comfortably in one file under the size threshold MUST NOT be split into reference files for stylistic symmetry with neighboring skills.
- A skill with only one reference file SHOULD be inlined back into `SKILL.md` — the indirection costs context for no benefit.
- A skill where the proposed split produces files of < ~30 lines each is over-fragmented; consolidate or pick a coarser axis.
- Progressive disclosure is a remedy for bloat. Apply it when there is bloat to remedy.

## Wiring Reference Files from the Index

- Each H2 in the index MUST correspond to exactly one reference file, and MUST use the canonical wiring form: a one-line `See [file.md](./file.md) for:` followed by a bullet list of the topics covered.
- The bullet list under each `See [...] for:` MUST enumerate the topics in the reference file precisely enough that the agent can decide whether to load it without guessing.
- Reference filenames MUST be kebab-case `.md` files matching their topic (`scoping-and-mece.md`, not `mece.md` or `Scoping.md`).
- The order of H2 sections in the index SHOULD reflect the order in which the agent would consult them on a typical task — most-frequently-needed first.

## Triggering Conditions on Reference Links

- Every `See [...] for:` bullet list SHOULD describe topics in concrete terms (`"the 1024-character limit"`, `"the canonical wiring form"`) rather than abstract ones (`"details"`, `"more information"`).
- When a reference file is only relevant in specific situations (e.g., "load this when the API returns a non-200 status"), the index MUST state that condition so the agent loads it on demand rather than up front.
- A reference link without a triggering condition forces the agent to either load it always (wasting context) or never (wasting the file). State the trigger.

## Anti-Patterns

- **Symmetry split**: Splitting a 60-line skill into five 12-line files because neighboring skills have five files. Cost: indirection without payoff.
- **Hidden requirement in the index**: Putting a normative `MUST` rule into the index instead of a reference file. Cost: the rule is loaded on every activation but never tagged with the topic that motivates it.
- **Detail leakage**: Letting the index repeat content that already exists in a reference file. Cost: duplicated content drifts; the agent gets two versions of the same rule.
- **Deep nesting**: Creating `./subtopic/file.md`. Cost: violates the one-level-deep rule and breaks tools that assume the flat layout.
