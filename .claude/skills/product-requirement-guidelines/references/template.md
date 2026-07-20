# Plan Document Template

Apply this reference as the starting skeleton for a plan document — the structure a spec or tracking-issue plan follows. It is self-contained: copy the skeleton, fill each slot per the sibling references, and delete the annotations (the italic notes) before publishing. Required sections appear in every plan; a conditional section is omitted only with a one-line stated reason, never silently.

**Guidelines:**

- MUST keep the section order and nesting exactly as the skeleton shows; the structure is canonical, not a suggestion.
- MUST fill every required slot, and either fill or explicitly omit-with-reason every conditional slot; do not leave a slot silently empty.
- MUST delete the italic annotations before the plan is considered final.
- SHOULD right-size the whole document to the change: a small fix keeps every section to a line or two; a cross-cutting feature earns full detail. See [problem-and-scope.md](./problem-and-scope.md#right-sizing-scope).

## Skeleton

Everything in `<…>` is a slot to fill, and everything in italics is an annotation to delete.

```markdown
## Summary

<One paragraph explaining the work and its goal, readable standalone — a reader who
stops here still understands what is being done and why.>
_(See problem-and-scope.md → Summary.)_

## Background

<Concise circumstances as bullets; add a mermaid diagram when it clarifies the
situation better than prose.>
_(See problem-and-scope.md → Background.)_

### Goals

- <A concise, achievable goal that explains the work's purpose.>

### Non-goals

- <A thing that could plausibly have been in scope, deliberately excluded, and why.>
_(See problem-and-scope.md → Non-Goals and Out-of-Scope.)_

### Assumptions

- <A belief the plan relies on that the reader might dispute. An unresolved blocking
  decision is asked, never silently assumed.>
_(See problem-and-scope.md → Assumptions vs. Open Questions.)_

## Functional requirements

_(Conditional — include when the work changes or adds user-observable behavior; for
behavior-preserving work, omit with a stated reason, e.g. "omitted: refactor, public
behavior unchanged".)_

- <A user-perspective requirement phrased as "what should be", not "what to do".>
_(See functional-requirements.md.)_

### UI design

_(Conditional — include only for view-affected changes; otherwise omit with a stated
reason. When the visual options exhibit runs, this section carries the per-round
design record: options presented, the option the human selected at each round, both
the wireframe and hi-fi design-artifact links, and the in-issue durable copies —
rules owned by the address skill's visual-design-options reference.)_

<Hierarchy, interaction states, accessibility and responsive intent, copy
constraints — in spec terms.>
_(See ui-design-framing.md.)_

### System design

_(Conditional — include for boundary-crossing or hard-to-reverse changes AND for
intricate minor-scoped mechanics where a diagram or snippet clarifies the mechanism;
otherwise omit with a stated reason.)_

<Key architecture/structure changes or the intricate mechanism, with a mermaid
diagram or clarifying code snippet.>
_(See architecture-overview-framing.md.)_

#### Alternatives considered

_(Conditional — include when a plausible competing approach exists.)_

- <A realistic alternative that was seriously evaluated, and why it was rejected.>
_(See architecture-overview-framing.md → Alternatives Considered.)_

## Non-functional requirements

_(Conditional — include when technical, architectural, or security constraints
matter beyond functional behavior; otherwise omit with a stated reason.)_

- <A measurable target, not an adjective — e.g. "at most one additional query per
  render", not "fast".>
_(See architecture-overview-framing.md → Non-Functional Requirements.)_

## Acceptance criteria

- <One observable happy-path behavior a reviewer can verify from the diff or the
  running UI without reading implementation code.>
- <One relevant edge/disabled/empty/error-state behavior.>
- <An explicit "X is unaffected" criterion, when this change sits next to something
  that must stay untouched.>
_(Plain bullets, not `- [ ]` checkboxes. Every criterion traces to the sections
above. See acceptance-criteria.md.)_

## Verification strategy

1. <An ordered, executable step showing the work is done — a command to run or an
   observable check to make.>
2. <The test coverage to add or update.>
3. <The verification gates the changed surface requires — format/lint, unit, e2e,
   build — and why any is skipped.>
_(For a bug: open with the steps to reproduce the defect, then the post-fix
expectation. See verification-strategy.md.)_

## Open questions

- <An unresolved, non-blocking item — TBD is legitimate here — or a known risk with
  its mitigation. "None" is a valid entry.>
_(See problem-and-scope.md → Assumptions vs. Open Questions and → Open Questions and
Risks.)_
```
