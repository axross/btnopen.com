# Feature Support and Fallbacks

Apply this reference when reaching for a web platform feature that is not supported everywhere — deciding whether it needs a guard at all, what it degrades to, and whether that degradation has anyone left to serve. The environment conditions a style branches on live in [adaptive-styling.md](./adaptive-styling.md); what the browser itself understands is a different question with a different mechanism, and it is the one this reference answers.

## A Guard Is Earned by Interoperability, Not by Format or Age

The question a guard answers is not "is this feature new?" and not "is this a colour function, a layout property, an at-rule?" — it is "does every browser this project promises to support understand it?" Those come apart constantly, and a rule written from the first two ages into the wrong answer: a feature guarded because it felt novel stays guarded for years after every engine shipped it, while a feature adopted plain because it looked ordinary keeps breaking browsers the project still supports.

[Baseline](https://web.dev/baseline) is the lookup. It sorts a feature into **limited availability** (some major engine has not shipped it), **newly available** (all of them have, recently), or **widely available** (that has held for thirty months). But Baseline describes the whole web rather than your project, so it is one half of the decision — the other half is the project's own browser support matrix, which may be narrower than Baseline's bar or wider than it.

Baseline moves without telling anyone. A feature's status is looked up when a rule is written, not recalled.

**Guidelines:**

- MUST decide whether a feature needs a guard from its interoperability across the project's own browser support matrix, never from its syntax family, its novelty, or the fact that a neighbouring rule guards something else.
- MUST look up a feature's current status rather than recalling it, and MUST carry the source and the date wherever that status is written down; a status recorded without a date cannot be told from one that has since moved.
- MUST NOT guard a feature that is interoperable across the project's support matrix — the guard is then a branch nothing takes, and it drifts from the branch that runs because nothing exercises it.
- MUST treat a feature short of that matrix as a choice between guarding it, reaching for something else, or deciding deliberately to stop supporting the browsers it excludes; using it unguarded is none of the three.
- SHOULD keep the project's support matrix somewhere a reader can find it, since a rule that defers to a matrix nobody wrote down defers to nothing.

## A Fallback Needs a Reachable Audience

A fallback earns its second code path only if some browser both fails the guarded feature **and** still renders the surface that fallback serves. Where a **less** interoperable feature already gates that surface, no such browser exists: everything that would have taken the fallback has already dropped the enclosing block, and what is left reads as diligence while behaving as dead code.

So the test runs outward rather than inward. Before authoring a fallback, find the least interoperable feature standing between the value and the rendered page. If that is the feature you were about to guard, the fallback has an audience. If something outside it fails first, the fallback never runs.

**Example — a colour fallback inside a scoped stylesheet:**

> A project whose component styles are wrapped in `@scope`, as the module skeleton in [css-modules.md](./css-modules.md) prescribes, has made that at-rule the floor for every component rule it writes. A colour format supported more widely than `@scope` cannot then be the thing that fails first — a browser too old for the colour is already too old for the scope, and applies no component rule at all. An sRGB fallback for that colour buys a correctly coloured unstyled page, at the cost of a second declaration for every value in the ramp.
>
> On **2026-08-20** that was the actual ordering: [`oklch()`](https://web-platform-dx.github.io/web-features-explorer/features/oklab/) widely available since 2025-11-09 with floors at Chrome and Edge 111, Firefox 113, and Safari 15.4, against [`@scope`](https://web-platform-dx.github.io/web-features-explorer/features/scope/) newly available since 2026-03-24 with floors at Chrome and Edge 143, Firefox 146, and Safari 26.4. Re-check both before relying on the conclusion; the ordering is what matters, and either one can move.

**Guidelines:**

- MUST identify the least interoperable feature standing between a value and the rendered page before authoring a fallback for that value, and MUST NOT author one where something outside it fails first.
- MUST re-run that test when a surface gains a structural dependency; a fallback that was reachable when it was written stops being reachable the moment a less-supported feature is wrapped around it, and nothing reports the change.
- MUST say which of the two a fallback actually serves when a value is declared outside the construct that gates its consumers — a token declared at the root survives a dropped component block, so the fallback protects the global surfaces that read it and nothing else.
- SHOULD delete a fallback this test finds unreachable rather than keeping it as harmless redundancy: it costs a declaration per value at ramp scale, and it invites the next reader to trust a degradation path that does not exist.

## A Feature That Cannot Express a Fallback Is an Adoption Decision

Some features gate their own contents. A browser that does not parse `@scope` or `@layer` drops the whole block, so there is no unguarded state underneath left to degrade to — degrading would take a second stylesheet, not a second declaration. Features like these are not decided per use. They are adopted once, against the support matrix, and the decision is recorded where the next reader will find it.

That makes them the ones most worth checking rather than the least. They carry the largest blast radius — every rule inside, not one property — and they give the least warning, because the browser that fails them reports nothing and simply renders unstyled.

**Guidelines:**

- MUST check a block-gating feature against the project's own support matrix before adopting it, and MUST record that decision rather than leaving it implied by whichever stylesheet reached for it first.
- MUST NOT write an inline fallback under a construct that gates its own block; a browser that drops the block never reaches anything inside it, so the alternative has to sit outside the block or not exist.
- MUST treat a project whose matrix cannot accommodate such a feature as needing a different structure, not a degraded version of this one.

## Which Mechanism Answers Which Question

Two at-rules get confused because both read as conditions, and they answer different questions:

| The question                               | The mechanism |
| ------------------------------------------ | ------------- |
| Does this browser understand this syntax?  | `@supports`   |
| What does the environment have, or prefer? | `@media`      |

Answering a capability question with `@media` fails in the way that is hardest to see: the browser that cannot parse the feature also cannot satisfy the query, so it takes a branch for a reason unrelated to what the branch was testing, and the authored intent is nowhere in the result. [color-and-gamut.md](./color-and-gamut.md) works the instance out for colour, where the two sit side by side and answer genuinely different questions; [adaptive-styling.md](./adaptive-styling.md) owns which environment conditions belong in a media query at all.

**Guidelines:**

- MUST use `@supports` for what the browser understands and `@media` for what the environment has, and MUST NOT substitute either for the other.
- MUST test the declaration the guard actually protects rather than a proxy for it; a neighbouring property assumed to have shipped alongside it is an assumption, not a test.

## Interoperability and Consequence Are Separate Axes

Interoperability decides **whether** a guard is needed. Consequence decides **what the fallback has to do** once one is. They are independent, and answering only one of them produces the two failures this reference exists to prevent: a guard wrapped around a feature every supported browser understands, and an unauthored fallback under a feature whose absence collapses the layout.

A feature short of the support matrix whose absence costs a rounded corner needs no authored fallback — the un-featured rendering already is one. The same feature, where its absence hides a control or drops a column, needs that state authored deliberately and looked at. [css-modules.md](./css-modules.md) states the property-level form of the consequence axis for web stylesheets.

**Guidelines:**

- MUST answer both axes before writing a guard: interoperability decides whether one is needed at all, and consequence decides whether the un-featured state can be left to the cascade or has to be authored.
- MUST NOT read a guard elsewhere in the project as precedent for guarding a feature this test clears; each guard answers its own two questions, and a guard copied from a neighbour carries that neighbour's support landscape rather than this feature's.
