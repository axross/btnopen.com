# Known Deviations from the Installed Skills

Apply this reference when an installed capability's rule appears to collide with this codebase, when an installed capability turns out to be wrong or silent on a case this repository hits, and when reviewing a change that looks like a skill violation.

Two different things route here, and they resolve the same way. A **deviation** is a collision — an installed capability requires one thing, this repository deliberately does another. A **gap** is an installed capability being wrong, outdated, or simply silent on a case that comes up here. Either way the installed skill is left exactly as it is, and the resolution is written down in this file.

That matters because an unrecorded deviation reads to the next agent, and to a reviewer, as a plain violation of a MUST rule, and an unrecorded gap gets rediscovered from scratch by whoever hits it next.

## Currently Recorded Deviations

**None.** No accepted deviation from an installed capability is recorded for this repository at present.

That is a real statement, not a placeholder: anything in this codebase that departs from an installed rule is a finding until it is recorded here. Do not read the empty register as licence to assume a departure was already blessed, and do not add an entry for a rule this repository merely has not exercised yet — a deviation is recorded when it is accepted, not when it is anticipated.

**Guidelines:**

- MUST treat a departure from an installed capability's rule as a finding while this section records no matching entry.
- MUST NOT add an entry here for a hypothetical or anticipated collision; an entry records a decision the human accepted, with its reason.

## Recording a New Deviation or Gap

Editing the installed copy is never how either is resolved. Every skill under `.claude/skills/` except `project-structure`, `visual-identity`, and `markdown-processing-guidelines` is installed from [`axross/skills`](https://github.com/axross/skills) and tracked in `skills-lock.json`; the next reinstall overwrites a hand-edit without reporting it. So the change is lost, and until it is lost it poses as a rule the library agrees with.

The two available routes are an issue on the upstream library, and a note here. They are not alternatives to pick between — an upstream issue is slow, and the local note is what keeps work moving until it lands.

**Guidelines:**

- MUST NOT edit an installed skill to fix a rule that is wrong, outdated, or missing; the edit does not survive a reinstall and misrepresents the library until it is discarded.
- MUST record a new deviation in the section above — the rule, the capability it departs from, and why it was accepted — rather than violating an installed skill silently.
- MUST resolve a gap in an installed capability by one or both of the two routes: an issue opened on [`axross/skills`](https://github.com/axross/skills) when the gap generalizes beyond this project, and a written note here saying what the capability states, what this repository does instead, and how to handle the case meanwhile.
- MUST obtain the human's go-ahead before opening an upstream issue — it is a public write on a repository this project does not own — and MUST record the gap locally in the meantime rather than leaving the finding to depend on that issue landing.
- MUST verify that a suspected gap is real by reading the installed skill's own text before routing it anywhere; a rule that turns out to be stated correctly is a compliance failure to own, not a defect to file.
- MUST continue the task that exposed the finding under the skill exactly as installed; routing a change never blocks the work, and never licenses acting as though the proposed rule were already in force.
- SHOULD name any upstream issue filed or left pending in the work's completion report, so the finding outlives the session that produced it.
