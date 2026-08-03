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

External Links captures the project-specific context for the checklist below: Every link pointing at an external origin MUST open in a new tab and MUST isolate the new tab from the originating page (no access back to the opener, no referrer leakage). The mechanical pairing of these attributes is in [css-property-usage.md](./css-property-usage.md).

**Guidelines:**

- MUST open every external-origin link in a new tab and isolate the new tab from the originating page (no access back to the opener, no referrer leakage). The mechanical pairing of these attributes is in [css-property-usage.md](./css-property-usage.md).
- MUST NOT apply external-link attributes to internal links. Internal navigation MUST use the project's internal-link primitive so client-side routing kicks in.

## Keyboard Focus

Keyboard Focus captures the project-specific context for the checklist below: Every interactive surface MUST show a visible focus indicator when reached by keyboard. Removing the browser's default focus ring without a replacement is prohibited.

**Guidelines:**

- MUST show a visible focus indicator on every interactive surface when it is reached by keyboard. Removing the browser's default focus ring without a replacement is prohibited.
- SHOULD use an accent-ramp step for the replacement ring and SHOULD match the surface's corner shape — a squircle card gets a squircle ring, a pill gets a pill ring. The canonical CSS template is in [css-property-usage.md › Focus Ring](./css-property-usage.md#focus-ring).
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

- The project's pattern is to expand the hit area invisibly by padding the interactive element and compensating with an outward margin, so the visual position does not move. The canonical CSS template is in [css-property-usage.md › Hit-Area Expansion](./css-property-usage.md#hit-area-expansion).

**Guidelines:**

- MUST give every interactive icon and small inline control an effective tap area of at least ~40×40 regardless of its visual size. The icon's drawn bounds are NOT the tap area.
- SHOULD inherit the shared rounded-corner tier so the pressed-state background reads as on-brand rather than as a generic hit-box.

## Language Attribute

Language Attribute captures the project-specific context for the checklist below: The root document's language attribute is negotiated per request, not fixed. `negotiateLocale` in `app/(app)/_/helpers/i18n.ts` takes an explicit `NEXT_LOCALE` cookie choice first, then the highest-quality `Accept-Language` entry that maps to a supported locale, then falls back to `defaultLocale` (`ja-JP`, keeping the site Japanese-primary). `htmlLangByLocale` narrows the result to the `ja` / `en` tag that reaches the attribute.

Three root documents render it: `app/(app)/layout.tsx` and `app/global-not-found.tsx` both resolve the live negotiated locale, while `app/(app)/global-error.tsx` uses `defaultLocale` because a last-resort error boundary cannot do request-time async work.

**Guidelines:**

- MUST render a new root document's language attribute from the negotiated locale via `htmlLangByLocale`, never as a hardcoded tag. Fall back to `defaultLocale` only where the document genuinely cannot await the negotiation, as `global-error.tsx` does.
- MUST mark a run of content whose language differs from the negotiated root with its own `lang` attribute, so a screen reader switches voice. The language switcher's per-locale options are the worked example: each carries `lang={locale}` because it names its own language rather than the document's.
- MUST NOT assume the root is English when authoring copy or choosing a font stack — the same page serves `ja` and `en` depending on the request.

## Motion Preferences

Motion Preferences captures the project-specific context for the checklist below: The project honors the reduced-motion preference on its looping and attention-grabbing motion, and not yet on its hover fades. Four stylesheets carry a `@media (prefers-reduced-motion: reduce)` guard — the loading placeholder's pulse, the not-found heading's glitch pseudo-elements, the index portrait's glitch layers, and the markdown table scrollbar's fade. The pattern to copy is a nested guard beside the declaration it cancels, setting `animation: none`, `transition: none`, or `display: none`.

Three filter and colour transitions remain unguarded: the blog post header's 3s sepia fade, the blog post list's hover fade, and the language switcher's transition. They are single-shot, user-initiated, and low-amplitude, which is why they were not the first to be covered — but they are the remaining gap, not the accepted state.

**Guidelines:**

- MUST pair any new looping, autoplaying, or full-screen motion with a `@media (prefers-reduced-motion: reduce)` guard that cancels it. Infinite or flashing motion without one is never acceptable.
- SHOULD guard a new single-shot transition too, and SHOULD add a guard to one of the three listed above when otherwise editing its stylesheet — that is how the remaining gap closes without a dedicated pass.
- SHOULD place the guard as a nested `@media` block beside the declaration it cancels rather than in a separate global block, so the two stay together when the rule moves.

## Analytics, Overlays, Modals

Analytics, Overlays, Modals captures the project-specific context for the checklist below: Analytics event handlers on links MUST NOT interfere with the link's default navigation — a tracking call runs alongside the native click, not instead of it.

**Guidelines:**

- MUST NOT let analytics event handlers interfere with the link's default navigation — a tracking call runs alongside the native click, not instead of it.
- MUST use the native dialog element when introducing a modal or dialog, with its built-in accessible-name, focus-trap, and escape-to-close behavior, rather than rolling a custom overlay out of generic wrappers.
