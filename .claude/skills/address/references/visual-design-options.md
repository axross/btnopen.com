# Visual Design Options

Apply this reference during `/address` Phase 1 whenever the run's work is UI-bearing. It defines how the plan's UI design section presents visual presentation options for the human to choose from, how the design record lives in the tracking issue, and how the chosen design stays findable through code review and preview-environment debugging. The spec-level *content* of a UI design section — hierarchy, states, accessibility, responsive intent — stays owned by the project's product requirement guidelines, and visual tone plus design-system vocabulary stay owned by the project's UI design principles; this reference owns only the options exhibit and its lifecycle.

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

<sketch: fenced ASCII wireframe, Mermaid diagram, or attachment links>

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

- MUST embed every wireframe directly in the issue body, inside the UI design section, in a form GitHub renders without attachments: an ASCII sketch in a fenced code block or a Mermaid diagram (`flowchart` or `block-beta`), whichever draws the layout more clearly.
- MUST keep wireframes at breadboard fidelity — regions, hierarchy, flow; MUST NOT spend the wireframe round on colors, exact typography, or final copy.
- SHOULD add a one-line note per option on how its layout reflows at narrow viewports when the options genuinely differ there.
- MAY skip straight to a high-fidelity options round when the structural/layout pattern is already fixed (for example, the change restyles an existing arrangement) and the design-system/component context pins down what high fidelity looks like; MUST state in the UI design section that the wireframe round was skipped and why.

## High-Fidelity Round

After the human decides the wireframe-level direction — or immediately, under the skip condition above — the run renders the direction at high fidelity, presented the same way: recorded in the issue, decided through the plan-approval gate. The default ladder is a **wireframe options round (at least three) → pick a direction → high-fidelity confirmation (one render of the chosen direction)**. But the high-fidelity round is equally a first-class **options round** — at least three rendered candidates — when the human wants to compare the real treatment (type, color, spacing, density) across directions before committing; wireframes deliberately hide exactly those, so this is often the fidelity where the comparison matters most. Which shape a given high-fidelity round takes follows [Two Kinds of Design Round](#two-kinds-of-design-round). The artifacts are rendered images (mockups, or screenshots of throwaway local renders), produced without touching the repository and attached by the human, because the session cannot upload issue attachments itself:

1. Build the mockup in a scratch location outside the repository checkout (the harness scratchpad).
2. Render or screenshot it, covering both themes and the viewports where the design differs.
3. Deliver the image files to the human through the harness's file-delivery mechanism (in Claude Code, send the files in the turn output) with self-describing filenames (`issue-79-option-b-dark-mobile.png`), and in the same message ask the human to attach them to the tracking issue and resume with `/address continue` — pasting the generated attachment URLs in the resume message when the attachment landed anywhere other than the issue itself.
4. Set the status block to `awaiting attachment (design round N)` and end the turn — attachment is a human action; never poll or schedule a wake-up for it.
5. On resume, collect the attachment URLs (from wherever in the issue the human attached them, or from the resume message), verify the set, and reference each URL from the UI design section under the option it belongs to.

**Guidelines:**

- MUST carry high-fidelity artifacts as GitHub issue attachments only; MUST NOT commit design artifacts to the repository on any branch, and MUST NOT leave mockup or render files in the working tree.
- MUST route attachment upload through the human by delivering the files and requesting the attachment in one turn output, then going dormant in the `awaiting attachment (design round N)` status-block state.
- MUST treat a bare `/address continue` received in the awaiting-attachment state as "files attached" — collect and verify the URLs and update the issue — never as approval of a round that is not yet recorded there.
- MUST verify the attached set against the delivered filenames, and re-request any missing or mismatched file before referencing the URLs.
- MUST reference every attachment URL from the issue's UI design section under its option heading, and verify each referenced URL is a GitHub attachment URL that appears in the updated issue; an artifact only delivered in chat, or attached but never referenced, does not count as presented.
- MUST re-enter the plan-approval gate once the round is recorded in the issue — high fidelity exists to be approved, not merely displayed.
- MUST, at the wireframe-approval gate, tell the human that the next round will confirm the single chosen direction at high fidelity, and offer the alternative of a high-fidelity options round (at least three rendered candidates) — so the human opts into a single confirmation knowingly rather than by silent default.
- MUST run the high-fidelity round as an options round (at least three rendered candidates, one marked `(Recommended)`, per [Constructing the Options](#constructing-the-options)) whenever the human asks to compare directions, candidates, or examples at high fidelity — even after choosing a direction at wireframe fidelity — and record and approve the choice by the same rules as any options round.
- MUST present a confirmation round — one that renders an already-decided direction with no new fidelity or comparison decision requested — as that direction's renderings only: one faithful rendering per meaningful variant, no new options, no `(Recommended)` marker; bare `/address continue` approves the confirmation.
- SHOULD render at least the chosen (or recommended) option in both light and dark themes, and at the viewport widths where its layout changes, per the project's UI design principles.

## Recording the Choice and Revisions

The issue is the single design record. Anyone — the maintainer, the independent reviewer, a later agent session debugging a preview deployment — must be able to open the issue and see the current design, how it was chosen, and what it replaced.

**Guidelines:**

- MUST record the outcome in the UI design section when the human approves: mark the chosen option (`**Chosen:** Option B — <name>`) and keep its sketch or artifacts as the section's current design.
- MUST update the UI design section in place on every design revision during the plan phase, so the section always shows the current design state.
- MUST move superseded options and rounds into one collapsed `<details>` subsection titled `Design history` inside the UI design section, labeled by round (`Round 1 — wireframes`, `Round 2 — high fidelity`), and MUST NOT delete them.
- MUST keep the run's status block current with the pending design state (for example, `awaiting plan approval (design round 2: high fidelity)` or `awaiting attachment (design round 2)`).
- MUST re-enter the plan-approval gate after every plan-phase revision: update the issue first, then stop and wait for `/address continue`.
- MUST apply these same recording rules when a design revision arises after the pull request exists (for example, from human review comments): update the issue's UI design section in place, preserve the history, route new artifacts through the human, refresh the pull request's design links — and run the change as a Phase 4 round (back to draft if flipped, fresh independent review) rather than a plan-phase stop.

## Design Links in the Pull Request

Code review checks the diff against the intended design; preview-environment debugging checks the deployed page against it. Both need the design without excavating the issue thread.

**Guidelines:**

- MUST link the chosen design from the pull request description when the plan presented the options exhibit: the tracking issue's UI design section and the chosen option's current attachment URL(s). A plan whose exhibit was legitimately omitted has no design to link, and this section does not apply.
- MUST name the chosen option in the pull request body (for example, `Implements Option B — <name> from #<issue>`) so the reviewer knows which direction to hold the diff against.
- MUST update those links whenever a later design revision changes the chosen design after the pull request exists.
