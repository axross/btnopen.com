# Accessibility

Apply these rules when designing any user-facing surface. These rules are absolute requirements; accessibility regressions are treated as correctness bugs, not polish items.

## Semantic Regions

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

- Inline icons that communicate meaning (logo, social icons, brand illustrations, web-embed fallback) MUST carry a single accessible name at the icon's outer boundary. The canonical-label strings are in [ui-labeling-and-wording › aria-label and alt strings](./ui-labeling-and-wording.md#aria-label-and-alt-strings).
- Inner paths MUST NOT receive their own label; only the outer icon boundary announces the name.
- Icons that are purely decorative (a graphical flourish behind text, a visual divider) MUST be hidden from assistive tech — either announced as "decorative" or wrapped in a decorative parent that is itself hidden.
- MUST NOT rely on an icon's hover-tooltip alone as the accessible name — tooltips are supplemental, not primary.

## Decorative Text

- Purely decorative text content (the giant `404` glyph on the not-found surface) MUST be hidden from assistive tech so the accessible name comes from the real heading, not the decorative number.
- MUST NOT hide meaningful copy from assistive tech to work around a layout issue — if the copy would confuse a screen-reader user, rework the layout.

## Images

- Every image MUST carry alt text.
- CMS-sourced media MUST fall through this priority chain: author-supplied alt → the media upload's own alt → empty string (only when the image is genuinely decorative).
- Thumbnail and cover images MUST describe the depicted subject by using the post title. Avatars MUST use the person's display name.
- MUST NOT leave alt empty on images that convey meaning; empty alt is a last-resort signal for truly decorative uploads, not a default.

## External Links

- Every link pointing at an external origin MUST open in a new tab and MUST isolate the new tab from the originating page (no access back to the opener, no referrer leakage). The mechanical pairing of these attributes is in [react-component-guidelines › css-property-usage](../react-component-guidelines/css-property-usage.md).
- Internal navigation MUST use the project's internal-link primitive so client-side routing kicks in; the external-link attributes MUST NOT be applied to internal links.

## Keyboard Focus

- Every interactive surface MUST show a visible focus indicator when reached by keyboard. Removing the browser's default focus ring without a replacement is prohibited.
- The replacement ring SHOULD use an accent-ramp step and SHOULD match the surface's corner shape — a squircle card gets a squircle ring, a pill gets a pill ring. The canonical CSS template is in [react-component-guidelines › css-property-usage › focus-ring](../react-component-guidelines/css-property-usage.md#focus-ring).
- The ring's width, offset, and color MUST NOT be re-tuned per surface — the shared template is what makes focus affordances feel consistent across the site.
- MUST preserve keyboard focusability on every clickable surface. Removing a surface from the tab order for styling convenience is prohibited.

## Theme and Color Parity

- Every surface MUST remain legible in both light and dark schemes. A surface that looks correct in one scheme but loses contrast in the other is a design bug, not a polish item. The full theming philosophy (step-role invariance, legitimate per-scheme overrides, imagery compensation) lives in [color-theming.md](./color-theming.md); the step-role meanings are in [design-tone-and-taste › color system](./design-tone-and-taste.md#color-system).
- The project's baseline for text-on-background contrast is the highest-contrast text step against the page background step. MUST NOT ship a surface whose text falls below this baseline in either scheme.
- MUST NOT convey state through color alone. Every interactive state change (hover, active, selected, error) MUST also carry a non-color signal — a background fill, an underline, a border, or a shape change.
- Links MUST retain a visible underline offset from the baseline. Color-only link treatment is not acceptable.

## Hover and Interactive Affordances

- Every interactive surface MUST have a visible non-color hover affordance that reads the same way to colorblind and low-vision users as it does to everyone else:
  - **Text links** pick up a background-fill swap (one-step-up on the accent ramp).
  - **Cards** swap their background one step up on their resting ramp and MAY bump the image brightness.
  - **Icons** swap both the stroke color and a subtle background pill one step up on their resting ramp.
- MUST NOT implement hover with a color change alone — the hover must be perceivable without the color cue.
- The hover step deltas MUST remain consistent with the step-role table in [design-tone-and-taste › color system](./design-tone-and-taste.md#color-system); cross-ramp hover (accent → neutral or vice versa) is prohibited because the result looks inconsistent across schemes.

## Tappable Target Size

- Every interactive icon and small inline control MUST have an effective tap area of at least ~40×40 regardless of its visual size. The icon's drawn bounds are NOT the tap area.
- The project's pattern is to expand the hit area invisibly by padding the interactive element and compensating with an outward margin, so the visual position does not move. The canonical CSS template is in [react-component-guidelines › css-property-usage › hit-area-expansion](../react-component-guidelines/css-property-usage.md#hit-area-expansion).
- SHOULD inherit the shared rounded-corner tier so the pressed-state background reads as on-brand rather than as a generic hit-box.

## Language Attribute

- The root document's language attribute is currently English on every page. MUST keep every root document in sync when the site's primary language eventually changes.
- Inline Japanese content inside English-root documents is accepted today without per-region language wrappers. When the site grows a multi-page Japanese surface, SHOULD introduce language wrappers on the Japanese regions — but do not retrofit this change piecemeal; treat it as a site-wide decision.

## Motion Preferences

- The project does not yet honor the reduced-motion preference. When introducing any new animation, SHOULD disable or shorten it for users who have requested reduced motion — this is the forward-looking rule for new work, even though existing animations (sepia fade, glitch layers) do not yet comply.
- MUST NOT introduce infinite or full-screen flashing motion without a reduced-motion fallback.

## Analytics, Overlays, Modals

- Analytics event handlers on links MUST NOT interfere with the link's default navigation — a tracking call runs alongside the native click, not instead of it.
- The project does not currently use modals or dialogs. When introducing one, MUST use the native dialog element (with its built-in accessible-name, focus-trap, and escape-to-close behavior) rather than rolling a custom overlay out of generic wrappers.
