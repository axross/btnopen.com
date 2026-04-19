# Design Tone and Taste

Apply these rules when establishing the visual language of any new surface and when reviewing whether an existing surface stays on-brand. This file describes **what the design feels like** and **what each named tier means semantically** — the palette ramps, the radius tier, the duration tier, the type scale. The implementation mechanics for enforcing these tiers in CSS live in [react-component-guidelines › css-property-usage](../react-component-guidelines/css-property-usage.md).

## Visual Identity

- The site carries a **developer-flavored, technical-but-playful** identity. Code-syntax flourishes appear where other sites would use marketing language, and technical numerics — status codes, timestamps, URLs — are celebrated in monospace rather than hidden. Any new surface SHOULD extend this voice rather than soften it.
- The mood is **monochromatic with a single accent**. MUST NOT introduce decorative ornament that breaks this restraint — no multi-hue gradients, drop shadows, or secondary accent hue.
- Identity is carried by one wordmark and one accent hue. MUST NOT introduce additional brand marks, mascots, or logo variants.

## Typography

- Type taste is **technical and utilitarian**: a single sans-serif family paired with its Japanese sibling for body copy, and a single monospace family reserved for content that is semantically technical. Monospace MUST NOT be used decoratively where the content is not technical — its intended homes are inline code, code blocks, URLs, status codes, and code-syntax error headings.
- Size and leading live on a **restrained, site-wide scale** with named tiers. Introducing a new size or leading value MUST go through the shared scale rather than a surface-local override; a size that does not fit any existing tier is a design-level decision, not a component-level tweak.
- Weight usage SHOULD read as a semantic hierarchy rather than a visual flourish:
  - **Regular (400)** — body text and ordered-list items.
  - **Medium (500)** — inline link anchors and light emphasis inside blockquotes.
  - **Semibold (600)** — subheadings, inline strong-emphasis in body, table headers, and definition terms.
  - **Bold (700)** — page and post titles, top-level headings, and primary-action link copy.
  - **Black (900)** — reserved for strong-emphasis **nested inside headings**; not a general-purpose emphasis weight.

## Color System

The palette taste is **Radix-inspired**: a 13-step semantic scale where each step has a defined role, and a single shared lightness axis powers both light and dark schemes. The *role* of each step stays identical across schemes, so a surface that picks the right step needs no per-scheme attention.

Two ramps share the scale:

- **Accent ramp** — the **brand ramp**. Used for anything that should visibly carry identity: links, selection, interactive hover, branded card surfaces.
- **Neutral ramp** — the **chrome ramp**. Used for anything that should read as neutral UI chrome rather than brand.

Pick a color by its semantic role on the scale, not by eyeball:

| Step | Role |
|---|---|
| 0 | Page / app background |
| 1 | Subtle app background |
| 2 | Subtle component background |
| 3 | Component background (rest) |
| 4 | Component background (hovered) |
| 5 | Component background (active / selected) |
| 6 | Subtle border on non-interactive |
| 7 | Subtle border on interactive |
| 8 | Hovered border |
| 9 | Solid background (rest) |
| 10 | Solid background (hover) |
| 11 | Low-contrast text |
| 12 | High-contrast text |

Operational rules for picking colors:

- SHOULD pair accent and neutral at the *same step number* when composing foreground-on-background — shared lightness means shared perceptual contrast.
- SHOULD derive one-off variants by tweaking a single channel (hue, chroma, or alpha) of a numbered step rather than introducing a brand-new color. Surface-local color overrides that do not resolve to a numbered step are a design smell.
- SHOULD NOT author a surface that only works in one color scheme. A dark-mode-only override is a signal that the wrong step was picked — see [color-theming.md](./color-theming.md) for the full light / dark theming philosophy and the narrow set of legitimate per-scheme overrides.
- Interactive hover SHOULD step *one notch up* on the same ramp rather than crossing ramps — a card resting at Step 3 hovers to Step 4; a transparent surface hovers to Step 2 or Step 3 depending on how prominent the hover should feel.

## Shape Language

- The site's shape taste is **squircle**, not a plain rounded corner: corners curve with a softer, more geometric profile than a traditional radius arc. The squircle treatment is established globally and MUST be preserved on any new surface that should read as branded.
- Radii live on a small, named tier — **extra-small / small / medium / large / full**. Role assignments:
  - **Medium** is the default for cards, images, focus rings, buttons, and hover surfaces.
  - **Small** is the default for inline chips (tags, inline code).
  - **Full** is reserved for capsule-shaped pills that must stay rounded at any height.
  - **Circular avatars** stay truly circular — the one explicit opt-out from the squircle tier.
- Introducing a sixth radius value is a design-level decision. A surface that feels like it needs one SHOULD first re-examine whether an existing tier reads correctly at its current size.

## Motion

- Motion taste is **restrained and consistent**: a single easing curve and a fixed duration tier. MUST use the project's shared ease-in-out curve everywhere; SHOULD NOT introduce additional curves.
- Duration role assignments on the named duration tier:
  - Interactive hover and background swaps use the **medium** duration — fast enough to feel immediate, slow enough not to flicker.
  - Longer, atmospheric reveals (e.g., thumbnail fade-in after load) MAY use a multi-second duration when the transition is clearly atmospheric rather than interaction feedback. The canonical 3-second sepia fade is the reference point.
- Skeleton pulses share one exact timing across the app so every placeholder pulses in phase — MUST reuse the established skeleton timing rather than introducing a new one.

## Imagery Treatment

Four imagery categories, each with a distinct treatment:

- **Branded imagery** — thumbnails and web-embed cover images — MUST run through the project's signature color-grading recipe so external imagery joins the palette rather than sitting beside it. The recipe applies four passes, in this order:
  - **Sepia wash** — strip the photo's original color entirely, leaving a brown monochrome.
  - **Saturation boost** — pump up the sepia tone so the next pass has rich color to rotate. Pushed harder in light mode than in dark mode.
  - **Hue shift onto the brand hue** — rotate the saturated sepia tone to land on (brand hue − 92°), so every branded photo tracks the brand hue automatically; a brand-hue change recolors every photo without per-image tuning. The 92° offset is a one-time calibration so the sepia'd image lands on the brand hue rather than its opposite — MUST NOT be retuned per surface.
  - **Per-scheme brightness** — keep the photo readable on the surface it sits on. Bumped slightly on hover in light mode; reset to rest on hover in dark mode (bumping further in dark mode would create glare).

  The exact saturation / brightness values per scheme and the light-hovers-bump / dark-hovers-reset rationale live in [color-theming › imagery-brightness-compensation](./color-theming.md#imagery-brightness-compensation).
- **In-content imagery** — media embedded inside blog-post body — MUST retain natural color and MUST NOT receive the sepia wash or hue shift. A subtle brightness reduction in dark mode is the only permitted adjustment, so images authored with a light-mode assumption do not overpower the inverted background.
- **Author avatars** MUST remain unfiltered and circular.
- **Decorative vector marks** (e.g., the portrait backdrop) MUST be colorable via the palette rather than baked-in colored assets — they are extensions of the palette, not standalone artwork.

## Layout Posture

- The reading posture is a **centered, narrow column**. Main content MUST respect this posture rather than sprawling edge-to-edge.
- Reading surfaces (blog-post body and header, and anything that should feel like prose) SHOULD share one canonical column width per tier, inherited from the page root rather than redeclared per surface.
- Horizontal gutters apply on mobile only; at wider tiers the shared column width and centered alignment already inset the content from the viewport edge.
- Full-bleed surfaces (mobile cover images, mobile code snippets) break out to the viewport edge by extending past the reading column's gutter. This treatment is reserved for content that wants to read as atmospherically large, not a default.

The breakpoint tiers, shared column widths, structural mobile→tablet transformations, and full-bleed-to-inset behavior are defined in [responsive-layout.md](./responsive-layout.md).
