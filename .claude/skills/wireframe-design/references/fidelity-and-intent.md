# Low-Fidelity Wireframe & Breadboard Design — Fidelity & Intent

Why low fidelity earns its place, how rough to keep the aesthetic, and holding the whole set at one finish level.

Part of the research-grounded best-practices set for this skill (see the skill's `SKILL.md` for the full routing). Each principle below is distilled from reputable design sources; the guideline bullets are the normative takeaways, and the MUST/SHOULD rules in `SKILL.md` remain authoritative.

## Match fidelity to the question you are currently answering

Fidelity is not a single dial from "rough" to "polished" — it decomposes into at least four independent axes: interactivity (does it click through, or does a person simulate the response), visual refinement (does layout, spacing, and hierarchy approach the final look), functional scope (how many screens and paths actually exist), and content (real copy and data versus placeholders). Every axis you raise costs preparation time and, worse, buys premature commitment: a screen that looks finished stops getting critiqued. So the discipline is to name the one question you are answering right now and raise only the axis that question depends on, leaving the others deliberately crude. Validating that a checkout flow's logic holds together is an interactivity-and-scope question, answerable with gray boxes and lorem ipsum; deciding whether the primary button reads as primary is a visual question that needs real type and color on exactly the two or three screens where it matters.

Map the axes to the stage of thinking. Low-fi (regions, hierarchy, and flow — never brand color or final type) is for exploring alternative paths and pressure-testing that the underlying logic works; it is cheap enough to throw away, which is the point, because throwaway prototypes invite honest criticism where polished ones invite "ship it." Mid-fi raises interactivity and functional scope to answer navigation and information-architecture questions — Nielsen Norman's horizontal, T-shaped, and M-shaped prototypes let you build full depth in only the one or two sections a task exercises while leaving the rest as stubs, using distractor tasks to keep testers from noticing the seams. Reserve high-fi — real tokens, real content, pixel-accurate spacing — for the handful of key screens where a visual or branding decision is genuinely on the table, and for usability tests that need realistic system response so participants behave as they would with live software.

The common failure mode is coupling the axes: reaching for a full-color, fully-styled comp to answer a question that was really about flow or hierarchy. This wastes hours on visuals that the next round of structural feedback will invalidate, and it anchors reviewers and stakeholders on surface polish — they debate the shade of a button while the navigation model quietly stays broken. The inverse failure also exists: staying low-fi to evaluate a decision that actually depends on visual weight, contrast, or real content length, where a wireframe simply cannot answer the question and gives false confidence. The check before adding any fidelity: write down the decision this artifact must unblock, and if a given axis does not change that decision, keep it low.

**Good Example:**

> To test whether a three-step onboarding flow feels too long, build all three screens as gray-box wireframes with placeholder labels and working tap-through, but no color, real copy, or images — the only axes raised (interactivity and scope) are the ones the "does this flow drag" question depends on.

**Bad Example:**

> Producing a fully branded, pixel-perfect color comp of the settings screen just to decide where the "Log out" item should sit in the menu — a pure hierarchy question — so reviewers spend the session debating the accent color while the actual placement decision goes unmade.

**Guidelines:**

- MUST write down the single decision this artifact must unblock before raising any fidelity axis, and leave every axis that does not change that decision at low fidelity.
- MUST keep interactivity, visual refinement, functional scope, and content as independent axes, raising only the one or two the current question depends on rather than polishing them together.
- MUST NOT apply brand color, final type, real copy, or pixel-accurate spacing to answer a flow, hierarchy, or information-architecture question.
- SHOULD reserve high-fidelity real tokens and real content for the specific screens where a visual, branding, or content-length decision is genuinely on the table, or for usability tests needing realistic system response.

Sources: [UX Prototypes: Low Fidelity vs. High Fidelity — Nielsen Norman Group](https://www.nngroup.com/articles/ux-prototype-hi-lo-fidelity/) · [IA-Based View of Prototype Fidelity — Nielsen Norman Group](https://www.nngroup.com/articles/ia-view-prototype/) · [What Kind of Prototype Should You Create? — Interaction Design Foundation (IxDF)](https://ixdf.org/literature/article/what-kind-of-prototype-should-you-create) · [Low-Fidelity Prototyping: The Fastest Way to Make Better Design Decisions — Balsamiq](https://balsamiq.com/blog/low-fidelity-prototyping/) · [Wireframing: The Perfectionist's Guide — Smashing Magazine](https://www.smashingmagazine.com/2016/11/wireframe-perfectionist-guide/) · [Making Prototypes — GOV.UK Service Manual](https://www.gov.uk/service-manual/design/making-prototypes)

## Keep the aesthetic deliberately rough to invite honest critique

The mechanism is expectation-setting: an artifact that looks finished invites finished-work feedback, so a crisp, gridded, color-filled screen pulls reviewers toward font choices, alignment, and palette — and pulls executives toward "looks good, ship it." A deliberately rough surface (hand-drawn strokes, gray boxes, sketch-style borders) reads as obviously provisional, which lowers the perceived cost of change and gives permission to argue about structure, flow, and edge cases instead. Nielsen Norman Group notes the same effect on both sides of the table: users under-test polished mockups because they feel the design is "done" and hesitate to voice negative reactions, while designers themselves stay less wedded to a sketchy concept and more willing to throw it away. Keep expectations low on purpose so the critique lands where a wireframe can still absorb it.

Operationally this means committing to one visual vocabulary and holding the line: grayscale only (a few steps of gray plus a single accent used sparingly for "this is the active/primary element," never as brand color), plain rectangles for regions, and greeked or placeholder copy where the exact words are not the point. Omit real logos, icon sets, photographs, and pixel-exact dimensions — these are the cues that read as "final." Many tools ship a sketch/wireframe skin (Balsamiq's hand-drawn font, Excalidraw, a "wireframe" theme) precisely to enforce this signal; if you are hand-sketching, embrace the wobble rather than reaching for a ruler. Speed is part of the signal too: something drawn in minutes on a whiteboard visibly cost little, which is why it invites honest reactions.

Note one deliberate exception. Rough aesthetics apply to the styling layer, not to real content where realism changes the judgment — a wireframe that must reveal how long labels wrap, how a dense table scans, or how a sparse empty state feels should use representative content, not lorem ipsum, because there the fidelity of the data is the thing under review. Keep the boxes rough; make the words real when the words are what you are testing.

The common failure mode is fidelity creep: someone drops in the real brand blue "just to see it," aligns everything to a precise grid, or swaps gray blocks for the actual component library — and the review instantly shifts to "that's not our teal" and "the padding is off," burying the structural questions the wireframe was meant to surface. A close cousin is over-polishing a single option so it visibly out-competes the rougher alternatives beside it, biasing the comparison by finish rather than merit. If a stakeholder starts critiquing color or type on a wireframe, that is the signal the artifact looked too done, not that the feedback was wrong.

**Good Example:**

> A checkout flow shown as three gray-box screens in a hand-drawn sketch skin — greeked labels, a single dark-gray fill marking the primary "Pay" button, no logo or product photos — so the review centers on whether the address step should come before or after shipping options.

**Bad Example:**

> Rendering that same checkout in the real brand palette with the actual button component and a precise 8pt grid, which turns the review into "the blue is too saturated" and "the card padding is uneven" while nobody questions the step order.

**Guidelines:**

- MUST render wireframes in grayscale only, reserving a single accent shade to mark the active or primary element and never to stand in for brand color.
- MUST NOT introduce real logos, production icon sets, photographs, the actual component library, or a pixel-exact grid into a low-fidelity wireframe.
- SHOULD apply a sketch or hand-drawn skin and greeked placeholder copy so the surface reads as provisional, except where the exact wording is what the review must judge.
- MUST hold every compared option at the same rough fidelity so the review weighs structure and flow rather than finish.

Sources: [UX Prototypes: Low Fidelity vs. High Fidelity — Nielsen Norman Group](https://www.nngroup.com/articles/ux-prototype-hi-lo-fidelity/) · [How to Draw a Wireframe (Even if You Can't Draw) — Nielsen Norman Group](https://www.nngroup.com/articles/draw-wireframe-even-if-you-cant-draw/) · [Low-Fidelity Prototyping: The Fastest Way to Make Better Design Decisions — Balsamiq](https://balsamiq.com/blog/low-fidelity-prototyping/) · [Practical Tips for Creating Better Wireframes — Balsamiq](https://balsamiq.com/learn/articles/practical-tips-for-better-wireframes/) · [Wireframes are More than Greeking Text and Gray Boxes — GovWebworks](https://www.govwebworks.com/2017/03/07/wireframes-are-more-than-greeking-text-and-gray-boxes/) · [Low-Fidelity Prototyping: What Is It and How Can It Help? — Figma](https://www.figma.com/resource-library/low-fidelity-prototyping/)

## Aim for 'rough but solved' — incomplete in polish, complete in structure

The productive zone for a wireframe is "rough but solved": every screen, region, and transition the flow requires is present and accounted for, while the visual treatment of each region stays deliberately unfinished. The reasoning is asymmetric risk. Under-specified artifacts — a paragraph of prose, a single hero screen with no states — hide the hard structural questions (where does the empty state go, what happens on error, how does the user get back). Over-specified artifacts — pixel-aligned components, real type, brand color — invite premature debate about spacing and palette and manufacture a false sense of certainty about a structure nobody has validated yet. Shape Up names two tools for staying in the middle: breadboarding, which works out "how does it work" as places, affordances, and connection lines with no spatial layout at all, and fat-marker sketches, drawn with a stroke so thick that adding detail is physically impossible, which answer "what goes roughly where" without designing a UI.

Practically, "complete in structure" means the artifact resolves the flow's logic: the full set of screens/states (including empty, loading, error, and success), the navigation between them, the affordances a user acts on, and the decisions that branch the path. "Incomplete in polish" means you leave visual detail open on purpose — boxes and labels instead of components, greyscale instead of brand color, placeholder or Latin text instead of final copy, one or two weights instead of a type scale. The fat-marker constraint is the enforcement mechanism: if the tool can't render a 12px caption or a gradient, you can't burn time on it, and you also can't accidentally imply those choices are settled. Keep the sketch legible from across a room; if someone has to lean in to read it, you have drifted up in fidelity.

The common failure mode is jumping to the wrong level of fidelity — reaching for the pixel tool before the structure is solved, which is easy because polished output feels like progress. The tell is that you are adjusting alignment, corner radius, or shades of grey while a whole branch of the flow (the error path, the second screen, the back-navigation) is still missing. The opposite failure is real but rarer at this stage: a sketch so vague it dodges the structural question it was supposed to answer. Match fidelity to the risk you are retiring — if the 2D arrangement is itself the unsolved problem, a fat-marker sketch is right; if only the sequence of steps is at stake, breadboard it and skip the layout entirely.

**Good Example:**

> A checkout flow drawn as four grey-box screens (cart, address, payment, confirmation) with arrows between them and explicit empty-cart and payment-declined branches sketched in, all in a marker stroke too thick to render final type — every path is resolved, no color or font is decided.

**Bad Example:**

> A single pixel-perfect "payment" screen in brand blue with a real type scale and aligned card icons, while the declined-payment and post-purchase screens don't exist yet — polished on the one region, silent on the structure that actually carries risk.

**Guidelines:**

- MUST resolve every screen, state, and branch the flow requires — empty, loading, error, and success paths plus the navigation and back-paths between them — before refining any single region.
- MUST NOT decide brand color, final copy, or a type scale, instead rendering regions as greyscale boxes and labels with placeholder or Latin text and at most one or two weights.
- MUST NOT adjust alignment, corner radius, or shades of grey while any required branch, second screen, or back-navigation is still missing from the artifact.
- SHOULD match fidelity to the risk being retired — breadboard as places and connection lines when only the step sequence is unsolved, and reserve fat-marker sketches for when the 2D arrangement is itself the open question.

Sources: [Shape Up — Chapter 4: Find the Elements (Breadboarding & Fat Marker Sketches) — Basecamp (Ryan Singer)](https://basecamp.com/shapeup/1.3-chapter-04) · [Shape Up — Chapter 5: Risks and Rabbit Holes — Basecamp (Ryan Singer)](https://basecamp.com/shapeup/1.4-chapter-05) · [How To Succeed In Wireframe Design — Smashing Magazine](https://www.smashingmagazine.com/2020/04/wireframe-design-success/) · [How detailed should wireframes be? A guide to wireframe fidelity — Pixelfridge](https://www.pixelfridge.com/latest/how-detailed-should-wireframes-be-a-guide-to-wireframe-fidelity/)

## Keep fidelity uniform across the set

Fidelity is a signal in itself: people read polish as "this is decided" and roughness as "this is still open." When one screen carries a real brand color, a photographic hero, or final headline type while the rest of the set is grayscale boxes and placeholder lines, attention and comment gravitate to the polished patch. You end up debating a button's blue instead of whether the flow makes sense, and the genuinely unresolved regions get a free pass because nobody realizes they are unresolved. Holding every screen at one level of finish keeps the conversation on what the wireframe round is for — regions, hierarchy, and flow — and keeps feedback comparable from screen to screen.

Enforce this at the primitive level rather than per-screen: one neutral gray ramp, one placeholder type treatment (a single weight, no real headlines), boxes and lorem/lines for content, and greeked or blocked images rather than the real asset. If a control looks tappable-final on one screen it should look equally schematic everywhere. The most common failure mode is the accidental hi-fi element — a stakeholder's logo dropped in "just to show scale," a real screenshot pasted into an empty state, an icon set that is production-quality next to hand-drawn boxes. Each of these quietly raises the perceived fidelity of that one spot and pulls the eye. Watch especially for imported assets and copy-pasted fragments from prior high-fidelity work.

When a region really is unfinished or undecided, say so explicitly instead of leaving a blank or a half-drawn guess that reads as either "done" or "forgotten." Mark it — an "under construction" hatch, a labeled placeholder ("[chart TBD]", "content pending"), or a call-out — so its ambiguity is intentional and legible. This is the same instinct behind including distractor or filler content when testing a partial prototype: the deliberate marker prevents viewers from over-reading a gap. Uniform fidelity does not mean uniform completeness; it means the level of finish never accidentally implies more certainty than you have.

**Good Example:**

> Every screen in the set uses the same gray ramp, boxed images, and one placeholder type weight; the not-yet-designed reports panel carries a hatched "under construction — layout TBD" block so its emptiness reads as intentional.

**Bad Example:**

> Nine grayscale wireframes plus one screen with the real brand-blue primary button and a photographic hero, so the review spends its time reacting to that screen's color and imagery instead of the navigation model.

**Guidelines:**

- MUST hold every screen to one shared primitive set — a single neutral gray ramp, one placeholder type weight with no real headlines, and boxed or greeked images — so no screen reads as more decided than the rest.
- MUST NOT introduce a real brand color, photographic asset, production icon set, logo, or pasted high-fidelity screenshot into any screen of a wireframe set.
- MUST mark an unresolved region with an explicit placeholder — a hatched "under construction" block or a labeled call-out like "[chart TBD]" — rather than leaving a blank or a half-drawn guess.
- SHOULD audit imported assets and fragments copied from prior high-fidelity work before shipping the set, removing any element whose finish exceeds the schematic baseline.

Sources: [Paper Prototyping: A Cutout Kit — Nielsen Norman Group](https://www.nngroup.com/articles/paper-prototyping-cutout-kit/) · [IA-Based View of Prototype Fidelity — Nielsen Norman Group](https://www.nngroup.com/articles/ia-view-prototype/) · [Creating Polished Wireframes — Balsamiq](https://balsamiq.com/blog/polished-wireframes/)
