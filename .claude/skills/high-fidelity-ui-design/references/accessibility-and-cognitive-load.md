# High-Fidelity UI & Visual Design — Accessibility & Cognitive Load

Focus, motion, assistive-technology semantics, reducing choices, and aesthetic integrity.

Part of the research-grounded best-practices set for this skill (see the skill's `SKILL.md` for the full routing). Each principle below is distilled from reputable design sources; the `**Guidelines:**` bullets are the normative rules for this topic.

## Provide a visible, high-contrast focus indicator and a logical focus order

Four failures recur here, and every one of them survives a review that only looks at the screen: outline: none set for aesthetics with nothing behind it, a ring so thin or low-contrast it disappears on a busy or dark surface, positive tabindex values that hijack the natural order, and boxes reordered visually while the source order stays untouched. A keyboard or switch user tracks their location on screen entirely through the focus indicator, so any one of the four makes the interface unusable for them even when every other pixel is polished.

Treat the ring as a real token rather than a browser default. Build it as a solid outline of at least 2px — doubled to ~4px if dashed or dotted, since the gaps eat into the contrasting area — driven by :focus-visible so it appears for keyboard traversal without flashing on every mouse click. Push it clear of the element with outline-offset so it reads as a distinct halo rather than a border tweak, and give it a shape that clears rounded corners. Because a single color cannot guarantee 3:1 on both light and dark grounds, the robust pattern pairs two contrasting layers — outline: 3px solid <ink> plus box-shadow: 0 0 0 6px <paper> — so one edge always contrasts ([designing conformant focus indicators](https://www.sarasoueidan.com/blog/focus-indicators/)).

The measurable bar it has to clear: a contrasting area at least as large as a 2px-thick perimeter of the component (for a w×h element, roughly 4w+4h CSS px), a 3:1 change between the focused and unfocused states of those same pixels, and 3:1 against whatever the ring sits on ([SC 2.4.13](https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html)). Two further criteria finish the job. Keyboard traversal must follow the visual reading order and preserve meaning ([SC 2.4.3](https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html)), which means DOM/source order has to match the layout you designed — CSS grid/flex order, absolute positioning, and visually-reordered two-column layouts each silently diverge the tab sequence from what the eye follows, so a user tabs from a field to something across the screen, then back. And sticky headers, bottom toolbars, and cookie bars must never cover the focused element ([SC 2.4.11](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html)), so leave scroll padding for it.

**Good Example:**

> A primary button on a dark surface shows, on keyboard focus, a 2px solid ring offset 2px outside its rounded corners plus a thin contrasting inner halo (outline: 2px solid + box-shadow ring), driven by :focus-visible so it never flashes on mouse clicks — and its 3:1 contrast holds against both the button fill and the page behind it.

**Bad Example:**

> A designer sets outline: none on all inputs to keep the mockup clean, leaving no visible focus state; worse, the visually top-right "Submit" is early in the DOM, so tabbing jumps there before the fields above it, and a sticky footer covers the focused field at the bottom of the scroll.

**Guidelines:**

- MUST render a keyboard focus indicator on every interactive control via :focus-visible, and MUST NOT set outline: none without substituting an equivalent visible ring.
- MUST specify the ring as a real token at least 2px thick (roughly 4px when dashed or dotted), offset outside the element with a shape that clears its rounded corners, so its contrasting area and 3:1 focused-versus-unfocused change meet SC 2.4.13.
- SHOULD pair two contrasting layers — e.g. a solid outline plus an offset box-shadow halo — so the indicator holds 3:1 against both the component and the ground behind it on light and dark surfaces.
- MUST match DOM/source order to the visual reading order and reserve positive tabindex values, and MUST leave scroll padding so sticky headers, toolbars, or banners never obscure the focused element.

Sources: [Button States: Communicate Interaction — Nielsen Norman Group](https://www.nngroup.com/articles/button-states-communicate-interaction/)

## Make motion optional, safe, and preference-aware

Reduce, do not delete. The mistake that looks like compliance is `@media (prefers-reduced-motion: reduce) { * { animation: none } }`, which strips the feedback that told a user their tap registered; its uglier twin respects the query on decorative flourishes while leaving the one nauseating full-screen parallax transition untouched because it was "the brand moment." Keep the timing, state changes, and affordances, and swap only the vestibular triggers — large translations, parallax, spin, zoom, and slide-in distance — for a cross-fade or a small (roughly 2–3%) scale, so the transition still communicates without moving the world ([designing with reduced motion](https://www.smashingmagazine.com/2020/09/design-reduced-motion-sensitivities/)).

That makes motion a real design token — duration, easing, distance, and trigger — specified the way color and type are ([animation and motion](https://web.dev/learn/accessibility/motion)). Default to safe primitives: opacity, color, and small transforms under about 200–300 ms with standard easing, treating large-distance, parallax, and continuous looping motion as opt-in effects that degrade gracefully. In the mockup, show both states side by side — the full-motion transition and its reduced-motion counterpart, plus the visible pause control on any auto-playing surface — so reviewers can see that the reduced path still conveys hierarchy, direction, and feedback.

Three criteria set the floor underneath that. Anything starting automatically, moving or blinking or auto-updating for longer than five seconds alongside other content needs a pause, stop, or hide control — carousels, auto-advancing hero banners, animated backgrounds, live tickers ([SC 2.2.2](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html)). Nothing may flash more than three times per second in a large, bright region (SC 2.3.1), and a toggle does not satisfy it, because a seizure can trigger faster than a user can reach the control — the safe design simply never crosses the threshold, with borderline cases verified in PEAT. And motion triggered by a user action should be disablable unless it is essential ([SC 2.3.3](https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions)), which is exactly what honoring reduce-motion delivers.

**Good Example:**

> A modal that slides up 24px and fades in over 200ms collapses under prefers-reduced-motion to a same-duration cross-fade with a 2% scale-in, so the open/close still reads without vertical travel; the auto-rotating hero carousel ships with a visible pause control and stops on focus or hover.

**Bad Example:**

> A global `@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation: none !important; transition: none !important } }` that also kills the button-press and loading-spinner feedback, paired with a full-screen parallax page transition that ignores the query entirely because it's the signature interaction.

**Guidelines:**

- MUST specify each animation's duration, easing, distance, and trigger as named tokens in the mockup rather than leaving motion unspecified.
- MUST render both the full-motion transition and its prefers-reduced-motion counterpart side by side, where the reduced path keeps the timing and state change but swaps translation, parallax, spin, and zoom for a cross-fade or a roughly 2-3% scale.
- MUST NOT collapse reduced-motion into a blanket `animation: none` / `transition: none` rule that strips press, loading, and focus feedback.
- MUST attach a visible pause, stop, or hide control to any surface that auto-plays, auto-advances, or loops longer than five seconds, and keep looping or flashing regions below three flashes per second.

## Use native semantics, labels, and structure for assistive tech

"A role is a promise" is the warning worth carrying out of this section ([APG, Read Me First](https://www.w3.org/WAI/ARIA/apg/practices/read-me-first/)): declaring role="button" or role="tab" obligates you to hand-build every keyboard interaction the pattern implies — Enter/Space activation, arrow-key roving tabindex, focus management — and incomplete ARIA is worse than none, because it overrides the real semantics with a broken contract. So reach for the native element that already carries the right role, state, and keyboard behavior — a button for actions, an anchor for navigation, real checkbox/radio/select inputs, headings and lists — before styling a div into a lookalike, and get focusability, keyboard handling, and state announcements for free. A mockup that looks correct can still be unusable, because assistive tech reads the semantic tree, not the pixels ([screen reader compatibility](https://webaim.org/techniques/screenreader/)).

The naming failure is equally invisible on screen. Every interactive control needs a programmatically determinable accessible name, and it must come from something durable — a visible, associated <label>, aria-label, or aria-labelledby — never a placeholder or a title tooltip alone ([labeling controls](https://www.w3.org/WAI/tutorials/forms/labels/), [label versus name](https://webaim.org/articles/label-name/)). Placeholders vanish the instant the user types and are skipped by many screen readers, so a placeholder-only field is announced as just "edit text," leaving the user with no idea what belongs there. Where a control has visible label text, that text must be part of its accessible name so voice-control users can address it by what they see ([SC 2.5.3](https://www.w3.org/WAI/WCAG21/Understanding/label-in-name.html)); icon-only buttons still need a real name even though nothing is visible. Design the label as part of the component, not as an afterthought.

Structure carries meaning too, and the failure there is CSS-only reordering: using order, grid placement, or absolute positioning to move a block visually while it stays early or late in the source, producing a reading and focus order that contradicts what the eye follows — screen readers and Tab traversal follow the source, not the repositioned layout. Use one logical <h1> per view and a properly nested heading outline (never skipping levels for visual sizing) plus landmark regions (header, nav, main, footer or their ARIA equivalents), so assistive-tech users navigate by heading and region rather than reading top to bottom. When native semantics genuinely fall short — a custom combobox, tabs, a modal — follow the matching [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/) pattern completely, including its specified keyboard interaction and focus behavior, and verify with an actual screen reader rather than trusting the visual alone.

**Good Example:**

> A filter control is a native <select> (or a menu button that follows the APG menu-button pattern with full arrow-key support), each field has a visible <label for> that stays on screen, and the icon-only "Delete" button carries aria-label="Delete invoice" so it is announced and reachable by voice command.

**Bad Example:**

> A styled <div onclick> plays the role of a button with no keyboard handler or role, and the search field relies on a "Search…" placeholder as its only label — so keyboard users can't reach it and screen readers announce a nameless "edit text."

**Guidelines:**

- MUST render each interactive control as the native element that carries its role, state, and keyboard behavior — button for actions, anchor for navigation, real checkbox/radio/select inputs, headings and lists — and reserve generic-element-plus-ARIA rebuilds for cases where no native element fits.
- MUST NOT declare an ARIA role such as role="button" or role="tab" without also building the complete keyboard interaction its APG pattern obligates — Enter/Space activation, arrow-key roving tabindex, and focus management — since incomplete ARIA overrides the real semantics with a broken contract.
- MUST give every control a programmatically determinable accessible name from a durable source — a visible associated <label>, aria-label, or aria-labelledby, never a placeholder or title tooltip alone — and include the visible label text in that name so voice-control users can address the control by what they see.
- MUST match DOM/source order to the visual reading order and structure each view with one logical <h1>, a heading outline that never skips levels for visual sizing, and landmark regions (header, nav, main, footer).

## Reduce and structure choices to lower cognitive load

The failure mode is designing for yourself. Designers sit in roughly the top 5% for the domain and routinely underestimate real users' spare capacity — the top quartile performs about 2.4× better than the bottom — so a screen that feels clean to the team reads as a wall of equal-weight choices to a first-time user. The tells in a real-token comp are specific: five buttons of identical visual weight, a settings screen exposing every toggle at once, dense forms with no grouping, three competing calls-to-action. Verify that a stranger can find the one intended action within a couple of seconds.

The mechanism is [Hick's Law](https://lawsofux.com/hicks-law/) — decision time rises with the number and complexity of options — so reduce the count of live choices, sequence the rest, and make the recommended path visually obvious. It hides one real tension worth stating: Hick's Law is about choices per decision, not raw item count. A long but scannable list the user filters by search, category, or recognition is fine; a handful of genuinely ambiguous, equal-weight options is not. [Jakob's Law](https://lawsofux.com/) compounds it — users spend most of their time in other apps, so matching platform conventions (iOS/Android navigation, standard control shapes, expected gesture affordances) lets recognition do the work instead of forcing users to learn your invention, and the burden of proof sits on any deviation.

The concrete levers are chunking, progressive disclosure, and a defaulted path. Working memory holds only about 4±1 chunks reliably — the older "7±2" figure is the outer, recognition-aided bound — and they fade in roughly 20 seconds ([short-term memory and usability](https://www.nngroup.com/articles/short-term-memory-and-web-usability/)), so group related fields, actions, and metadata into small labeled clusters rather than one flat list, and never make a user hold state in their head across a page load or step. Hide advanced or rarely-used options behind a secondary surface — an accordion, a "more options" toggle, a settings screen — so the primary screen shows only what most users need most of the time. Pre-select sensible defaults, give the primary action the single filled button while everything else stays secondary or tertiary, and prefer recognition over recall throughout ([usability heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/)): every extra element, divider, icon, and sentence competes for attention with the ones that matter.

**Good Example:**

> A mobile "create record" screen shows only the 3 required fields plus a single filled "Save" button, tucks optional metadata behind a "More options" accordion, and pre-fills status to the most common value — so the default path is one obvious tap.

**Bad Example:**

> A settings screen renders 14 toggles and 4 equal-weight outline buttons in one ungrouped column with no defaults and no visual hierarchy, forcing the user to read and weigh every option before doing the one thing they came to do.

**Guidelines:**

- MUST render one high-emphasis filled button as the single primary action per screen and demote every other action to secondary or tertiary weight.
- MUST group related fields, actions, and metadata into small labeled clusters rather than one flat equal-weight column, and pre-select the most common value for every defaultable control.
- SHOULD move advanced or rarely-used options behind a secondary surface such as an accordion, "more options" toggle, or settings screen so the primary screen shows only what most users need most of the time.
- MUST match iOS and Android platform conventions for navigation, control shapes, and gesture affordances, deviating only where the mockup documents a justification for the invented pattern.

## Invest in visual quality, but never let it mask usability failures

The [aesthetic-usability effect](https://www.nngroup.com/articles/aesthetic-usability-effect/) cuts both ways, and the second edge is the one that costs you. Polish earns tolerance for minor friction and creates a first impression that carries a user through small rough edges — which is exactly why real color, type, spacing, and state design deserve full investment rather than being treated as decoration. But attractive design forgives only small problems; it does not fix large ones, and it actively hides them during evaluation. Participants will praise a screen's colors or photography while failing the task in front of you, and they under-report friction because the surface reads as competent.

So stated satisfaction and a positive gut reaction are not evidence that a flow works ([aesthetic-usability effect](https://lawsofux.com/aesthetic-usability-effect/)). Weight behavior over opinion: watch task completion, error and recovery, hesitation, backtracking, and time-on-task, and treat any gap between "they said it was easy" and "they struggled" as a real finding to fix, not to explain away.

Practically, keep form subordinate to function. A comp should never dial up visual richness to paper over a confusing information hierarchy, an ambiguous primary action, an unreachable control, or a state you have not designed (empty, loading, error, permission-denied). And an accessibility shortfall is a usability failure that beauty cannot buy back — contrast below [4.5:1 for body text or 3:1 for large text and UI components](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html), targets under the ~44px/24px minimums, a focus order that breaks — one that disproportionately harms exactly the users least able to compensate. The common failure mode is shipping a screen that demos beautifully and tests poorly: stakeholders sign off on the render, the aesthetic halo suppresses the objections, and the underlying task defect ships intact. Guard against it by validating the hard states and the real interaction, not just the hero view.

**Good Example:**

> A settings screen tests beautifully but two of five users can't find "Delete account"; the team treats the failed task as the finding and restructures the hierarchy, keeping the polish but fixing the flow — then re-tests behavior, not opinion.

**Bad Example:**

> A high-fidelity dashboard wins stakeholder sign-off on its color and typography while its primary "Publish" action sits below the fold with 3:1 body contrast; the aesthetic halo suppresses objections and the unreachable, hard-to-read control ships as-is.

**Guidelines:**

- MUST invest full fidelity in the type scale, contrast ratios, spacing rhythm, and interaction states, because at high fidelity these change how the product is judged, not merely how it looks.
- MUST design and render every hard state — empty, loading, error, and permission-denied — rather than dressing up only the hero view.
- MUST NOT raise visual richness to compensate for a confusing hierarchy, an ambiguous or below-the-fold primary action, or an unreachable control.
- MUST meet WCAG contrast (4.5:1 body text, 3:1 large text and UI components) and minimum target sizes (~44px touch, 24px pointer), treating any shortfall as a usability failure that polish cannot offset.
