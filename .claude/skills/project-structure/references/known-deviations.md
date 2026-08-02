# Known Deviations from the Installed Skills

Apply this reference when an installed capability's rule appears to collide with this codebase, when an installed capability turns out to be wrong or silent on a case this repository hits, and when reviewing a change that looks like a skill violation.

Two different things route here, and they resolve the same way. A **deviation** is a collision — an installed capability requires one thing, this repository deliberately does another. A **gap** is an installed capability being wrong, outdated, or simply silent on a case that comes up here. Either way the installed skill is left exactly as it is, and the resolution is written down in this file.

That matters because an unrecorded deviation reads to the next agent, and to a reviewer, as a plain violation of a MUST rule, and an unrecorded gap gets rediscovered from scratch by whoever hits it next.

## Currently Recorded Deviations

One deviation is recorded, below. The register is exhaustive, which is what makes it useful: anything in this codebase that departs from an installed rule and is not listed here is a finding. Do not read the register as licence to assume an unlisted departure was already blessed, and do not add an entry for a rule this repository merely has not exercised yet — a deviation is recorded when it is accepted, not when it is anticipated.

**Guidelines:**

- MUST treat a departure from an installed capability's rule as a finding while no entry below matches it.
- MUST NOT add an entry here for a hypothetical or anticipated collision; an entry records a decision the human accepted, with its reason.

### Feature-agnostic modules are grouped by kind under `app/(app)/_/`

The Next.js app development capability's project-structure reference requires modules under the source root to be grouped by the domain they serve — a MUST — and forbids the alternative outright: `components/`, `hooks/`, `utils/`, or `queries/` directories MUST NOT be the application's primary organizing axis. Per-kind subdirectories belong *inside* a domain directory in that model, never above one, and two cross-cutting tiers — `common/` for portable primitives, `core/` for app-wide infrastructure — sit beside the domains.

This repository organizes its shared tier the other way. Feature-agnostic modules live in `app/(app)/_/` split by kind — `components/`, `helpers/`, `repositories/`, `translations/` — while feature-specific modules stay route-local in underscore-prefixed folders such as `_components/` under the owning route directory. There are no domain directories, no `common/`, and no `core/`. [directory-structure.md](./directory-structure.md) states that layout as this repository's own MUST, and [placement-and-naming.md](./placement-and-naming.md) routes new files into it.

The departure was accepted in axross/btnopen.com#185, the refresh that hardened the capability's grouping guidance from a SHOULD into the MUST/MUST NOT pair. Two things made keeping the layout the better answer. The capability itself requires a restructure to be its own change with its own review rather than a side effect, so adopting the domain axis is a migration to schedule, not a rule to comply with in passing. And the shape of this codebase does not reward the split: the routable surface is one content type with its comments, while most of `app/(app)/_/` is cross-cutting machinery — markdown rendering, i18n, media, embeds, analytics — that would land in a portable tier rather than in any domain. The by-domain axis would yield one thin domain directory beside a large `common/`, which buys none of the blast-radius clarity the rule exists to create.

Nothing else in that capability is affected. Its source-root rule already blesses this repository's repository-root `app/`, and its thin-route-file, no-queries-in-route-modules, and `server-only` fencing rules apply here unchanged — only the grouping axis beneath the source root diverges.

**Guidelines:**

- MUST place a new feature-agnostic module under `app/(app)/_/` by kind, and a new route-specific module in the owning route's `_components/`, exactly as this repository's own structure conventions state.
- MUST NOT introduce a `src/` source root, a `common/` tier, a `core/` tier, or a top-level domain directory in order to satisfy the installed capability; doing so would split the codebase across two conventions.
- MUST NOT report a by-kind placement under `app/(app)/_/` as a review finding against the installed capability's grouping rules; every other rule in that reference still applies in full.
- SHOULD treat a proposal to adopt the domain axis as a standalone migration with its own issue, plan, and review — never as part of a change that happens to touch the affected files.

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
