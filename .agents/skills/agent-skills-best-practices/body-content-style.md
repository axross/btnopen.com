# Body Content Style

Apply these rules whenever writing the Markdown body of a `SKILL.md` or any reference file under the host project's skill root (commonly `.agents/skills/**`).

## RFC-2119 Keywords

Every requirement bullet in a skill MUST use one of the capitalized keywords below to mark its requirement level. The definitions follow [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119) and are reproduced here so the skill is self-contained — generated skills do not depend on a host project's index file repeating them:

- **MUST** (or **REQUIRED**) — absolute requirement of the specification.
- **MUST NOT** — absolute prohibition of the specification.
- **SHOULD** (or **RECOMMENDED**) — there may exist valid reasons in particular circumstances to ignore a particular item, but the full implications must be understood and carefully weighed before choosing a different course.
- **SHOULD NOT** (or **NOT RECOMMENDED**) — there may exist valid reasons in particular circumstances when the particular behavior is acceptable or even useful, but the full implications must be understood and the case carefully weighed before making any behavior described with this label.
- **MAY** (or **OPTIONAL**) — the item is truly optional.

Application rules:

- MUST capitalize the keyword when it carries the requirement-level meaning. Lowercase `must` / `should` in a bullet is prose, not a normative requirement.
- SHOULD reserve `MUST` / `MUST NOT` for non-negotiable rules; use `SHOULD` / `SHOULD NOT` for rules with legitimate exception cases; use `MAY` for genuinely optional behavior.
- A bullet without an RFC-2119 keyword SHOULD be a definition, an explanation, or a cross-reference — not a hidden requirement.
- When the host project also publishes an RFC-2119 reference (e.g., in `AGENTS.md`, `CLAUDE.md`, or a similar root index), MAY defer to that reference verbatim instead of duplicating the definitions in the skill — the definitions above are the fallback when no host reference exists.

## Decision-Language vs Implementation-Language

- A skill that governs **design decisions** (palette, taste, voice, scope) SHOULD be written in decision-language — what to choose, why, and when to choose otherwise.
- A skill that governs **implementation mechanics** (file naming, framework wiring, command sequences) SHOULD be written in concrete-procedure language — what to type, in what order.
- When a rule straddles both, MUST pick the dominant axis and put the rule in the matching skill; cross-reference the other skill rather than duplicating.
- Decision skills SHOULD NOT contain code snippets that prescribe syntax; mechanics skills SHOULD NOT contain rationale framed as taste.

## Add What the Agent Lacks

- MUST focus on what the agent would not know without the skill — project-specific conventions, non-obvious edge cases, the particular tools and APIs to use.
- MUST NOT explain general concepts the model already understands (what HTTP is, how PDFs work, what a database migration does).
- A bullet SHOULD pass the test "Would the agent get this wrong without this instruction?" — if the answer is no, cut it.
- If the entire skill fails this test (the agent already does the right thing without it), the skill itself is the dead weight; recommend deletion rather than maintenance.

## Gotchas, Defaults, and Calibration

- A skill SHOULD include a "Gotchas" section when there are environment-specific facts that defy reasonable assumptions; keep gotchas in the body the agent reads up front, not in a deferred reference file.
- When multiple tools or approaches are valid, the skill MUST name a default and mention alternatives briefly — never present a menu of equal options.
- The skill SHOULD calibrate prescriptiveness to fragility: prescriptive ("run exactly this command") for fragile sequences; explanatory ("verify SQL queries are parameterized") for tasks where multiple approaches succeed.
- The skill SHOULD favor procedures (how to approach a class of problems) over declarations (what to produce for a specific case).

## Precise Verbs

- MUST use precise, domain-anchored verbs. `format` / `lint` / `cite` / `route` / `merge` are concrete; `handle` / `manage` / `support` / `deal with` are anti-patterns when used without a qualifier.
- A bullet SHOULD be one sentence with one verb. If a bullet contains "and" between two distinct verbs, split it into two bullets.
- MUST NOT use hedging verbs (`might`, `could`, `try to`) inside a normative bullet — pair the requirement keyword with a definite verb.

## Section and Bullet Hygiene

- Every H2 SHOULD contain ~7 bullets and MUST NOT exceed 10 — see [scoping-and-mece.md](./scoping-and-mece.md) for the section-length ceiling rule.
- A bullet SHOULD fit on 1–3 lines; longer bullets SHOULD become either sub-bullets or a follow-up bullet for the rationale.
- Code examples SHOULD live inside the bullet they illustrate (sub-list with backticks) so the rule and the example travel together — do not place examples in a separate "Examples" appendix unless the section is reference material.
