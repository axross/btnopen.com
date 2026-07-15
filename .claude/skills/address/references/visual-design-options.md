# Visual Design Options

Apply this reference during `/address` Phase 1 whenever the run's work is UI-bearing. It defines how the plan's UI design section presents visual presentation options for the human to choose from, how the design record lives in the tracking issue, and how the chosen design stays findable through code review and preview-environment debugging. The spec-level *content* of a UI design section — hierarchy, states, accessibility, responsive intent — stays owned by the project's product requirement guidelines, and visual tone plus design-system vocabulary stay owned by the project's UI design principles; this reference owns only the options exhibit and its lifecycle.

## When the Exhibit Is Required

"UI-bearing" is the Response Approach classification already made at the start of Phase 1 — this reference adds no second taxonomy. The exhibit is about *visual presentation*: it is required when what a person sees changes in shape, arrangement, or treatment on any human-facing surface — the public website's appearance (layout, hierarchy, styling, imagery, motion), the application UI (pages, components, navigation, interactive states), or the admin presentation (Payload admin panel surfaces a human operates). It is not required when nothing visual changes: implementation-only refactors, data or content edits, behavior-only fixes with unchanged rendering, or pure copy rewording inside an unchanged layout.

**Guidelines:**

- MUST present the options exhibit for every UI-bearing plan, regardless of how small the visual change is — a spacing or color tweak still gets three directions, scaled down (three small sketches, a line of rationale each).
- SHOULD treat a change as UI-bearing when in doubt; a superfluous exhibit costs minutes, while an unchosen design costs a review round.
- MUST state the classification outcome in the plan either way: the UI design section opens the exhibit for UI-bearing work, and the plan's note explaining an omitted UI design section records that the work is not UI-bearing — so the reviewer sees the classification was made deliberately, not skipped.

## Constructing the Options

Three options exist to give the human a real decision, so distinctness is the quality bar: options that vary only accent color or corner radius are one design shown three times.

**Example (option skeleton inside the UI design section):**

```markdown
#### Option B — Split header (Recommended)

<sketch: fenced ASCII wireframe, Mermaid diagram, or attachment links>

Rationale: … (why this direction serves the requirement; why it is recommended)
Trade-offs: … (what it costs relative to Options A and C)
```

**Guidelines:**

- MUST present at least three options, labeled sequentially (`Option A — <short name>`, `Option B — …`), each differing in at least one structural axis — hierarchy, layout, or visual treatment — not merely in decoration.
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
| image      | brief                |
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

After the human decides the wireframe-level direction — or immediately, under the skip condition above — the run confirms the direction with high-fidelity designs presented the same way: recorded in the issue, decided through the plan-approval gate. The artifacts are rendered images (mockups, or screenshots of throwaway local renders), produced without touching the repository:

1. Build the mockup in a scratch location outside the repository checkout (the harness scratchpad).
2. Render or screenshot it, covering both themes and the viewports where the design differs.
3. Deliver the image files to the human in the turn output with self-describing filenames (`issue-79-option-b-dark-mobile.png`).
4. Ask the human, in the same message, to attach the files to the tracking issue.
5. After the human attaches them, reference each attachment URL from the UI design section under the option it belongs to, and check that each reference renders.

**Guidelines:**

- MUST carry high-fidelity artifacts as GitHub issue attachments only; MUST NOT commit design artifacts to the repository on any branch, and MUST NOT leave mockup or render files in the working tree.
- MUST route attachment upload through the human — the session cannot upload issue attachments itself — by delivering the files and requesting the attachment in one turn output.
- MUST reference every attachment URL from the issue's UI design section under its option heading; an artifact only delivered in chat, or attached but never referenced, does not count as presented.
- MUST re-enter the plan-approval gate after the high-fidelity round lands in the issue — high fidelity exists to be approved, not merely displayed.
- SHOULD render at least the recommended option in both light and dark themes, and at the viewport widths where its layout changes, per the project's UI design principles.
- SHOULD scale the round to the decision: confirming one decided direction needs one faithful rendering per meaningful variant, not three new directions.

## Recording the Choice and Revisions

The issue is the single design record. Anyone — the maintainer, the independent reviewer, a later agent session debugging a preview deployment — must be able to open the issue and see the current design, how it was chosen, and what it replaced.

**Guidelines:**

- MUST record the outcome in the UI design section when the human approves: mark the chosen option (`**Chosen:** Option B — <name>`) and keep its sketch or artifacts as the section's current design.
- MUST update the UI design section in place on every design revision during the plan phase, so the section always shows the current design state.
- MUST move superseded options and rounds into one collapsed `<details>` subsection titled `Design history` inside the UI design section, labeled by round (`Round 1 — wireframes`, `Round 2 — high fidelity`), and MUST NOT delete them.
- MUST keep the run's status block current with the pending design round (for example, `awaiting plan approval (design round 2: high fidelity)`).
- MUST re-enter the plan-approval gate after every revision: update the issue first, then stop and wait for `/address continue`.

## Design Links in the Pull Request

Code review checks the diff against the intended design; preview-environment debugging checks the deployed page against it. Both need the design without excavating the issue thread.

**Guidelines:**

- MUST link the chosen design from the pull request description when the work is UI-bearing: the tracking issue's UI design section and the chosen option's current attachment URL(s).
- MUST name the chosen option in the pull request body (for example, `Implements Option B — <name> from #<issue>`) so the reviewer knows which direction to hold the diff against.
- MUST update those links whenever a later design revision changes the chosen design after the pull request exists.
