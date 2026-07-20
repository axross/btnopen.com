# Visual Design Options

Apply this reference during `/address` Phase 1 whenever the run's work is UI-bearing. It defines how the plan's UI design section (nested under Functional requirements in the plan-document structure) presents visual presentation options for the human to choose from, how the design record lives in the tracking issue, and how the chosen design stays findable through code review and preview-environment debugging. The spec-level *content* of a UI design section — hierarchy, states, accessibility, responsive intent — stays owned by the project's product requirement guidelines, and visual tone plus design-system vocabulary stay owned by the project's UI design principles; this reference owns only the options exhibit and its lifecycle.

## When the Exhibit Is Required

The exhibit triggers on the *visual axis* of the Response Approach's UI-bearing classification: it is required when what a person sees changes in shape, arrangement, or treatment on any human-facing surface — the public website's appearance (layout, hierarchy, styling, imagery, motion), the application UI (pages, components, navigation, interactive states), or the admin presentation (Payload admin panel surfaces a human operates). A plan can be UI-bearing without triggering the exhibit: pure copy rewording inside an unchanged layout still needs the UI design section's copy constraints, but presents no visual directions to choose between. Nothing-visual changes — implementation-only refactors, data or content edits, behavior-only fixes with unchanged rendering — never trigger it.

**Guidelines:**

- MUST present the options exhibit for every plan whose work changes visual presentation — shape, arrangement, or treatment — regardless of how small the change is: a spacing or color tweak still gets three directions, scaled down (three small sketches, a line of rationale each).
- SHOULD treat a change as visually-presenting when in doubt; a superfluous exhibit costs minutes, while an unchosen design costs a review round.
- MUST state the exhibit decision in the plan either way: the UI design section opens the exhibit when the trigger is met, and otherwise records why the exhibit is omitted (no visual change, or a UI design section omitted entirely for non-UI work) — so the reviewer sees the decision was made deliberately, not skipped.

## Two Kinds of Design Round

Every design round is either an **options round** or a **confirmation round**, and which of the two applies is set by **what the human asked to see**, not merely by whether a direction has already been picked:

- An **options round** presents at least three distinct candidates for the human to choose between (see [Constructing the Options](#constructing-the-options)). It covers the first design round (wireframe, or high fidelity under the skip condition) **and** any later round the human opens by asking to see candidates, examples, options, or alternatives at a fidelity or comparison axis not yet decided — even after they picked a direction at a lower fidelity. Asking to "see hi-fi examples" of a direction chosen only as a wireframe re-opens the decision at a fidelity the human has not yet compared, so it is an options round.
- A **confirmation round** renders a single already-approved direction to confirm it (see [High-Fidelity Round](#high-fidelity-round)). A round is a confirmation **only when** it renders the exact direction the human already approved **and** no new fidelity or comparison decision is being requested.

**Guidelines:**

- MUST classify a round as options-or-confirmation by what the human asked for: a request to compare candidates, examples, options, or alternatives at a fidelity or axis not yet decided is an options round (at least three candidates), regardless of whether a direction was already chosen at a lower fidelity.
- MUST treat a round as a confirmation only when it renders the exact already-approved direction and no new fidelity or comparison decision is on the table.
- **When in doubt whether a round is options or confirmation, present at least three candidates.** A superfluous option costs minutes; a missing one costs a round.

## Constructing the Options

These rules govern an *options round*; see [Two Kinds of Design Round](#two-kinds-of-design-round) for what makes a round an options round rather than a confirmation round. Three options exist to give the human a real decision, so distinctness is the quality bar: options that vary only accent color or corner radius are one design shown three times.

**Example (option skeleton inside the UI design section):**

```markdown
#### Option B — Split header (Recommended)

<sketch: fenced ASCII wireframe or Mermaid diagram>

Rationale: … (why this direction serves the requirement; why it is recommended)
Trade-offs: … (what it costs relative to Options A and C)
```

**Guidelines:**

- MUST present at least three options in every options round, labeled sequentially (`Option A — <short name>`, `Option B — …`), each differing in at least one structural axis — hierarchy, layout, or visual treatment — not merely in decoration.
- MUST give every option a sketch, a rationale of a few sentences, and its trade-offs relative to the other options.
- MUST mark exactly one option **(Recommended)** in its heading and justify the recommendation in its rationale.
- MUST ground every option in the project's UI design principles — visual identity, color tokens, spacing, motion, and theme behavior; an option that violates the design system is not a valid choice.
- MUST NOT pad the exhibit with a straw-man; every option must be one the run could genuinely implement.
- SHOULD keep each option compact enough to compare side by side — a heading, a sketch, and a handful of sentences.
- SHOULD note per option any accessibility or responsive implication that materially distinguishes it; the full accessibility and responsive intent is written for the chosen direction per the project's product requirement guidelines once the choice lands.

## Presenting Designs as Artifacts

Every design round — wireframe and high fidelity alike — is published as an **Artifact** (the harness's hosted-page feature; in Claude Code, the `Artifact` tool), so the human sees the design rendered rather than reading a raw sketch. The **Artifact is the source of truth for the design**: it carries the full-fidelity render, and it is what the UI design section and the pull request reference (see [Recording the Choice and Revisions](#recording-the-choice-and-revisions)). Because an Artifact is a private-by-default page that a reviewer or preview-debug agent without a claude.ai account cannot open, the **in-issue ASCII/Mermaid wireframe travels alongside it as the account-free fallback** — it renders in GitHub with no attachment and no account, so a reviewer who cannot open the Artifact still sees the intended layout. The two always travel together: the Artifact is the source of truth, and the in-issue wireframe is the fallback that guarantees the layout stays visible without claude.ai access.

**Guidelines:**

- MUST present every design round as a published Artifact — at both wireframe and high fidelity, for options rounds and confirmation rounds alike — and consult the harness's artifact-design guidance (in Claude Code, the `artifact-design` skill) before building the page.
- MUST shape the Artifact to the round: an options round renders its at-least-three candidates so they compare side by side, each labeled and carrying its rationale and trade-offs; a confirmation round renders the single already-approved direction. Cover both light and dark themes and the viewports where the design differs, and hold a wireframe Artifact to the same breadboard fidelity as its embedded sketch — regions, hierarchy, flow, not colors or final type.
- MUST keep the in-issue wireframe (ASCII or Mermaid) as the account-free fallback alongside the Artifact: embed it in the UI design section and reference the round's Artifact URL next to it. The Artifact is the source of truth; the in-issue wireframe exists so the reviewer bot and preview-debug agents can see the intended layout without a claude.ai account.
- MUST NOT treat publishing or viewing the Artifact as design approval; the plan-approval gate always runs against the design recorded in the issue, per [Recording the Choice and Revisions](#recording-the-choice-and-revisions).

## Wireframe Round

The first options round is at wireframe fidelity unless the skip condition below applies. A wireframe shows places, affordances, and flow — regions and their arrangement — not fonts, exact spacing, or final copy.

**Example (one option's sketch):**

```
+----------------------------------+
| header: title …                  |
+------------+---------------------+
| cover      | tags · date         |
| image      | brief               |
+------------+---------------------+
| body …                           |
+----------------------------------+
```

**Guidelines:**

- MUST embed every wireframe directly in the issue body, inside the UI design section, in a form GitHub renders without attachments: an ASCII sketch in a fenced code block or a Mermaid diagram (`flowchart` or `block-beta`), whichever draws the layout more clearly. This embedded sketch is the round's account-free fallback; also publish the wireframe as an Artifact — the source of truth — per [Presenting Designs as Artifacts](#presenting-designs-as-artifacts).
- MUST keep wireframes at breadboard fidelity — regions, hierarchy, flow — in both the embedded sketch and the Artifact; MUST NOT spend the wireframe round on colors, exact typography, or final copy.
- SHOULD add a one-line note per option on how its layout reflows at narrow viewports when the options genuinely differ there.
- MAY skip straight to a high-fidelity options round when the structural/layout pattern is already fixed (for example, the change restyles an existing arrangement) and the design-system/component context pins down what high fidelity looks like; MUST state in the UI design section that the wireframe round was skipped and why.

## High-Fidelity Round

After the human decides the wireframe-level direction — or immediately, under the skip condition above — the run renders the direction at high fidelity, presented the same way: published as an Artifact, recorded in the issue, decided through the plan-approval gate. The default ladder is a **wireframe options round (at least three) → pick a direction → high-fidelity confirmation (one render of the chosen direction)**. But the high-fidelity round is equally a first-class **options round** — at least three rendered candidates — when the human wants to compare the real treatment (type, color, spacing, density) across directions before committing; wireframes deliberately hide exactly those, so this is often the fidelity where the comparison matters most. Which shape a given high-fidelity round takes follows [Two Kinds of Design Round](#two-kinds-of-design-round). The **Artifact is the source of truth** for the round, and the run records it in the issue with no human upload step:

1. Build the high-fidelity mockup as a self-contained page in a scratch location outside the repository checkout (the harness scratchpad), following the harness's artifact-design guidance.
2. Publish it as an Artifact and present it to the human (in Claude Code, the `Artifact` tool) — the design's source of truth — covering both themes and the viewports where the design differs.
3. Reference that Artifact URL from the UI design section, under the option it belongs to, alongside an in-issue wireframe (ASCII or Mermaid) of the layout as the account-free fallback — the option's wireframe from the earlier round, or a freshly embedded sketch when the wireframe round was skipped — so a reviewer without claude.ai access still sees the intended layout.
4. Re-enter the plan-approval gate on the round as recorded in the issue: set the status block to `awaiting plan approval (design round N: high fidelity)` and end the turn — the human resumes with `/address continue` once they have reviewed it.

**Guidelines:**

- MUST NOT commit design mockups or renders to the repository on any branch, and MUST NOT leave mockup or render files in the working tree. (The published Artifact is the hosted-page source of truth, not a repository file — publishing it is expected and is not a repository commit.)
- MUST record the high-fidelity round as the round's Artifact URL (the source of truth) plus an in-issue wireframe of the layout (the account-free fallback — the earlier round's wireframe, or a freshly embedded ASCII/Mermaid sketch when the wireframe round was skipped), referenced together from the UI design section under the option each belongs to; there is no human PNG-attachment step. An Artifact only presented in chat but never referenced from the issue does not count as recorded.
- MUST re-enter the plan-approval gate once the round is recorded in the issue — high fidelity exists to be approved, not merely displayed.
- MUST, at the wireframe-approval gate, tell the human that the next round will confirm the single chosen direction at high fidelity, and offer the alternative of a high-fidelity options round (at least three rendered candidates) — so the human opts into a single confirmation knowingly rather than by silent default.
- MUST run the high-fidelity round as an options round (at least three rendered candidates, one marked `(Recommended)`, per [Constructing the Options](#constructing-the-options)) whenever the human asks to compare directions, candidates, or examples at high fidelity — even after choosing a direction at wireframe fidelity — and record and approve the choice by the same rules as any options round.
- MUST present a confirmation round — one that renders an already-decided direction with no new fidelity or comparison decision requested — as that direction's renderings only: one faithful rendering per meaningful variant, no new options, no `(Recommended)` marker; bare `/address continue` approves the confirmation.
- SHOULD render at least the chosen (or recommended) option in both light and dark themes, and at the viewport widths where its layout changes, per the project's UI design principles.

## Recording the Choice and Revisions

The issue is the single design record. Anyone — the maintainer, the independent reviewer, a later agent session debugging a preview deployment — must be able to open the issue and see the current design, how it was chosen, and what it replaced.

**Guidelines:**

- MUST record the outcome in the UI design section when the human approves: mark the chosen option (`**Chosen:** Option B — <name>`) and keep the round's Artifact URL (the source of truth) as the section's current design, with the option's in-issue wireframe referenced beside it as the account-free fallback.
- MUST record every design round in the UI design section as a per-round entry carrying: the round's fidelity level (wireframes, hi-fi), the options presented, the option the human selected at that level (or, for a confirmation round, that the wireframe selection was confirmed), and that round's Artifact URL — never only a bare chosen-option note.
- MUST keep both the wireframe round's Artifact URL and the hi-fi round's Artifact URL referenced from the UI design section at all times once each round exists — in the section's current design record, not only inside the collapsed design history — so humans and AI agents can open every round's designs from the issue even after the authoring session is archived.
- MUST update the UI design section in place on every design revision during the plan phase, so the section always shows the current design state.
- MUST move superseded options and rounds — their full sketches, Artifact links, and rationales — into one collapsed `<details>` subsection titled `Design history` inside the UI design section, labeled by round (`Round 1 — wireframes`, `Round 2 — high fidelity`), and MUST NOT delete them. The compact per-round decision trail (fidelity level, options presented, selection, Artifact URL) stays in the section's current record even for superseded rounds; only the detailed exhibit content collapses into history.
- MUST keep the run's status block current with the pending design state (for example, `awaiting plan approval (design round 2: high fidelity)`).
- MUST re-enter the plan-approval gate after every plan-phase revision: update the issue first, then stop and wait for `/address continue`.
- MUST apply these same recording rules when a design revision arises after the pull request exists (for example, from human review comments): update the issue's UI design section in place, preserve the history, update the Artifact so the linked page matches the current design, refresh the pull request's design links — and run the change as a Phase 4 round (back to draft if flipped, fresh independent review) rather than a plan-phase stop.

## Design Links in the Pull Request

Code review checks the diff against the intended design; preview-environment debugging checks the deployed page against it. Both need the design without excavating the issue thread.

**Guidelines:**

- MUST link the chosen design from the pull request description when the plan presented the options exhibit: the tracking issue's UI design section and the chosen option's Artifact URL (the design source of truth); the in-issue wireframe in that section is the account-free fallback for a reviewer who cannot open the Artifact. A plan whose exhibit was legitimately omitted has no design to link, and this section does not apply.
- MUST name the chosen option in the pull request body (for example, `Implements Option B — <name> from #<issue>`) so the reviewer knows which direction to hold the diff against.
- MUST update those links whenever a later design revision changes the chosen design after the pull request exists.
