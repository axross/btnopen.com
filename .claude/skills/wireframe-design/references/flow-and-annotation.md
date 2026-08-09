# Low-Fidelity Wireframe & Breadboard Design — Flow, Annotation & Consistency

Connecting screens into flows, annotating intent, and keeping a consistent visual language.

Part of the research-grounded best-practices set for this skill (see the skill's `SKILL.md` for the full routing). Each principle below is distilled from reputable design sources; the guideline bullets are the normative takeaways, and the MUST/SHOULD rules in `SKILL.md` remain authoritative.

## Design in connected flows, not isolated screens

The common failure mode is a wall of pretty, disconnected screens with no arrows and only the happy path drawn: it looks finished, hides every dead end, and defers the hard questions — what does the error say, where does Cancel go, what shows when the list is empty — to implementation, which is exactly where they are most expensive to answer.

A single screen tells you what a moment looks like; a wireflow tells you whether the task actually completes, because navigation, feedback, and error handling live in the transitions between screens, not on any one canvas. So the unit of work is not the screen but the task: pick one concrete goal (log in, submit a photo, recover a password), then lay out every unique screen and every significant state that goal passes through, connected in reading order ([wireflows](https://www.nngroup.com/articles/wireflows/), [combining wireframes with user flows](https://slickplan.com/blog/wireflow)). The arrows carry the meaning, so each must originate from the exact clickable hotspot — the specific button, field, or row — that drives the transition, because complex screens have many actionable targets and an arrow from the whole frame is ambiguous.

Keep the nodes cheap. A response to an action does not need a whole new screen — draw only the region that changes (a modal, a validation message under a field, a swapped list state, an inline confirmation), which keeps the diagram legible and forces you to be precise about what the system says back ([a beginner's guide](https://balsamiq.com/blog/wireflows/)). Show that system response inline at the point of interaction rather than trusting the reader to imagine it. Then branch: for each decision point, draw where the alternative paths go — invalid input, empty results, network failure, the user tapping Back instead of Continue, permission denied. These edge and error paths are the whole reason to build a wireflow early, because they surface missing screens and undefined states while they are still free to fix ([tracing every affordance to a place](https://sep.com/blog/breadboarding-a-simple-way-to-prototype/)).

Scope discipline matters as much as coverage. One wireflow equals one task; if a diagram sprouts three unrelated goals it has become a sitemap and stops being checkable ([wireframing](https://ixdf.org/literature/topics/wireframing)). Keep the fidelity low — boxes, labels, and arrows — so the artifact stays about flow and logic, not visual polish, and so teammates read it as a conversation piece rather than a spec.

**Good Example:**

> A "reset password" wireflow: an arrow from the email field's Submit button leads to a "check your inbox" state, a second arrow from an unrecognized email leads to an inline "no account found" error on the same screen, and a third from an expired link leads to a "request a new link" screen — all three paths drawn, each arrow rooted on the exact control that triggers it.

**Bad Example:**

> A board of a dozen polished login, home, and settings screens with no arrows between them, showing only successful entry — leaving the reviewer to guess what a wrong password shows, where "forgot password" goes, and what appears while the request is loading.

**Guidelines:**

- MUST scope each wireflow to one concrete task goal, splitting any diagram that spans unrelated goals into separate wireflows.
- MUST root every transition arrow on the specific control that triggers it — a named button, field, or row — never on the whole frame.
- MUST draw the alternative branch for each decision point — invalid input, empty results, network failure, permission denial, and Back — not only the success path.
- SHOULD render a system response as the single region that changes — a modal, inline error, or swapped list state — shown at the point of interaction rather than as a full new screen.

## Annotate intent as distinct, non-UI callouts

The failure mode is real at both extremes: too few notes ship a wireframe that looks self-explanatory but hides a branch the engineer then guesses wrong, while too many bury the signal and turn the mockup into an unreadable thicket of red. So annotate selectively — restrict notes to what genuinely raises questions, meaning dynamic or conditional content, business logic and calculation rules, non-standard or unfamiliar patterns, edge and empty states, accessibility behavior such as keyboard order and screen-reader announcements, and the concrete outcome of every primary CTA. Skip anything a competent reader infers on sight; a labeled "Submit" button that navigates to an obvious next screen needs no callout.

Annotations earn that space because a low-fidelity wireframe deliberately omits the very things a builder needs to get right: what happens on tap, where hidden logic branches, what an empty or error state looks like, and why a region is arranged the way it is. Keep that intent legible as a separate layer, never baked into the mockup where it could be mistaken for UI ([annotation guidelines](https://balsamiq.com/learn/annotations/), [a complete guide](https://decode.agency/article/wireframe-annotations/)). Render notes, numbered markers, and arrows in a single high-contrast color used nowhere else on the canvas — red is the industry-standard convention, though a distinct blue works if red would read as an error state — and reserve that color exclusively for the annotation layer so a reader can instantly separate "the thing" from "the note about the thing." Anchor callouts in the perimeter margins with leader arrows pointing inward, and number them so a distributed or asynchronous team can reference "note 3 on screen 2" without ambiguity; the numbers themselves must stand out in that same reserved color.

Write annotations while you wireframe, not after ([how to use them](https://balsamiq.com/blog/wireframe-annotations/)). The act of documenting a screen forces you to think the interaction through, and capturing the rationale in the moment preserves the "why" that is otherwise lost by review time. Keep each note to the minimum words that carry the point — a scannable phrase, not a paragraph — and pitch it at what the reader must build or decide: state the expected behavior and, where it clarifies a choice, the user benefit behind it ([wireframing](https://ixdf.org/literature/topics/wireframe), [in practice](https://www.smashingmagazine.com/2016/11/wireframe-perfectionist-guide/)). A useful filter for whether a note earns its place is whether it does one of three jobs: show a flow, convey a thought, or indicate a removal. Distinguish visual technique by meaning where it helps — solid arrows for the primary flow, dashed for alternative or edge paths ([wireflows](https://www.nngroup.com/articles/wireflows/)) — so the annotation layer itself communicates structure at a glance.

**Good Example:**

> A checkout screen with a numbered red marker in the right margin: "3 — On 'Place order', validate address async; on failure show inline error under the field, keep form data. Success → confirmation (screen 5)." A dashed red arrow traces the failure path back to the same screen.

**Bad Example:**

> Every element gets a note — "1: this is the logo", "2: nav bar", "3: primary button" — printed in the same gray as the wireframe strokes, so the self-evident labels drown out the one annotation that actually matters (the hidden pricing-tier logic) and nothing visually separates note from UI.

**Guidelines:**

- MUST render every annotation — notes, numbered markers, and leader arrows — in one high-contrast color reserved exclusively for the annotation layer and used nowhere else on the canvas.
- MUST anchor callouts in the perimeter margins with inward leader arrows and number them so a note is citable as "note 3 on screen 2".
- MUST restrict notes to what raises questions — dynamic or conditional content, business logic, non-standard patterns, edge and empty states, accessibility behavior, and each primary CTA's outcome — and MUST NOT annotate elements a competent reader infers on sight.
- SHOULD distinguish arrow style by meaning, using solid for the primary flow and dashed for alternative or edge paths, and keep each note to a scannable phrase stating the expected behavior.

## Keep a consistent visual language and reuse components

The common failure mode is accidental variation — a "Save" button drawn as a sharp rectangle on one screen and a rounded pill on the next, a card with a border here and a drop shadow there, image blocks that are crossed boxes on the home screen but grey fills on the detail screen. Each unintended difference implies a distinction that doesn't exist and quietly derails the review into questions about styling rather than structure and flow. It also breaks handoff: a developer or another designer can no longer trust that identical-looking things behave identically.

A wireframe is a shorthand language, and like any language it only communicates if the same mark always means the same thing — elements sharing shape, size, and weight are perceived as the same category ([similarity](https://www.nngroup.com/articles/gestalt-similarity/)), so a rectangle-with-an-X reads as "image" everywhere only if you never also use it for a video or a map. Settle a small vocabulary up front — a thick bar or horizontal rule for a header, a rectangle-with-an-X for image placeholders, a caret or chevron for dropdowns and disclosure, "greeked" horizontal lines (or lorem/Xs) for body copy, a plain rectangle for a button, a rounded pill for a chip — and apply it identically on every screen ([how to draw a wireframe](https://www.nngroup.com/articles/draw-wireframe-even-if-you-cant-draw/), [wireframing](https://ixdf.org/literature/topics/wireframe)). Because low fidelity strips out color and final type, this symbol grammar and consistent placement are almost the only cues a reviewer has to tell one region from another.

The high-leverage move is to reuse actual components rather than redraw them: build a header, tab bar, card, and empty-state once as a master/symbol/template, then instance it across screens so the nav is pixel-identical everywhere and one edit propagates to all ([practical tips](https://balsamiq.com/blog/practical-tips-for-better-wireframes/)). This is faster, and more importantly it makes flow legible — a reviewer recognizes "same header, new content below" instantly, which is exactly the mental model you want them holding during a walkthrough. Keep a real palette of your primitives (as the wireframe kit's component library does) so contributors pull from it instead of inventing. Consistency here is not only visual: keep terminology, label casing, control affordances, and spacing rhythm uniform too, since an inconsistent word or a button that changes shape reads as a different thing and forces the viewer to re-parse.

The corollary of similarity is difference: if two things are genuinely different, make them look different, and if they are the same, never let them drift. Reserve deliberate visual difference for real semantic difference (a primary action heavier than a secondary one), and let everything else stay boringly, reassuringly the same.

**Good Example:**

> Define an image placeholder once as a rectangle with an X through it and a header as a thick top bar, build the header as a reusable symbol, and instance that same symbol on the home, list, and detail screens so the nav is identical on all three.

**Bad Example:**

> The primary "Save" button is a sharp-cornered rectangle on the settings screen but a rounded pill on the profile screen, and image slots are crossed boxes in one place and plain grey fills in another — so reviewers start debating whether these are meant to be different controls instead of discussing the flow.

**Guidelines:**

- MUST define one primitive per meaning before drawing screens — a single mark for image placeholders, header, dropdown, body copy, button, and chip — and apply that same mark for that meaning on every screen.
- MUST build each repeated structure (header, tab bar, card, empty state) as one reusable symbol and instance it across screens rather than redrawing it, so shared regions stay pixel-identical and one edit propagates.
- MUST NOT let identical elements drift in shape, border, fill, casing, label wording, or spacing across screens, since each unintended difference implies a semantic distinction that does not exist.
- SHOULD reserve deliberate visual difference for real semantic difference, such as weighting a primary action heavier than a secondary one.
