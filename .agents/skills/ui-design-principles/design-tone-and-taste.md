# Design Tone and Taste

Apply these rules when establishing the visual language of any new surface and when reviewing whether an existing surface stays on-brand. This file describes **what the design feels like** and **what each token tier means semantically**; the mechanics for enforcing tokens, units, and CSS features live in [css-property-usage.md](./css-property-usage.md).

## Visual Identity

- The site carries a **developer-flavored, technical-but-playful** identity. Code-syntax flourishes appear where other sites would use marketing language, and technical numerics — status codes, timestamps, URLs — are celebrated in monospace rather than hidden. Any new surface SHOULD extend this voice rather than soften it.
- The mood is **monochromatic with a single accent**. MUST NOT introduce decorative ornament that breaks this restraint — no multi-hue gradients, drop shadows, or secondary accent hue.
- Identity is carried by one wordmark and one accent hue. MUST NOT introduce additional brand marks, mascots, or logo variants.

## Typography

- Type taste is **technical and utilitarian**: a single sans-serif family paired with its Japanese sibling for body copy, and a single monospace family reserved for content that is semantically technical. Monospace MUST NOT be used decoratively where the content is not technical (inline code, code blocks, URLs, status codes, and code-syntax error headings are the intended homes).
- Size and leading live on a **restrained scale** — `--text-*` and `--leading-*` tiers. Introducing a new size or leading value MUST go through `variables.css` rather than being inlined in a component.
- Weight usage SHOULD read as a semantic hierarchy rather than a visual flourish:
  - `400` — body text and ordered-list items.
  - `500` — inline link anchors and light emphasis inside blockquotes.
  - `600` — subheadings, inline `<strong>` in body, table headers, and definition terms.
  - `700` — page and post titles, `h1`, and primary-action link copy.
  - `900` — reserved for `<strong>` **nested inside headings**; not a general-purpose emphasis weight.

## Color System

The palette taste is **Radix-inspired**: a 12-step semantic scale where each step has a defined role, a project-specific `-0` prepended for the page background, and a single shared `--lightness-*` axis that powers both light and dark modes. The *role* of each step stays identical across schemes, so a component that picks the right step needs no per-scheme override.

Two ramps share the scale:

- `--accent-*` — the **brand ramp**. Used for anything that should visibly carry identity: links, selection, interactive hover, branded card surfaces.
- `--neutral-*` — the **chrome ramp**. Used for anything that should read as neutral UI chrome rather than brand.

Pick a color by its semantic role on the scale, not by eyeball:

| Step | Role |
|---|---|
| `-0` (project extension) | Page / app background |
| `-1` | Subtle app background |
| `-2` | Subtle component background |
| `-3` | Component background (rest) |
| `-4` | Component background (hovered) |
| `-5` | Component background (active / selected) |
| `-6` | Subtle border on non-interactive |
| `-7` | Subtle border on interactive |
| `-8` | Hovered border |
| `-9` | Solid background (rest) |
| `-10` | Solid background (hover) |
| `-11` | Low-contrast text |
| `-12` | High-contrast text |

Operational rules for picking colors:

- SHOULD match accent and neutral at the *same step number* when composing foreground-on-background pairs — shared lightness means shared perceptual contrast.
- SHOULD derive one-off accent variants via relative color syntax on top of a numbered token rather than adding a new top-level token. The mechanics for this live in [css-property-usage.md › OKLCH and Relative Color](./css-property-usage.md).
- SHOULD NOT introduce component-level `@media (prefers-color-scheme: dark)` overrides when the right numbered token would already adapt. A theme override at the component level is a signal that the wrong step was picked.
- Interactive hover SHOULD step *one notch up* on the same ramp rather than crossing ramps — a card resting at `-3` hovers to `-4`; a transparent surface hovers to `-2` or `-3` depending on how prominent the hover should feel.

## Shape Language

- The site's shape taste is **squircle**, not circular: corners curve with a softer, more geometric profile than a traditional `border-radius` arc. The squircle treatment is established globally and MUST be preserved on any new surface that should read as branded.
- Radii live on a small, named tier (`--radius-xs` / `--radius-sm` / `--radius-md` / `--radius-lg` / `--radius-full`). Role assignments:
  - **Medium** is the default for cards, images, focus-rings, buttons, and hover surfaces.
  - **Small** is the default for inline chips (tags, inline code).
  - **Full** is reserved for capsule-shaped pills that must stay rounded at any height.
  - **Circular avatars** stay truly circular via `border-radius: 50%` — the one explicit opt-out from the squircle tier.

## Motion

- Motion taste is **restrained and consistent**: a single easing curve and a fixed duration tier. MUST use `var(--ease-in-out)` as the easing; SHOULD NOT introduce additional curves.
- Duration role assignments on the `--duration-*` tier:
  - Interactive hover and background swaps use the medium duration — fast enough to feel immediate, slow enough not to flicker.
  - Longer, atmospheric reveals (e.g., thumbnail fade-in after load) MAY use seconds rather than the ms tokens when the transition is clearly atmospheric rather than interaction feedback.
- Skeleton pulses share one exact timing across the app so every placeholder pulses in phase — MUST reuse the established skeleton timing rather than introducing a new one.

## Imagery Treatment

Four imagery categories, each with a distinct treatment:

- **Branded imagery** — thumbnails and web-embed images — MUST run through the project's signature sepia + hue-rotate + per-theme brightness recipe so external imagery joins the palette rather than sitting beside it:
  ```css
  filter:
    sepia(1)
    saturate(var(--saturation))
    hue-rotate(calc(var(--accent-hue) - 92deg))
    brightness(var(--brightness));
  ```
  Saturation and brightness are parameterized per theme and bumped slightly on hover; the hue rotation tracks `--accent-hue`, which is why the treatment survives a brand-hue change without per-image tuning.
- **In-content imagery** — media embedded inside blog-post content — MUST retain natural color and MUST NOT receive the sepia / hue-rotate treatment. A subtle brightness compensation in dark mode is the only permitted filter, so images authored with a light-mode assumption do not overpower the inverted background.
- **Author avatars** MUST remain unfiltered and circular.
- **Decorative vector marks** (e.g., the portrait backdrop) MUST be colorable via the palette rather than baked-in colored assets — they are extensions of the palette, not standalone artwork.

## Layout Posture

- The reading posture is a **centered, narrow column**. Main content MUST respect this posture rather than sprawling edge-to-edge.
- Reading surfaces (blog post body and header, and anything that should feel like prose) SHOULD share one canonical content max-width per breakpoint, exposed via a `--max-width` custom property and the project's `@container` pattern — new reading surfaces SHOULD reuse these values rather than redefining them.
- Horizontal padding applies on mobile only; at wider breakpoints the constrained max-width and centered alignment already inset the content, so the padding resets.
- Full-bleed surfaces (cover images, code snippets) SHOULD break out to the viewport edge via a negative inline-margin equal to the content's horizontal padding, so they read as flush on mobile and realign with the column on desktop.
