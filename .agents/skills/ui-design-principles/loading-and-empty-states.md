# Loading and Empty States

Apply these rules when designing any UI state that is not the "happy, loaded, populated" view — loading skeletons, suspense fallbacks, empty lists, 404 / not-found pages, and the visual continuity between a list and its detail page.

The component-pair wiring (a loaded / loading sibling pair plumbed through suspense, with shared style modules enforcing proportion parity) lives in [react-component-guidelines › server-components](../react-component-guidelines/server-components.md). This document governs what those states should **look and feel like**, not how they are wired.

## Visual Parity Between Loaded and Loading

- The loading sibling MUST render at the same outer dimensions, spacing, and grid structure as its loaded counterpart. A reader who navigates into the route SHOULD see the skeleton collapse into the real content without any layout shift.
- Skeleton line-clamps, aspect ratios, and text widths MUST match the proportions of the loaded surface so the transition reads as "the same layout filling in", not "a placeholder being replaced by something taller".

## Skeleton Shapes

Two placeholder primitives serve every skeleton on the site:

- **Rectangle placeholder** — for image / media / figure slots. Renders as a medium-radius rectangle tinted at a subtle neutral step and gently pulsing one step brighter.
- **Text placeholder** — for text slots. Each whitespace-separated word in the sample text renders as a pill sized to the word's character count, wrapped and clamped vertically to the matching line-clamp.

Rules for using them:

- The sample text passed to a text placeholder MUST mirror the expected real content's **shape**, not its meaning — Latin placeholder strings sized like real titles / briefs / timestamps. See [ui-labeling-and-wording › loading placeholder sample text](./ui-labeling-and-wording.md#loading-placeholder-sample-text).
- The maximum-lines value on a text placeholder MUST match the line-clamp on the matching loaded surface so the two states occupy the same vertical space.
- MUST NOT introduce a third placeholder primitive. If a new shape is genuinely needed (e.g., a circular avatar), extend the existing primitives with a new exported variant rather than inlining one in a component.
- The pulse cadence MUST remain identical across every placeholder on the site so multiple placeholders on-screen pulse in phase. Introducing a second cadence fragments the feel of "the page is waiting" into "several independent things are waiting".

## Loading Boundary Placement

The suspense-boundary wiring itself is defined in [react-component-guidelines › server-components](../react-component-guidelines/server-components.md); this section governs **where** a loading boundary should sit on the page from a design standpoint.

- SHOULD size each loading boundary around the smallest meaningful content region rather than the whole page. A full-page spinner is not on-brand for this site — the loading experience is meant to read as "this specific part of the page is filling in", not "everything is suspended".
- SHOULD NOT rely on the site-wide root-level loading boundary as a substitute for a per-section boundary — that global boundary exists to serve analytics-style side effects, not as the primary loading affordance for content.

## View Transitions for Visual Continuity

- Navigation from a list item to its detail page MUST morph the shared visual elements (cover image, timestamp, title) in place using the project's view-transition affordance. The reader should feel the list item *becoming* the detail page, not dissolving and being replaced.
- Shared-element transition names SHOULD follow the `<entity>-<identifier>-<role>` pattern (e.g., cover image / timestamp / title for each blog post) so names stay collision-free as the site grows. Both the list side and the detail side MUST wrap the same semantic element with the same transition name; a missing pairing breaks the morph silently.
- The target element on the detail side SHOULD preserve the source's intrinsic proportions so the morph reads as a re-crop of the same asset. The list-item cover's mobile-to-desktop aspect pair (short banner on mobile, taller on desktop) is the canonical example — see [responsive-layout › image aspect-ratio across tiers](./responsive-layout.md#image-aspect-ratio-across-tiers).
- Image morphs pair with a slow sepia fade-in so the thumbnail's accent tint settles after the shape morph completes. The fade is intentionally longer than interactive motion — a ~3-second atmospheric reveal rather than a hover-speed snap.

## The 404 / Not-Found Aesthetic

- Every "missing" route MUST render through the shared not-found surface. Do not implement ad-hoc not-found UI per route.
- The heading MUST follow the code-syntax voice (see [ui-labeling-and-wording › voice and tone](./ui-labeling-and-wording.md#voice-and-tone)). The description MUST be a single Japanese sentence stating what was not found.
- The giant status number ("404") is the signature decorative element:
  - Typeset in the monospace family, bold, at the largest size on the page.
  - Rendered as a glitched triplet — one base layer in an accent step with two slightly hue-offset copies clipped by alternating noise masks. The visible effect should read as a tasteful terminal-flicker, never as broken.
  - Hidden from assistive tech so the accessible name comes from the real heading, not the decorative number.
- The primary action MUST be a single "Go back home" link to the index. MUST NOT add secondary actions (search, report, recent posts) — the glitch visual plus a single escape hatch is the intended aesthetic.

## Empty States (No Items)

- Lists that can legitimately be empty (e.g., a future tag-filtered archive) SHOULD render a muted message inside the list container rather than collapsing the container entirely, so the surrounding chrome stays anchored and the page does not reflow.
- Empty-state headings SHOULD adopt the same code-syntax voice as not-found headings when appropriate — "the thing is empty" phrased as a JS equality expression.
- The project has no dedicated empty-state surface today; when introducing one, it SHOULD be a shared component following the same composition pattern as the not-found surface rather than a route-local one-off.
