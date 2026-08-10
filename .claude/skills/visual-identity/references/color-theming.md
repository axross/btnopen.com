# Color Theming (Light / Dark)

Apply these rules when reviewing how a surface behaves under the two color schemes. This file governs **the theming design decisions that determine whether a surface needs any per-scheme attention at all**, and **how imagery is compensated when it does**. The palette semantics and the role table are in [design-tone-and-taste › color-system](./design-tone-and-taste.md#color-system); the color-scheme plumbing and the per-surface scheme-branch mechanic are in [css-property-usage.md › Theme and Color Scheme](./css-property-usage.md#theme-and-color-scheme).

## Shared Lightness, Inverted Between Schemes

Shared Lightness, Inverted Between Schemes captures the project-specific context for the checklist below: Both the accent scale and the neutral scale MUST derive from this shared lightness axis so that a **role** resolves to the same meaning in both schemes — `component.<scheme>.rest` is "component background at rest" in both light and dark, even though its actual lightness value differs.

- Light and dark share a single lightness scale (step 0 through step 12). Dark mode re-declares each step's lightness such that the scale is **inverted end-to-end**: step 0 is the brightest value in light mode and the darkest in dark mode; step 12 is the reverse.
- Because each role is a fixed map onto one step, both schemes come free: a surface that picks the right role ADAPTS CORRECTLY without any per-surface override. This is the property that makes the palette work, and every other rule below is a consequence of preserving it.

**Guidelines:**

- MUST derive both scales from this shared lightness axis so that a role resolves to the same meaning in both schemes — `component.<scheme>.rest` is "component background at rest" in both light and dark, even though its actual lightness value differs.

## Step-Role Invariance

Role Invariance captures the project-specific context for the checklist below: A surface MUST pick its **role** by what the surface is, not by its light-mode appearance. "This is a subtle card background" → `--color-component-accent-rest`; never "this looks right because it's a light grey in light mode".

**Guidelines:**

- MUST pick a surface's role by what the surface is, not by its light-mode appearance. "This is a subtle card background" → `--color-component-accent-rest`; never "this looks right because it's a light grey in light mode".
- MUST NOT author a surface that fires under only one scheme. A per-surface dark-mode fork that merely reassigns a role is a strong signal that the wrong role was chosen upstream — fix the role, don't add a branch.
- MUST NOT cross schemes (e.g., accent → neutral) on hover because the cross-scheme result would look inconsistent across color schemes. Hover mirrors the resting role's logic: a card at `component.accent.rest` hovers to `component.accent.hovered` regardless of scheme.
- SHOULD verify that a new surface's dark-mode behavior is "acceptable without any override" before merging. If it is not acceptable, the fix is upstream (role choice), not a per-surface branch.

## Legitimate Per-Scheme Overrides

Only two categories of design element legitimately need a per-scheme override:

1. **Filtered imagery** — thumbnails, web-embed images, portrait foreground, in-content media. Because the color-grading recipe (see [design-tone-and-taste › imagery-treatment](./design-tone-and-taste.md#imagery-treatment)) is applied on top of an external photograph, the resulting luminance does not auto-adapt to the surface it sits on. Compensation is done per-scheme via the brightness recipe below.
2. **Browser-level primitives** — the system color-scheme declaration, scrollbar colors, text-selection colors. These ARE driven by palette tokens at the root and MUST NOT be redeclared per surface.

Any third category is a design smell; re-examine the step choice or the imagery filter before adding a branch.

**Guidelines:**

- MUST limit per-scheme overrides to filtered imagery or browser-level primitives unless a design-level exception is explicitly justified.

## Imagery Brightness Compensation

Imagery that receives the project's signature color-grading recipe (sepia wash → saturation boost → hue shift onto brand hue → brightness) MUST compensate its brightness and saturation per scheme. The canonical values:

| Surface | Light mode | Dark mode |
|---|---|---|
| Branded imagery at rest (list-item cover, web-embed card image) | saturation ×1.75, brightness 100% | saturation ×1.5, brightness 90% |
| Branded imagery on hover | brightness 110% | brightness 100% (reset, no bump) |
| In-content plain imagery (blog-post media, plain `<img>`) | unfiltered | brightness 90% |
| Index-page portrait foreground | sepia 0.5, saturation ×1.75 | same + brightness 90%, saturation ×2 |

Design rationale to keep in mind when adjusting these values:

- In **light mode**, filtered imagery sits on a bright surface; a slight over-brightening on hover (100% → 110%) brings the image forward. In **dark mode**, the image is already brighter than its surface, so hover RESETS to 100% (no further bump) — bumping further would create glare.

**Guidelines:**

- MUST NOT stack this compensation onto imagery that already runs through the sepia recipe — that pipeline has its own brightness parameter. In-content imagery inside blog posts is authored with an implicit light-mode assumption, so dark mode applies a subtle 90%-brightness pass to keep such images from overpowering the inverted background.
- MUST NOT introduce per-image brightness overrides at the post level. The compensation is a surface-type decision (thumbnail / embed / in-content), not a per-asset knob.

## Chrome and Affordance Auto-Adaptation

Chrome and Affordance Auto-Adaptation captures the project-specific context for the checklist below: Scrollbar colors, text-selection background, and focus-ring outlines MUST be driven by palette tokens so they auto-adapt across schemes. MUST NOT author per-scheme overrides for these.

**Guidelines:**

- MUST drive scrollbar colors, text-selection background, and focus-ring outlines by palette tokens so they auto-adapt across schemes.
- MUST keep focus-ring color, width, and offset identical across schemes; the palette token handles contrast. The outline design decision itself (width and offset) lives in [accessibility › keyboard-focus](./accessibility.md#keyboard-focus).
- MUST NOT retune hover deltas (`component.rest` → `component.hovered` on cards, `text.low` → `text.high` on icons) per scheme; the shared lightness curve is designed so the same one-slot delta reads correctly in both.

## Palette-Hue Drift

Palette-Hue Drift captures the project-specific context for the checklist below: The brand hue is a single global knob; rotating it recolors the entire brand ramp, keeps the neutral ramp slightly hue-coupled so neutrals don't feel disconnected from the brand, and propagates into the imagery recipe so filtered photos rotate along with the brand. A designer changing the hue MUST verify both schemes — a hue that reads well in light may appear muddy in dark (and vice versa) because accent saturation is applied at different lightness values per step.

**Guidelines:**

- MUST keep the brand hue as a single global knob; rotating it recolors the entire brand ramp, keeps the neutral ramp slightly hue-coupled so neutrals don't feel disconnected from the brand, and propagates into the imagery recipe so filtered photos rotate along with the brand.
- MUST verify both schemes when changing the brand hue because a hue that reads well in light may appear muddy in dark (and vice versa) due to different accent saturation per step.
- MUST NOT introduce a second brand hue, a dark-mode-only hue, or a per-surface hue override. Identity is carried by a single hue per site; the design has no concept of secondary accents.

## Testing Discipline

Testing Discipline captures the project-specific context for the checklist below: Before merging any new UI surface, MUST verify it in both schemes (browser devtools color-scheme emulation at minimum).

**Guidelines:**

- MUST verify every new UI surface in both schemes before merging (browser devtools color-scheme emulation at minimum).
- MUST NOT ship a surface that looks correct in one scheme but loses legibility in the other (see also [accessibility › theme-and-color-parity](./accessibility.md#theme-and-color-parity)). Contrast MUST remain legible in both schemes; `text.<scheme>.low` on `background.<scheme>.plain` is the project's baseline for text-on-background.
- SHOULD start root-cause investigation at role choice when a bug report describes "looks wrong in dark mode only"; the surface is usually picking the wrong role rather than needing a dark-mode branch.
