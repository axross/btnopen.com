# Accessibility

Apply these rules when designing any user-facing surface. These rules are absolute requirements; accessibility regressions are treated as correctness bugs, not polish items.

## Semantic Regions

Semantic Regions sets the required project default: pick the semantic landmark and structural element that matches the **role** of the region, not its appearance:

**Guidelines:**

- MUST pick the semantic landmark and structural element that matches the **role** of the region, not its appearance:
  - **Page header** for the top-of-page region that holds the logo / navigation.
  - **Main** for the primary content region of a page.
  - **Section** for sibling regions inside the main region (e.g., the intro region plus the Posts region on the index page).
  - **Article** for self-contained content units (individual blog-post renderings).
  - **Header (inside an article)** for the post's title and meta block.
  - **Top-level heading** for the primary heading of a page; subsequent headings in document order without skipping levels.
  - **List + list-item** for any group of peer items (blog-post list, tags, social-link list). MUST NOT fake a list out of generic wrappers styled to look like one.
  - **Time** SHOULD wrap machine-readable timestamps in new work; existing plain-text dates MAY migrate opportunistically.
- MUST NOT use a generic wrapper when a semantic element exists for the role.
- MUST NOT wrap an interactive affordance in a non-interactive wrapper and bolt click handling on top — use a real button or link.

## Icon Labeling

Icon Labeling captures the project-specific context for the checklist below: Inline icons that communicate meaning (logo, social icons, brand illustrations, web-embed fallback) MUST carry a single accessible name at the icon's outer boundary. The canonical-label strings are in [ui-labeling-and-wording › aria-label and alt strings](./ui-labeling-and-wording.md#aria-label-and-alt-strings).

**Guidelines:**

- MUST give inline icons that communicate meaning (logo, social icons, brand illustrations, web-embed fallback) a single accessible name at the icon's outer boundary. The canonical-label strings are in [ui-labeling-and-wording › aria-label and alt strings](./ui-labeling-and-wording.md#aria-label-and-alt-strings).
- MUST NOT label inner paths; only the outer icon boundary announces the name.
- MUST hide purely decorative icons (a graphical flourish behind text, a visual divider) from assistive tech — either announce them as "decorative" or wrap them in a decorative parent that is itself hidden.
- MUST NOT rely on an icon's hover-tooltip alone as the accessible name — tooltips are supplemental, not primary.

## Decorative Text

Decorative Text captures the project-specific context for the checklist below: Purely decorative text content (the giant `404` glyph on the not-found surface) MUST be hidden from assistive tech so the accessible name comes from the real heading, not the decorative number.

**Guidelines:**

- MUST hide purely decorative text content (the giant `404` glyph on the not-found surface) from assistive tech so the accessible name comes from the real heading, not the decorative number.
- MUST NOT hide meaningful copy from assistive tech to work around a layout issue — if the copy would confuse a screen-reader user, rework the layout.

## Images

Images captures the project-specific context for the checklist below: Every image MUST carry alt text.

**Guidelines:**

- MUST give every image alt text.
- MUST make CMS-sourced media fall through this priority chain: author-supplied alt → the media upload's own alt → empty string (only when the image is genuinely decorative).
- MUST describe thumbnail and cover images by the depicted subject, using the post title. Avatars MUST use the person's display name.
- MUST NOT leave alt empty on images that convey meaning; empty alt is a last-resort signal for truly decorative uploads, not a default.

## External Links

External Links captures the project-specific context for the checklist below: Every link pointing at an external origin MUST open in a new tab and MUST isolate the new tab from the originating page (no access back to the opener, no referrer leakage). The mechanical pairing of these attributes is in [react-component-guidelines › css-property-usage](../react-component-guidelines/css-property-usage.md).

**Guidelines:**

- MUST open every external-origin link in a new tab and isolate the new tab from the originating page (no access back to the opener, no referrer leakage). The mechanical pairing of these attributes is in [react-component-guidelines › css-property-usage](../react-component-guidelines/css-property-usage.md).
- MUST NOT apply external-link attributes to internal links. Internal navigation MUST use the project's internal-link primitive so client-side routing kicks in.

## Keyboard Focus

Keyboard Focus captures the project-specific context for the checklist below: Every interactive surface MUST show a visible focus indicator when reached by keyboard. Removing the browser's default focus ring without a replacement is prohibited.

**Guidelines:**

- MUST show a visible focus indicator on every interactive surface when it is reached by keyboard. Removing the browser's default focus ring without a replacement is prohibited.
- SHOULD use an accent-ramp step for the replacement ring and SHOULD match the surface's corner shape — a squircle card gets a squircle ring, a pill gets a pill ring. The canonical CSS template is in [react-component-guidelines › css-property-usage › focus-ring](../react-component-guidelines/css-property-usage.md#focus-ring).
- MUST NOT retune the ring's width, offset, or color per surface — the shared template is what makes focus affordances feel consistent across the site.
- MUST preserve keyboard focusability on every clickable surface. Removing a surface from the tab order for styling convenience is prohibited.

## Theme and Color Parity

Theme and Color Parity captures the project-specific context for the checklist below: Every surface MUST remain legible in both light and dark schemes. A surface that looks correct in one scheme but loses contrast in the other is a design bug, not a polish item. The full theming philosophy (step-role invariance, legitimate per-scheme overrides, imagery compensation) lives in [color-theming.md](./color-theming.md); the step-role meanings are in [design-tone-and-taste › color system](./design-tone-and-taste.md#color-system).

**Guidelines:**

- MUST keep every surface legible in both light and dark schemes. A surface that looks correct in one scheme but loses contrast in the other is a design bug, not a polish item. The full theming philosophy (step-role invariance, legitimate per-scheme overrides, imagery compensation) lives in [color-theming.md](./color-theming.md); the step-role meanings are in [design-tone-and-taste › color system](./design-tone-and-taste.md#color-system).
- MUST NOT ship a surface whose text falls below the project's baseline for text-on-background contrast: the highest-contrast text step against the page background step.
- MUST NOT convey state through color alone. Every interactive state change (hover, active, selected, error) MUST also carry a non-color signal — a background fill, an underline, a border, or a shape change.
- MUST keep a visible underline offset from the baseline on links. Color-only link treatment is not acceptable.

## Hover and Interactive Affordances

Hover and Interactive Affordances captures the project-specific context for the checklist below: Every interactive surface MUST have a visible non-color hover affordance that reads the same way to colorblind and low-vision users as it does to everyone else:

**Guidelines:**

- MUST give every interactive surface a visible non-color hover affordance that reads the same way to colorblind and low-vision users as it does to everyone else:
  - **Text links** pick up a background-fill swap (one-step-up on the accent ramp).
  - **Cards** swap their background one step up on their resting ramp and MAY bump the image brightness.
  - **Icons** swap both the stroke color and a subtle background pill one step up on their resting ramp.

- MUST NOT implement hover with a color change alone — the hover must be perceivable without the color cue.
- MUST keep hover step deltas consistent with the step-role table in [design-tone-and-taste › color system](./design-tone-and-taste.md#color-system); cross-ramp hover (accent → neutral or vice versa) is prohibited because the result looks inconsistent across schemes.

## Tappable Target Size

Tappable Target Size captures the project-specific context for the checklist below: Every interactive icon and small inline control MUST have an effective tap area of at least ~40×40 regardless of its visual size. The icon's drawn bounds are NOT the tap area.

- The project's pattern is to expand the hit area invisibly by padding the interactive element and compensating with an outward margin, so the visual position does not move. The canonical CSS template is in [react-component-guidelines › css-property-usage › hit-area-expansion](../react-component-guidelines/css-property-usage.md#hit-area-expansion).

**Guidelines:**

- MUST give every interactive icon and small inline control an effective tap area of at least ~40×40 regardless of its visual size. The icon's drawn bounds are NOT the tap area.
- SHOULD inherit the shared rounded-corner tier so the pressed-state background reads as on-brand rather than as a generic hit-box.

## Language Attribute

Language Attribute captures the project-specific context for the checklist below: The root document's language attribute is currently English on every page. MUST keep every root document in sync when the site's primary language eventually changes.

**Guidelines:**

- MUST keep the root document's language attribute English on every page until a deliberate site-wide language change updates every root document together.
- SHOULD allow inline Japanese content inside English-root documents today without per-region language wrappers. When the site grows a multi-page Japanese surface, introduce language wrappers on the Japanese regions — but do not retrofit this change piecemeal; treat it as a site-wide decision.

## Motion Preferences

Motion Preferences captures the project-specific context for the checklist below: The project does not yet honor the reduced-motion preference. When introducing any new animation, SHOULD disable or shorten it for users who have requested reduced motion — this is the forward-looking rule for new work, even though existing animations (sepia fade, glitch layers) do not yet comply.

**Guidelines:**

- SHOULD disable or shorten any new animation for users who have requested reduced motion. This is the forward-looking rule for new work, even though existing animations (sepia fade, glitch layers) do not yet comply.
- MUST NOT introduce infinite or full-screen flashing motion without a reduced-motion fallback.

## Analytics, Overlays, Modals

Analytics, Overlays, Modals captures the project-specific context for the checklist below: Analytics event handlers on links MUST NOT interfere with the link's default navigation — a tracking call runs alongside the native click, not instead of it.

**Guidelines:**

- MUST NOT let analytics event handlers interfere with the link's default navigation — a tracking call runs alongside the native click, not instead of it.
- MUST use the native dialog element when introducing a modal or dialog, with its built-in accessible-name, focus-trap, and escape-to-close behavior, rather than rolling a custom overlay out of generic wrappers.
