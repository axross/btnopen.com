# High-Fidelity UI & Visual Design — Interaction, States & Feedback

Touch targets, interactive affordances, complete state sets, disabled-vs-error, and response-time-matched feedback.

Part of the research-grounded best-practices set for this skill (see the skill's `SKILL.md` for the full routing). Each principle below is distilled from reputable design sources; the `**Guidelines:**` bullets are the normative rules for this topic.

## Size and space touch targets for real fingers

A tap that misses is a rage-tap, and a mockup that looks clean at 100% zoom can still be unusable because the design tool never simulates a fingertip. The fingertip pad is roughly 8-10mm wide, which is why the platforms converge on physical minimums of about 9mm: iOS asks for 44x44pt, Material 3 for 48x48dp, and WCAG 2.5.8 (AA) sets an absolute floor of 24x24 CSS px for pointer targets. Treat these as floors, not goals — when the values disagree, honor the larger one (48dp comfortably clears both the iOS and WCAG minimums). WCAG's 24px is a legal minimum with escape hatches (inline text links, an equivalent full-size control elsewhere, or sufficient spacing), not a design target; a real button should still land at 44-48.

The number that matters is the tappable area, not the visible glyph. A 24dp icon becomes a valid target only when padding grows its hit area to 44-48; in the mockup, show that hit area explicitly (a highlighted/inspectable box) so it survives handoff, because an engineer who reads only the visible bounds will ship an under-target control. React Native's `hitSlop` and web's transparent padding both extend the tappable region past the drawn pixels — annotate it rather than leaving it implicit. Keep at least ~8dp of clear space between adjacent targets; WCAG's spacing exception formalizes this as a 24px undisturbed circle centered on each small target that must not overlap a neighbor.

Fitts's Law explains where to spend the extra size: acquisition time rises with distance and falls with target width, and screen edges/corners are effectively infinite-width because the finger can't overshoot them. So enlarge primary actions and place high-frequency or destructive controls where they're easy and safe to hit, while giving destructive actions extra separation from their neighbors so a fat-finger miss doesn't delete something. The common failure mode is a dense row of 24-32dp icon buttons — share/edit/delete crammed together — that measures fine visually but produces mistaps in the hand; the fix is 44-48 targets with 8dp gaps, even if the icons themselves stay small.

**Good Example:**

> A toolbar's 24dp trash icon is wrapped in padding to a 48x48dp hit area, spaced 8dp from its neighbors, and the mockup annotates that 48dp box so the spec carries the tappable region, not just the glyph.

**Bad Example:**

> A card footer packs share, edit, and delete as three 28dp icon buttons butted together with ~2dp between them — visually tidy, but on-device the fingertip overlaps two targets at once and users mistap delete.

**Guidelines:**

- MUST size every interactive control to a tappable area of at least 44x44pt (iOS) or 48x48dp (Material), honoring the larger minimum when platform targets disagree and never treating WCAG's 24px floor as the design target.
- MUST grow an icon or text control's hit area to the minimum target with padding or hitSlop when the visible glyph is smaller, and annotate that tappable box explicitly in the mockup so the spec carries the hit region rather than the drawn bounds.
- MUST keep at least 8dp of clear space between adjacent targets, and give destructive actions extra separation from their neighbors so a fat-finger miss cannot trigger them.
- SHOULD enlarge primary actions and anchor high-frequency or destructive controls to screen edges and corners per Fitts's Law, rather than cramming equal-weight icon buttons into a dense row.

Sources: [Touch Targets on Touchscreens — Nielsen Norman Group](https://www.nngroup.com/articles/touch-target-size/) · [UI Design Dos and Don'ts — Apple Developer (Human Interface Guidelines)](https://developer.apple.com/design/tips/) · [Touch target size — Google / Android Accessibility Help](https://support.google.com/accessibility/android/answer/7101858?hl=en) · [Accessibility designing — Material Design 3](https://m3.material.io/foundations/designing/structure) · [Understanding SC 2.5.8: Target Size (Minimum) — W3C Web Accessibility Initiative (WAI)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) · [Accessible Target Sizes Cheatsheet — Smashing Magazine](https://www.smashingmagazine.com/2023/04/accessible-tap-target-sizes-rage-taps-clicks/) · [How to Use Tappability Affordances — Interaction Design Foundation (IxDF)](https://www.interaction-design.org/literature/article/how-to-use-tappability-affordances) · [Fitts's Law — Laws of UX (Jon Yablonski)](https://lawsofux.com/fittss-law/)

## Make interactive elements look interactive and avoid false affordances

An affordance is what an element lets you do; a signifier is the perceivable cue that advertises it. In flat, high-fidelity UI the signifiers are all you have — there is no bevel doing the work for you — so clickability must be carried deliberately by a stack of cues: distinct color or contrast, shape (a filled or outlined pill/rectangle, ideally with a corner radius), an underline or link color for inline text, a pointer cursor and hover/focus feedback on web, and an explicit text label or accessible name on any icon-only control. No single cue is reliable alone — a color-only link fails for color-blind users, a bare icon is ambiguous — so pair at least two, and lean on position and context (a nav bar, a toolbar) to reinforce them. Apply the treatment identically everywhere: once "primary button" or "link blue" means interactive, recognition becomes instant and the user stops hunting.

The rule has a symmetric second half that is the more common failure: interactive and static styling must be mutually exclusive. The classic anti-pattern is giving a heading, badge, or card a background fill or link color so it reads as a button or link when nothing happens on tap — NN/g calls this out directly ("don't give headings a background color; they'll resemble buttons"). The inverse is just as harmful: real actions rendered as plain text that no one notices. Every false affordance spends a click of the user's trust, and after a couple of dead taps they stop trusting anything that looks similar, which suppresses engagement even on the real controls. Reserve your button and link tokens strictly for things that act, and give genuinely non-interactive emphasis its own visual language (weight, size, a subtle surface tint that is clearly not a control).

Looking interactive is necessary but not sufficient — the target must also be operable, which is where hard numbers apply. WCAG 2.2 SC 2.5.8 (Target Size, Minimum, Level AA) sets a floor of 24×24 CSS pixels, or smaller targets with 24px of spacing between them; platform guidance is more generous, with Apple HIG asking for 44×44 pt and Material Design for 48×48 dp minimum touch targets. Fitts's Law explains why generosity pays: acquisition time falls as target size grows and distance shrinks, so a primary action that looks tappable but presents an 18px hit area is still a broken affordance. Extend the tappable region (padding, an invisible hit-slop) rather than shrinking the visible glyph, and ensure the focus/hover/pressed states are visible so keyboard and pointer users get the same "this responds" confirmation that a tap gives.

**Good Example:**

> A high-fidelity screen uses one filled accent-color pill with a text label for the primary action and underlined link-blue for inline links, gives every icon-only button an accessible label plus a visible pressed/hover state, and sizes each hit area to at least 44×44 pt — while headings and status badges use weight and a muted surface tint that never borrows the button or link tokens.

**Bad Example:**

> A section heading is given a rounded, filled background so it looks like a tappable button but does nothing, while an actual "Edit" action sits as plain gray body text with no color, underline, or icon — so users tap the dead heading, get no response, and never find the real control.

**Guidelines:**

- MUST carry every interactive control with at least two concurrent signifiers — a button or link token plus a text label or accessible name — and give icon-only controls both an accessible name and a visible hover, focus, and pressed state.
- MUST reserve button and link tokens strictly for elements that perform an action, and render non-interactive emphasis such as headings and status badges with weight, size, or a muted surface tint that never borrows a button or link fill.
- MUST size every tappable target to at least 44×44 pt (24×24 CSS px absolute floor), extending the hit area with padding or hit-slop rather than shrinking the visible glyph, so no control's hit area is smaller than its interactive appearance implies.
- SHOULD apply each interactive treatment identically across the mockup so one token consistently signals "interactive", reinforced by position and container context such as a nav bar or toolbar.

Sources: [Beyond Blue Links: Making Clickable Elements Recognizable — Nielsen Norman Group](https://www.nngroup.com/articles/clickable-elements/) · [What are Affordances? (and Signifiers) — Interaction Design Foundation (IxDF)](https://www.interaction-design.org/literature/topics/affordances) · [Fitts's Law — Laws of UX (Jon Yablonski)](https://lawsofux.com/fittss-law/) · [Understanding SC 2.5.8: Target Size (Minimum) — W3C WAI / WCAG 2.2](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)

## Design a complete, differentiated set of interaction states

Interaction states are the app's feedback contract: they tell the user what is interactive, what will happen, and that a tap registered. A high-fidelity mockup has to show all of them, not just the resting look, because "enabled" alone hides the hard token decisions. Model the states as a reusable state layer — a semi-transparent overlay of the control's own on-color that composites over any background — so hover, focus, pressed, and disabled read the same on a primary button, a list row, and an icon button. Material Design 3 codifies concrete opacities worth reusing as defaults: roughly 8% for hover, 10% for focus and pressed, and 16% for dragged, with disabled expressed as ~38% opacity on content (label/icon) and ~12% on the container fill. Reusing one overlay scale is what makes the same cue mean the same thing everywhere; hand-tuning each control's states one by one is the fastest way to drift.

Timing and distinctness carry the perceptual weight. Pressed feedback must land inside roughly 100ms — Nielsen Norman Group's 0.1-second limit for feeling that the system reacts instantaneously — so the pressed state is the visual acknowledgment even before navigation or a network call resolves; never gate that first cue on async work. Keep hover and focus visually separable, because they answer different questions (pointer proximity vs. keyboard/AT position) and can co-occur; collapsing them into one style leaves keyboard users unsure where they are. On touch-primary surfaces hover is largely irrelevant, so budget your effort into pressed, focus, and disabled and don't fake hover states that a phone will never show.

Focus deserves real-token specificity because it is an accessibility gate, not decoration. Under WCAG 2.2, Focus Appearance (2.4.13, AAA) wants a focus indicator with at least a 3:1 contrast ratio between the focused and unfocused states and an area at least equal to a 2px-thick perimeter of the component, and Focus Not Obscured (2.4.11) requires the focused control not be entirely hidden by sticky headers, toolbars, or overlays. Design the ring against your actual surface tokens in both light and dark, and check it does not vanish on your accent-colored or elevated backgrounds. Disabled controls are the other trap: mute them enough to read as non-interactive, but the label must stay legible (WCAG's 3:1/4.5:1 text targets are relaxed for disabled elements, yet an unreadable disabled state is still a usability failure) — and pair a disabled control with a reason or an inline path to enable it, since a dead button with no explanation is a common dead end.

The recurring failure mode is shipping a mockup with only enabled and disabled, discovering during build that pressed, hover, and focus were never specified, and letting each engineer improvise — producing inconsistent cues, focus rings that fail contrast on half the surfaces, and buttons whose "did it work?" feedback arrives only after the screen transitions. Specify the full set as tokens up front, render them side by side in the mockup, and the implementation becomes lookup rather than invention.

**Good Example:**

> Define a single state-layer overlay scale (hover 8%, focus 10%, pressed 10%, disabled = 38% content / 12% container) plus one focus-ring token at ≥3:1 against every surface, then render each control showing enabled, hover, focus, pressed, and disabled in both light and dark so the same cue is visibly consistent across button, list row, and icon button.

**Bad Example:**

> Mock up only the resting and disabled looks, let pressed feedback wait for the navigation/network call to finish (so taps feel dead for 300ms), and reuse the hover color as the focus indicator — leaving keyboard users unsure where focus is and a ring that disappears on the accent-colored button.

**Guidelines:**

- MUST define one reusable state-layer overlay scale (defaulting to ~8% hover, ~10% focus and pressed, ~38% content / ~12% container disabled) and apply the identical tokens to button, list row, and icon button so a state reads the same on every control.
- MUST render each control's enabled, hover, focus, pressed, and disabled states side by side in both light and dark in the mockup, never shipping only the resting and disabled looks.
- MUST size the focus-ring token to at least 3:1 contrast against every surface it composites over — including accent-colored and elevated backgrounds — and MUST NOT reuse the hover color as the focus indicator.
- MUST NOT gate the pressed state on navigation or network completion, and MUST render it within roughly 100ms of the tap as the immediate acknowledgment.

Sources: [Button States: Communicate Interaction — Nielsen Norman Group](https://www.nngroup.com/articles/button-states-communicate-interaction/) · [States (Material Design 3) — Google Material Design](https://m3.material.io/foundations/interaction/states) · [Response Time Limits: The 3 Important Limits — Nielsen Norman Group](https://www.nngroup.com/articles/response-times-3-important-limits/) · [Understanding Success Criterion 2.4.13: Focus Appearance — W3C WAI](https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html) · [What's New in WCAG 2.2 — W3C Web Accessibility Initiative](https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/)

## Prefer clear error surfacing over silently disabled controls

A disabled control is a dead end that communicates "no" without communicating "why" or "how to fix it." When the primary action is greyed out, users are left to reverse-engineer the requirement: they re-enter fields in different formats, retry, open new tabs, and often abandon the flow — and you cannot even see this happening because a disabled button fires no event to instrument. Disabling also carries an accessibility cost. Disabled controls are typically removed from the tab order so keyboard and screen-reader users cannot focus them to discover the blocker, and their greyed styling usually fails contrast. Note that WCAG 1.4.11 (Non-text Contrast, 3:1) explicitly exempts inactive/disabled components, so a low-contrast disabled state is technically conformant precisely because it is unreadable — which is exactly the trap; the moment a control conveys required information, it should not be disabled.

The stronger default for form submission is to keep the action enabled and validate on interaction: let the user press Submit, then surface what is wrong. Show a count of errors, link a single error straight to its field, and render a summary at the top for multiple errors, with each message inline next to the offending field and referenced via aria-describedby. For per-field feedback, validate on blur (when the user leaves the field) rather than on every keystroke — premature keystroke validation reads as accusatory and causes layout shift that pushes the submit target around on mobile. Once a field has already shown an error, it is reasonable to re-validate live so the user sees it clear. Inline validation of this kind measurably helps: the classic study associated it with roughly 22% fewer errors, 42% faster completion, and higher satisfaction versus after-submit-only validation.

Reserve genuine disabling for the narrow cases where nothing the user can type will change the outcome right now: a submission already in flight (disable to prevent double-submit, and pair it with a spinner/loading label so the state reads as "working," not "blocked"), or an item that is truly, currently unavailable. Even then, explain the reason and the path to re-enable — via helper text, a tooltip, or an adjacent message — and keep the disabled element perceivable enough to be found. Choose disable-versus-hide by permanence and discoverability: disable (or better, keep active and explain) when the user should know the capability exists and could become available; hide only when the option is permanently irrelevant to this user or context, since hiding avoids the clutter of a control that will never apply but destroys discoverability for one that merely does not apply yet.

The common failure mode is the "silently disabled submit": a form whose button greys out until every field validates, with no indication of which field or rule is unmet. It is worst on long or multi-section forms where the offending field is scrolled out of view, and it compounds when the disabling logic itself is buggy — a whitespace-trimming or format mismatch leaves the button dead with no error to react to, and the user has no affordance to trigger the feedback that would explain it.

**Good Example:**

> A checkout form keeps "Place order" always tappable; pressing it with an invalid card scrolls to the card field, marks it with an inline message ("Card number looks incomplete"), and announces "1 error" — while a mid-submission press shows the button in a disabled loading state with a spinner labeled "Placing order…" to prevent a double charge.

**Bad Example:**

> A sign-up screen greys out "Create account" until all fields pass validation, so a user who typed a trailing space in their email sees a permanently dead, low-contrast button, no error message, and no way to find out what is wrong.

**Guidelines:**

- MUST keep the primary submission control enabled and validate its form on press, surfacing what is wrong instead of greying the control out until every field passes.
- MUST render each validation message inline beside its offending field, wire it via aria-describedby, and precede multi-error forms with a top summary that states the error count and links to the first field.
- SHOULD validate a field on blur rather than on every keystroke, re-validating live only after that field has already shown an error so the user watches it clear.
- MUST reserve a disabled state for an in-flight submission (paired with a spinner and a working-state label to block double-submit) or a genuinely unavailable item, and attach a perceivable reason and re-enable path in either case.

Sources: [Usability Pitfalls of Disabled Buttons, and How To Avoid Them — Smashing Magazine](https://www.smashingmagazine.com/2021/08/frustrating-design-patterns-disabled-buttons/) · [Hidden vs. Disabled In UX — Smashing Magazine](https://www.smashingmagazine.com/2024/05/hidden-vs-disabled-ux/) · [Understanding Success Criterion 1.4.11: Non-text Contrast — W3C Web Accessibility Initiative (WAI)](https://www.w3.org/WAI/WCAG21/Understanding/non-text-contrast.html)

## Write clear, well-placed error and validation feedback

Errors are the moment a user is most likely to abandon a flow, so feedback has to reduce recovery cost, not just report failure. Validate inline: let the user finish a field and move on, then show an indicator adjacent to that field, rather than firing errors mid-keystroke or dumping everything at submit. Adjacency matters because it minimizes working-memory load — the user reads the message while looking at the field they must fix, instead of memorizing a summary at the top of the form and hunting for the culprit. When server-side validation is unavoidable, mirror the same clarity on reload, and if a top-of-form summary is used for accessibility or long forms, pair it with per-field markers rather than relying on it alone.

Write the message in plain, specific, blame-free language that names what went wrong and what to do next — WCAG 3.3.1 (Error Identification) requires the error be described in text and the field in error identified, and 3.3.3 (Error Suggestion) requires a correction hint when one is known. "Enter a valid email, like `name@example.com`" beats "Invalid input." Avoid jargon, exclamation marks, and accusatory phrasing ("you failed to…"); state the constraint the input violated and the accepted format. Preserve everything the user typed — never clear the form or the offending field on a failed submit — so correction is an edit, not a re-entry.

Because roughly 1 in 12 men has a color-vision deficiency, an error signaled only by turning a border red is invisible to many users and fails accessibility: pair color with a text message and a non-color cue such as an icon, and set the message text at readable contrast rather than thin low-contrast red. In design-token terms, define an explicit error/danger role (border, text, and a subtle tinted field background) and apply it consistently across states. Reserve blocking modal dialogs for genuinely critical, data-loss or irreversible situations; routine validation should stay inline and non-interrupting. A useful design smell: if a single form throws three or more errors per attempt, the problem is usually the form's structure or unclear requirements up front, not the user — fix the form rather than piling on messages.

**Good Example:**

> A required email field the user leaves blank shows, on blur, a red-and-icon marker directly below it reading "Enter your email address so we can send your receipt," the field keeps its red border plus a faint red tint, and everything else the user typed stays intact.

**Bad Example:**

> On submit the form scrolls to a top banner saying "Error: invalid input," turns two field borders red with no text, and wipes the password and card-number fields, forcing the user to guess which field failed and retype what they had already entered.

**Guidelines:**

- MUST render each validation message inline and adjacent to the field it concerns, triggered on blur rather than mid-keystroke or only in a top-of-form submit summary.
- MUST word error text in plain, blame-free language that names the violated constraint and the accepted format, as in "Enter a valid email, like `name@example.com`" rather than "Invalid input."
- MUST signal every error with a text message plus a non-color cue such as an icon, applying a dedicated error token (border, readable-contrast text, and tinted field background) and never color alone.
- MUST preserve every value the user already entered on a failed submit, and reserve blocking modal dialogs for data-loss or irreversible situations instead of routine field validation.

Sources: [10 Design Guidelines for Reporting Errors in Forms — Nielsen Norman Group](https://www.nngroup.com/articles/errors-forms-design-guidelines/) · [Error-Message Guidelines — Nielsen Norman Group](https://www.nngroup.com/articles/error-message-guidelines/) · [10 Usability Heuristics for User Interface Design — Nielsen Norman Group](https://www.nngroup.com/articles/ten-usability-heuristics/) · [Understanding Success Criterion 3.3.1: Error Identification — W3C WAI](https://www.w3.org/WAI/WCAG21/Understanding/error-identification.html) · [Understanding Success Criterion 3.3.3: Error Suggestion — W3C WAI](https://www.w3.org/WAI/WCAG21/Understanding/error-suggestion.html)

## Match feedback to actual response-time thresholds

This principle comes from Nielsen's three response-time limits, which are properties of human cognition rather than of any technology. Below roughly 0.1 second an action feels instantaneous and directly manipulated, so the only correct feedback is the result itself — a spinner here is pure noise that arrives after the eye has already registered the change. Up to about 1 second the user notices a lag but keeps an unbroken train of thought, so still no dedicated indicator is needed; the state simply updates. Between about 2 and 10 seconds attention holds only if the system visibly acknowledges the wait, which calls for a lightweight busy cue — a spinner, an indeterminate bar, or a skeleton of the incoming layout. Past roughly 10 seconds users disengage and switch tasks, so you owe them a determinate percent-done indicator with an estimate that both proves the system is alive and lets them decide whether to wait or multitask.

The operative discipline is to let the delay bucket, not the operation's name, choose the cue. "Saving," "searching," and "uploading" are not inherently slow or fast; the same label can land in different buckets depending on payload and network. Design each state around its realistic p90 latency, not its happy path, and pick the treatment that matches where that number falls. This ties directly to the "visibility of system status" heuristic: every action needs an acknowledgment appropriate to its duration, and the acknowledgment should map to a real component state (default, loading, success, error) in your token set rather than an ad-hoc overlay.

Two refinements matter in high-fidelity work. First, skeleton screens outperform bare spinners in the 1–3 second range because they show the shape of the result and reduce perceived wait — studies find a ~3s skeleton feels comparable to a ~1.5s spinner — whereas a spinner conveys uncertainty because the user cannot gauge how long is left. Second, guard the low end with a short delay before showing any indicator (commonly ~300–500ms): if the response usually returns under a second, an eagerly rendered spinner will flash-and-vanish, reading as a flicker or a glitch. Reserve determinate progress bars for genuinely long, measurable work where you can report real percentage, and never fake progress that stalls at 99%.

The common failure mode is decorating fast interactions and under-communicating slow ones: a full-screen spinner over an instant toggle, or a bare spinner that runs for 30 seconds with no estimate so the user assumes a freeze and force-quits. Both break the flow the thresholds are meant to protect.

**Good Example:**

> A collection list that usually loads in ~600ms renders a skeleton of the row layout after a 300ms delay; a bulk publish that typically runs 15s shows a determinate bar reading "Publishing 6 of 40…" with the affected rows dimmed.

**Bad Example:**

> Tapping a toggle triggers a 2-second full-screen modal spinner (the toggle already resolved in 40ms), while a 30-second export shows only an endless indeterminate spinner with no count or estimate, so users assume it hung and kill the app.

**Guidelines:**

- MUST size each state's loading treatment to its realistic p90 latency rather than the operation's label, mapping sub-1s waits to no indicator (only the updated result), 2-10s waits to a skeleton or busy cue, and past-10s waits to a determinate percent-done indicator carrying an estimate.
- MUST NOT overlay a spinner, modal, or full-screen busy cue on interactions that resolve under ~100ms, and MUST render each cue as a real component state (default, loading, success, error) from the token set rather than an ad-hoc overlay.
- SHOULD gate any busy indicator behind a ~300-500ms delay so responses that usually return under a second never flash-and-vanish, and SHOULD render a layout skeleton instead of a bare spinner for waits in the ~1-3s range.
- MUST reserve determinate progress bars for genuinely measurable long work, reporting real percentage and count, and MUST NOT display faked progress that stalls near completion.

Sources: [Response Time Limits: The 3 Important Limits — Nielsen Norman Group](https://www.nngroup.com/articles/response-times-3-important-limits/) · [10 Usability Heuristics for User Interface Design — Nielsen Norman Group](https://www.nngroup.com/articles/ten-usability-heuristics/) · [Skeleton Screens 101 — Nielsen Norman Group](https://www.nngroup.com/articles/skeleton-screens/) · [Progress indicators — Material Design 3](https://m3.material.io/components/progress-indicators/overview)
