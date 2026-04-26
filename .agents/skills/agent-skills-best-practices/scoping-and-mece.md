# Scoping and MECE

Apply these rules when deciding what a skill covers, where its boundary sits against neighbors, and whether a new rule needs its own skill or fits inside an existing one.

## Coherent Unit

- A skill MUST encapsulate a single coherent unit of work that composes well with other skills — a unit that is loaded together, applied together, and revised together.
- A skill SHOULD be scoped so that the directory name alone signals its responsibility (e.g., `pdf-processing`, `code-review`).
- A skill SHOULD NOT bundle responsibilities from two different decision contexts (e.g., "design taste" and "CSS mechanics") into one skill — split them and cross-reference.
- A skill MUST NOT cover the same responsibility as another skill. When two skills both seem to own a rule, exactly one is the source of truth and the other cites it.

## Mutual Exclusivity

- MUST verify that no responsibility in a new or revised skill overlaps with any existing skill before finalizing.
- When a new rule lands in a contested region (e.g., a CSS rule that could fit either the design skill or the styling-mechanics skill), state the boundary explicitly and propose a single home.
- When neighbors begin to drift toward the same topic, MUST resolve the overlap by either (a) moving the rule to one skill and citing it from the other, or (b) sharpening the boundary in both skills' opening sentences.
- MUST NOT silently duplicate a rule across skills "for convenience" — duplicates rot independently.

## Collective Exhaustiveness

- Within a skill's declared scope, every reasonable responsibility SHOULD be addressed; gaps inside the declared scope are a defect.
- If a responsibility is in scope but unaddressed, either add it to the skill or narrow the skill's scope so the responsibility falls outside.
- A skill MAY explicitly list out-of-scope concerns at the top when the boundary is non-obvious — this prevents reviewers from filing "missing rule" complaints for things that intentionally live elsewhere.

## When to Split

- SHOULD split a skill when its `SKILL.md` exceeds ~500 lines or ~5,000 tokens (see [progressive-disclosure.md](./progressive-disclosure.md)).
- SHOULD split when a single H2 section grows past ~10 bullets or starts subdividing into multiple sub-topics that each merit their own list.
- SHOULD split when the skill's `description` field can no longer fit "what + when" in 1024 characters without omitting a triggering keyword.
- SHOULD NOT split a small, tightly-scoped skill into reference files for stylistic symmetry — progressive disclosure is a remedy for bloat, not a layout rule.

## When to Consolidate

- SHOULD consolidate two skills when their descriptions trigger on the same prompts and their bodies share more than a third of their content.
- SHOULD consolidate when one skill's only function is to forward to another via cross-references — the forwarding skill is dead weight.
- MUST keep the consolidation source-of-truth pick explicit; pick one skill to absorb the other and rewrite cross-references in the same change.

## Section-Length Ceiling

- A skill body section SHOULD contain ~7 bullets and MUST NOT exceed 10 without an explicit reason recorded in the section.
- A compulsion to exceed the ceiling is a signal to either (a) split the section into two H2s, or (b) move the long list into a reference file.
- The ceiling applies per H2 inside `SKILL.md` and per H2 inside each reference file independently.

## Naming Aligned with Scope

- The directory name MUST signal the skill's scope — a name that describes the *responsibility* (`code-review`) is preferable to one that describes the *actor* (`reviewer-skill`) or the *file type* (`security-skill`).
- When a refactor leaves the chosen name no longer reflecting the skill's scope, the skill SHOULD be renamed in the same change. For the kebab-case mechanics see [frontmatter-and-naming.md](./frontmatter-and-naming.md); for the cross-reference and index-sync steps see [cross-referencing.md](./cross-referencing.md).
- A name overlap with an existing skill (e.g., proposing `pdf-extraction` next to an existing `pdf-processing`) is a MECE warning sign, not a naming-style issue — resolve it by sharpening the boundary first and naming the result second.
