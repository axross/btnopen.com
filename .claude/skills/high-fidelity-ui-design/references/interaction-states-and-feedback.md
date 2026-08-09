# High-Fidelity UI & Visual Design — Interaction, States & Feedback

Touch targets, interactive affordances, complete state sets, disabled-vs-error, and response-time-matched feedback.

Part of the research-grounded best-practices set for this skill (see the skill's `SKILL.md` for the full routing). Each principle below is distilled from reputable design sources; the `**Guidelines:**` bullets are the normative rules for this topic.

## Size and space touch targets for real fingers

The failure mode measures fine and mistaps in the hand: a dense row of 24-32dp icon buttons — share, edit, delete crammed together — that looks tidy at 100% zoom because the design tool never simulates a fingertip. The pad of one is roughly 8-10mm wide, so the fix is 44-48 targets with 8dp gaps, even if the icons themselves stay small.

The number that matters is the tappable area, not the visible glyph. A 24dp icon becomes a valid target only when padding grows its hit area to 44-48; in the mockup, show that hit area explicitly (a highlighted, inspectable box) so it survives handoff, because an engineer who reads only the visible bounds will ship an under-target control. React Native's `hitSlop` and web's transparent padding both extend the tappable region past the drawn pixels — annotate it rather than leaving it implicit. Keep at least ~8dp of clear space between adjacent targets ([touch targets](https://www.nngroup.com/articles/touch-target-size/), [accessible tap target sizes](https://www.smashingmagazine.com/2023/04/accessible-tap-target-sizes-rage-taps-clicks/)).

The platform floors converge on about 9mm — [44x44pt on iOS](https://developer.apple.com/design/tips/), [48x48dp on Android](https://support.google.com/accessibility/android/answer/7101858?hl=en) and [in Material 3](https://m3.material.io/foundations/designing/structure) — against an absolute floor of 24x24 CSS px for pointer targets ([SC 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)), whose spacing exception formalizes the gap rule as a 24px undisturbed circle centered on each small target that must not overlap a neighbor. Honor the larger number when they disagree, since 48dp comfortably clears both, and never read that 24px legal minimum — hedged with escape hatches for inline text links and equivalent full-size controls elsewhere — as a design target. [Fitts's Law](https://lawsofux.com/fittss-law/) says where to spend the extra size: acquisition time rises with distance and falls with target width, and screen edges and corners are effectively infinite-width because the finger can't overshoot them. So enlarge primary actions, place high-frequency controls where they are easy to hit, and give destructive actions extra separation from their neighbors so a fat-finger miss doesn't delete something.

**Good Example:**

> A toolbar's 24dp trash icon is wrapped in padding to a 48x48dp hit area, spaced 8dp from its neighbors, and the mockup annotates that 48dp box so the spec carries the tappable region, not just the glyph.

**Bad Example:**

> A card footer packs share, edit, and delete as three 28dp icon buttons butted together with ~2dp between them — visually tidy, but on-device the fingertip overlaps two targets at once and users mistap delete.

**Guidelines:**

- MUST size every interactive control to a tappable area of at least 44x44pt (iOS) or 48x48dp (Material), honoring the larger minimum when platform targets disagree and never treating WCAG's 24px floor as the design target.
- MUST grow an icon or text control's hit area to the minimum target with padding or hitSlop when the visible glyph is smaller, and annotate that tappable box explicitly in the mockup so the spec carries the hit region rather than the drawn bounds.
- MUST keep at least 8dp of clear space between adjacent targets, and give destructive actions extra separation from their neighbors so a fat-finger miss cannot trigger them.
- SHOULD enlarge primary actions and anchor high-frequency or destructive controls to screen edges and corners per Fitts's Law, rather than cramming equal-weight icon buttons into a dense row.

Sources: [How to Use Tappability Affordances — Interaction Design Foundation (IxDF)](https://ixdf.org/literature/article/how-to-use-tappability-affordances)

## Make interactive elements look interactive and avoid false affordances

Every false affordance spends a click of the user's trust, and after a couple of dead taps they stop trusting anything that looks similar — which suppresses engagement even on the real controls. The classic version gives a heading, badge, or card a background fill or link color so it reads as a button when nothing happens on tap ([don't give headings a background color; they'll resemble buttons](https://www.nngroup.com/articles/clickable-elements/)). The inverse is just as harmful: real actions rendered as plain text that no one notices. So interactive and static styling have to be mutually exclusive — reserve the button and link tokens strictly for things that act, and give non-interactive emphasis its own visual language (weight, size, a subtle surface tint that is clearly not a control).

Carrying the interactive half is a stack of cues, because in flat UI [the signifier](https://ixdf.org/literature/topics/affordances) is all you have — there is no bevel doing the work. Distinct color or contrast, shape (a filled or outlined pill or rectangle, ideally with a corner radius), an underline or link color for inline text, a pointer cursor and hover/focus feedback on web, an explicit text label or accessible name on any icon-only control. No single cue is reliable alone — a color-only link fails for color-blind users, a bare icon is ambiguous — so pair at least two, and lean on position and context (a nav bar, a toolbar) to reinforce them. Apply each treatment identically everywhere: once "primary button" or "link blue" means interactive, recognition becomes instant and the user stops hunting.

Looking interactive is necessary but not sufficient — a primary action that looks tappable and presents an 18px hit area is still a broken affordance, which is why [Fitts's Law](https://lawsofux.com/fittss-law/) and the [target-size floor](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) covered above apply to appearance as much as to layout. Extend the tappable region with padding or hit-slop rather than shrinking the visible glyph, and make the focus, hover, and pressed states visible so keyboard and pointer users get the same "this responds" confirmation a tap gives.

**Good Example:**

> A high-fidelity screen uses one filled accent-color pill with a text label for the primary action and underlined link-blue for inline links, gives every icon-only button an accessible label plus a visible pressed/hover state, and sizes each hit area to at least 44×44 pt — while headings and status badges use weight and a muted surface tint that never borrows the button or link tokens.

**Bad Example:**

> A section heading is given a rounded, filled background so it looks like a tappable button but does nothing, while an actual "Edit" action sits as plain gray body text with no color, underline, or icon — so users tap the dead heading, get no response, and never find the real control.

**Guidelines:**

- MUST carry every interactive control with at least two concurrent signifiers — a button or link token plus a text label or accessible name — and give icon-only controls both an accessible name and a visible hover, focus, and pressed state.
- MUST reserve button and link tokens strictly for elements that perform an action, and render non-interactive emphasis such as headings and status badges with weight, size, or a muted surface tint that never borrows a button or link fill.
- MUST size every tappable target to at least 44×44 pt (24×24 CSS px absolute floor), extending the hit area with padding or hit-slop rather than shrinking the visible glyph, so no control's hit area is smaller than its interactive appearance implies.
- SHOULD apply each interactive treatment identically across the mockup so one token consistently signals "interactive", reinforced by position and container context such as a nav bar or toolbar.

## Design a complete, differentiated set of interaction states

The recurring failure mode is shipping a mockup with only enabled and disabled, discovering during build that pressed, hover, and focus were never specified, and letting each engineer improvise — producing inconsistent cues, focus rings that fail contrast on half the surfaces, and buttons whose "did it work?" feedback arrives only after the screen transitions. Specify the full set as tokens up front, render them side by side, and the implementation becomes lookup rather than invention.

The mechanism that keeps them consistent is one reusable state layer — a semi-transparent overlay of the control's own on-color that composites over any background — so hover, focus, pressed, and disabled read the same on a primary button, a list row, and an icon button. [Material 3 codifies opacities](https://m3.material.io/foundations/interaction/states) worth reusing as defaults: roughly 8% hover, 10% focus and pressed, 16% dragged, with disabled expressed as ~38% on content and ~12% on the container fill. Reusing one scale is what makes the same cue mean the same thing everywhere; hand-tuning each control's states one by one is the fastest way to drift.

Timing and distinctness carry the perceptual weight. Pressed feedback has to land inside roughly 100ms — [the limit below which a system feels instantaneous](https://www.nngroup.com/articles/response-times-3-important-limits/) — which makes the pressed state the acknowledgment that fires before navigation or a network call resolves; never gate that first cue on async work ([button states](https://www.nngroup.com/articles/button-states-communicate-interaction/)). Keep hover and focus visually separable, because they answer different questions (pointer proximity versus keyboard or AT position) and can co-occur, so collapsing them into one style leaves keyboard users unsure where they are. On touch-primary surfaces hover is largely irrelevant — budget the effort into pressed, focus, and disabled rather than faking hover states a phone will never show.

Two states have traps of their own. The focus ring is an accessibility gate rather than decoration ([SC 2.4.13](https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html), [what's new in WCAG 2.2](https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/)), so design it against your actual surface tokens in both themes and check it does not vanish on accent-colored or elevated backgrounds. Disabled is the other: mute it enough to read as non-interactive while keeping the label legible — the contrast targets are relaxed for disabled elements, but an unreadable disabled state is still a usability failure — and pair it with a reason or an inline path to enable, since a dead button with no explanation is a common dead end.

**Good Example:**

> Define a single state-layer overlay scale (hover 8%, focus 10%, pressed 10%, disabled = 38% content / 12% container) plus one focus-ring token at ≥3:1 against every surface, then render each control showing enabled, hover, focus, pressed, and disabled in both light and dark so the same cue is visibly consistent across button, list row, and icon button.

**Bad Example:**

> Mock up only the resting and disabled looks, let pressed feedback wait for the navigation/network call to finish (so taps feel dead for 300ms), and reuse the hover color as the focus indicator — leaving keyboard users unsure where focus is and a ring that disappears on the accent-colored button.

**Guidelines:**

- MUST define one reusable state-layer overlay scale (defaulting to ~8% hover, ~10% focus and pressed, ~38% content / ~12% container disabled) and apply the identical tokens to button, list row, and icon button so a state reads the same on every control.
- MUST render each control's enabled, hover, focus, pressed, and disabled states side by side in both light and dark in the mockup, never shipping only the resting and disabled looks.
- MUST size the focus-ring token to at least 3:1 contrast against every surface it composites over — including accent-colored and elevated backgrounds — and MUST NOT reuse the hover color as the focus indicator.
- MUST NOT gate the pressed state on navigation or network completion, and MUST render it within roughly 100ms of the tap as the immediate acknowledgment.

## Prefer clear error surfacing over silently disabled controls

The common failure mode is the "silently disabled submit": a form whose button greys out until every field validates, with no indication of which field or rule is unmet. It is worst on long or multi-section forms where the offending field is scrolled out of view, and it compounds when the disabling logic itself is buggy — a whitespace-trimming or format mismatch leaves the button dead with no error to react to, and no affordance to trigger the feedback that would explain it. Users are left to reverse-engineer the requirement: re-entering fields in different formats, retrying, opening new tabs, often abandoning. You cannot even see it happening, because a disabled button fires no event to instrument ([usability pitfalls of disabled buttons](https://www.smashingmagazine.com/2021/08/frustrating-design-patterns-disabled-buttons/)).

The accessibility cost hides a trap worth stating precisely. Disabled controls are typically removed from the tab order, so keyboard and screen-reader users cannot focus them to discover the blocker, and their greyed styling usually fails contrast — except that [SC 1.4.11](https://www.w3.org/WAI/WCAG21/Understanding/non-text-contrast.html) explicitly exempts inactive components, so a low-contrast disabled state is technically conformant precisely because it is unreadable. That is the trap: the moment a control conveys required information, it should not be disabled.

The stronger default for form submission is to keep the action enabled and validate on interaction: let the user press Submit, then surface what is wrong. Show a count of errors, link a single error straight to its field, and render a summary at the top for multiple errors, with each message inline next to the offending field and referenced via aria-describedby. For per-field feedback, validate on blur (when the user leaves the field) rather than on every keystroke — premature keystroke validation reads as accusatory and causes layout shift that pushes the submit target around on mobile — then re-validate live once a field has already shown an error, so the user watches it clear. Inline validation of this kind measurably helps: the classic study associated it with roughly 22% fewer errors, 42% faster completion, and higher satisfaction versus after-submit-only validation.

Reserve genuine disabling for the narrow cases where nothing the user can type will change the outcome right now: a submission already in flight (disable to prevent double-submit, and pair it with a spinner/loading label so the state reads as "working," not "blocked"), or an item that is truly, currently unavailable. Even then, explain the reason and the path to re-enable — via helper text, a tooltip, or an adjacent message — and keep the disabled element perceivable enough to be found. Choose disable-versus-hide by permanence and discoverability ([hidden vs. disabled](https://www.smashingmagazine.com/2024/05/hidden-vs-disabled-ux/)): disable (or better, keep active and explain) when the user should know the capability exists and could become available; hide only when the option is permanently irrelevant to this user or context, since hiding avoids the clutter of a control that will never apply but destroys discoverability for one that merely does not apply yet.

**Good Example:**

> A checkout form keeps "Place order" always tappable; pressing it with an invalid card scrolls to the card field, marks it with an inline message ("Card number looks incomplete"), and announces "1 error" — while a mid-submission press shows the button in a disabled loading state with a spinner labeled "Placing order…" to prevent a double charge.

**Bad Example:**

> A sign-up screen greys out "Create account" until all fields pass validation, so a user who typed a trailing space in their email sees a permanently dead, low-contrast button, no error message, and no way to find out what is wrong.

**Guidelines:**

- MUST keep the primary submission control enabled and validate its form on press, surfacing what is wrong instead of greying the control out until every field passes.
- MUST render each validation message inline beside its offending field, wire it via aria-describedby, and precede multi-error forms with a top summary that states the error count and links to the first field.
- SHOULD validate a field on blur rather than on every keystroke, re-validating live only after that field has already shown an error so the user watches it clear.
- MUST reserve a disabled state for an in-flight submission (paired with a spinner and a working-state label to block double-submit) or a genuinely unavailable item, and attach a perceivable reason and re-enable path in either case.

## Write clear, well-placed error and validation feedback

A design smell worth checking first: if a single form throws three or more errors per attempt, the problem is usually the form's structure or unclear requirements up front, not the user — fix the form rather than piling on messages. Errors are the moment a user is most likely to abandon a flow, so feedback has to reduce recovery cost, not just report failure.

Adjacency is what reduces it. Let the user finish a field and move on, then show an indicator next to that field, rather than firing errors mid-keystroke or dumping everything at submit — the user then reads the message while looking at the field they must fix, instead of memorizing a summary at the top of the form and hunting for the culprit ([reporting errors in forms](https://www.nngroup.com/articles/errors-forms-design-guidelines/)). When server-side validation is unavoidable, mirror the same clarity on reload, and where a top-of-form summary is needed for accessibility or a long form, pair it with per-field markers rather than relying on it alone ([visibility of system status](https://www.nngroup.com/articles/ten-usability-heuristics/)).

The message itself names what went wrong and what to do next, in plain, specific, blame-free language — the criteria require the error to be described in text with the field identified ([SC 3.3.1](https://www.w3.org/WAI/WCAG21/Understanding/error-identification.html)) and a correction hint given when one is known ([SC 3.3.3](https://www.w3.org/WAI/WCAG21/Understanding/error-suggestion.html)). "Enter a valid email, like `name@example.com`" beats "Invalid input." Avoid jargon, exclamation marks, and accusatory phrasing ("you failed to…"); state the constraint the input violated and the accepted format ([error-message guidelines](https://www.nngroup.com/articles/error-message-guidelines/)). Preserve everything the user typed — never clear the form or the offending field on a failed submit — so correction is an edit, not a re-entry.

An error signaled only by turning a border red is invisible to a meaningful share of users and fails accessibility: pair color with a text message and a non-color cue such as an icon, and set the message text at readable contrast rather than thin low-contrast red. In design-token terms, define an explicit error/danger role (border, text, and a subtle tinted field background) and apply it consistently across states. Reserve blocking modal dialogs for genuinely critical, data-loss or irreversible situations; routine validation stays inline and non-interrupting.

**Good Example:**

> A required email field the user leaves blank shows, on blur, a red-and-icon marker directly below it reading "Enter your email address so we can send your receipt," the field keeps its red border plus a faint red tint, and everything else the user typed stays intact.

**Bad Example:**

> On submit the form scrolls to a top banner saying "Error: invalid input," turns two field borders red with no text, and wipes the password and card-number fields, forcing the user to guess which field failed and retype what they had already entered.

**Guidelines:**

- MUST render each validation message inline and adjacent to the field it concerns, triggered on blur rather than mid-keystroke or only in a top-of-form submit summary.
- MUST word error text in plain, blame-free language that names the violated constraint and the accepted format, as in "Enter a valid email, like `name@example.com`" rather than "Invalid input."
- MUST signal every error with a text message plus a non-color cue such as an icon, applying a dedicated error token (border, readable-contrast text, and tinted field background) and never color alone.
- MUST preserve every value the user already entered on a failed submit, and reserve blocking modal dialogs for data-loss or irreversible situations instead of routine field validation.

## Match feedback to actual response-time thresholds

The operative discipline is to let the delay bucket, not the operation's name, choose the cue. "Saving," "searching," and "uploading" are not inherently slow or fast; the same label lands in different buckets depending on payload and network. So design each state around its realistic p90 latency rather than its happy path, and pick the treatment that matches where that number falls. The failure mode is decorating fast interactions and under-communicating slow ones: a full-screen spinner over an instant toggle, or a bare spinner running 30 seconds with no estimate, so the user assumes a freeze and force-quits.

The buckets come from [Nielsen's three response-time limits](https://www.nngroup.com/articles/response-times-3-important-limits/), which are properties of human cognition rather than of any technology: about 0.1s, where an action feels instantaneous and the result itself is the only correct feedback (a spinner here is noise arriving after the eye already registered the change); about 1s, where the lag is noticed but the train of thought holds and the state simply updates; and about 10s, past which users disengage and switch tasks. Between roughly 2 and 10 seconds attention holds only if the system visibly acknowledges the wait, and past 10 you owe a determinate percent-done indicator with an estimate that both proves the system is alive and lets the user decide whether to wait or multitask ([progress indicators](https://m3.material.io/components/progress-indicators/overview)). Every acknowledgment should map to a real component state — default, loading, success, error — in your token set rather than an ad-hoc overlay ([visibility of system status](https://www.nngroup.com/articles/ten-usability-heuristics/)).

Two refinements matter in high-fidelity work. [Skeleton screens](https://www.nngroup.com/articles/skeleton-screens/) outperform bare spinners in the 1–3 second range because they show the shape of the result — a ~3s skeleton feels comparable to a ~1.5s spinner — whereas a spinner conveys uncertainty, since the user cannot gauge how long is left. And guard the low end with a short delay before showing any indicator, commonly ~300–500ms: if the response usually returns under a second, an eagerly rendered spinner flashes and vanishes, reading as a glitch. Reserve determinate progress bars for genuinely long, measurable work where you can report real percentage, and never fake progress that stalls at 99%.

**Good Example:**

> A collection list that usually loads in ~600ms renders a skeleton of the row layout after a 300ms delay; a bulk publish that typically runs 15s shows a determinate bar reading "Publishing 6 of 40…" with the affected rows dimmed.

**Bad Example:**

> Tapping a toggle triggers a 2-second full-screen modal spinner (the toggle already resolved in 40ms), while a 30-second export shows only an endless indeterminate spinner with no count or estimate, so users assume it hung and kill the app.

**Guidelines:**

- MUST size each state's loading treatment to its realistic p90 latency rather than the operation's label, mapping sub-1s waits to no indicator (only the updated result), 2-10s waits to a skeleton or busy cue, and past-10s waits to a determinate percent-done indicator carrying an estimate.
- MUST NOT overlay a spinner, modal, or full-screen busy cue on interactions that resolve under ~100ms, and MUST render each cue as a real component state (default, loading, success, error) from the token set rather than an ad-hoc overlay.
- SHOULD gate any busy indicator behind a ~300-500ms delay so responses that usually return under a second never flash-and-vanish, and SHOULD render a layout skeleton instead of a bare spinner for waits in the ~1-3s range.
- MUST reserve determinate progress bars for genuinely measurable long work, reporting real percentage and count, and MUST NOT display faked progress that stalls near completion.
