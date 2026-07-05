# CSS Property Usage

Apply these rules when choosing between CSS properties and values in any component stylesheet. These rules sit on top of the CSS-Modules / `@layer components` / `clsx` mechanics defined in [styling.md](./styling.md); this document deliberately does not restate those mechanics. The design-decision rationale behind the tokens and tiers referenced here (palette semantics, shape language, motion taste, layout posture) lives in [ui-design-principles › design-tone-and-taste](../../ui-design-principles/references/design-tone-and-taste.md).

## Logical Properties

Logical Properties sets the required project default: write direction-agnostic, logical-property CSS throughout. Physical synonyms are only acceptable when the property itself has no logical equivalent (e.g., `transform`, `object-fit`, `aspect-ratio`).

**Guidelines:**

- MUST write direction-agnostic, logical-property CSS throughout. Physical synonyms are only acceptable when the property itself has no logical equivalent (e.g., `transform`, `object-fit`, `aspect-ratio`).
  - Use `margin-block` / `margin-inline` instead of `margin-top` / `margin-bottom` / `margin-left` / `margin-right`.
  - Use `padding-block` / `padding-inline` instead of their physical counterparts.
  - Use `inline-size` / `block-size` / `max-inline-size` / `min-block-size` instead of `width` / `height` / `max-width` / `min-height` when sizing content boxes. Physical `width` / `height` MAY remain for graphical elements that have an intrinsic orientation (images, SVGs, skeleton rectangles).
  - Use `inset-block-*` / `inset-inline-*` for absolutely positioned elements.
  - Use `border-inline-start` / `border-block-end` for directional borders; `border-left` remains acceptable only when the property is already canonicalized (e.g., the blockquote accent currently uses `border-left` — prefer `border-inline-start` in new code).
- SHOULD use the `start` / `end` keywords on `text-align` (`text-align: start` / `text-align: end`) rather than `left` / `right`.
- MUST NOT mix directional paradigms on the same element (e.g., `margin-block-start: 8px; margin-bottom: 8px;`).

## Design Tokens Only

Design Tokens Only sets the required project default: draw all color, spacing, radius, duration, easing, and font values from the tokens declared in `app/(app)/variables.css`.

**Guidelines:**

- MUST draw all color, spacing, radius, duration, easing, and font values from the tokens declared in `app/(app)/variables.css`.
  - Spacing: `--size-1` (1px) … `--size-960` (60rem). Numbers correspond to pixel equivalents.
  - Radii: `--radius-xs` / `--radius-sm` / `--radius-md` / `--radius-lg` / `--radius-full`.
  - Durations: `--duration-sm` / `--duration-md` / `--duration-lg` / `--duration-xl` / `--duration-2xl` / `--duration-3xl`.
  - Easing: `--ease-in-out` (the only easing token).
  - Fonts: `--font-sans` / `--font-mono`, paired with `--font-sans-features` / `--font-mono-features`.
  - Color: `--accent-*` / `--neutral-*`. Semantic slot reference is in [ui-design-principles › design-tone-and-taste](../../ui-design-principles/references/design-tone-and-taste.md).
- MUST NOT introduce hard-coded color, spacing, radius, or duration literals in component CSS. The general prohibition is in [styling.md](./styling.md); this file reinforces that the ban applies to duration / easing / font tokens as well.
- MAY introduce component-scoped CSS variables when a value needs to vary by context (see the `--max-width` / `--variant` / `--page-variant` / `--blog-post-content-negative-margin` / `--snippet-token-*` patterns). Component-scoped variables MUST still resolve to one of the root tokens somewhere in the chain — do not terminate a `--my-color: #fff` with a literal.

## OKLCH and Relative Color

OKLCH and Relative Color sets the required project default: express all new color values in `oklch()` rather than `rgb()` / `hsl()` / hex. Every root palette token is defined in `oklch()`, and mixing color spaces produces visible hue shifts.

**Guidelines:**

- MUST express all new color values in `oklch()` rather than `rgb()` / `hsl()` / hex. Every root palette token is defined in `oklch()`, and mixing color spaces produces visible hue shifts.
- SHOULD derive contextual accent variants using **relative color syntax** on top of a numbered token, not by adding a new top-level token:
  ```css
  background-color: oklch(from var(--accent-11) l c h / 0.5);
  color: oklch(from var(--accent-11) l calc(c * 0.666) calc(h - 128));
  ```
- MUST keep the `l` / `c` / `h` channels coherent — if the derivation is about hue only, preserve `l` and `c` so the derived color sits at the same perceptual lightness as its parent. The Shiki token palette in `snippet.module.css` is the canonical example.
- SHOULD NOT write an `@media (prefers-color-scheme: dark) { ... }` override that merely reassigns a numbered token. If dark-mode parity needs an override, that is a signal to reconsider the step choice or to introduce a theme-aware derivation rather than a fork.

## Responsive Layout

Responsive Layout sets the required project default: prefer `@container` queries over `@media` queries for layout adaptation. The body element is declared as a container (`container: body / inline-size`), and every major surface opens its own named or anonymous container when it needs internal breakpoints.

- The project uses a **`--variant` / `--page-variant` custom-property convention** to propagate responsive state downward:
  ```css
  :where(:scope) {
    --variant: "mobile";

    @container (width > 50rem) {
      --variant: "desktop";
    }
  }

  .child {
    @container style(--variant: "desktop") {
      /* desktop-only styles */
    }
  }
  ```
When adding a new responsive surface, follow this exact pattern: declare `--variant` at the scope root, branch the value inside `@container (width > …)`, then consume via `@container style(--variant: "…")` in children.

**Guidelines:**

- MUST prefer `@container` queries over `@media` queries for layout adaptation. The body element is declared as a container (`container: body / inline-size`), and every major surface opens its own named or anonymous container when it needs internal breakpoints.
- SHOULD reuse the canonical project breakpoints for reading surfaces: `width > 30rem` (mobile→tablet) and `width > 50rem` (tablet→desktop). The semantic meaning of each tier and the structural transformations expected at each transition are defined in [ui-design-principles › responsive-layout](../../ui-design-principles/references/responsive-layout.md). Note that the CSS `--variant` / `--page-variant` custom property is binary (`"mobile"` vs `"desktop"`) and flips at the 30rem boundary — it does not distinguish tablet from desktop, because no structural transformation fires at the tablet→desktop boundary.
- SHOULD name containers when a descendant needs to query a specific ancestor (e.g., `container: blog-post-content / inline-size` → `@container blog-post-content style(--variant: "desktop")`). Anonymous `@container` queries are acceptable when the nearest container is unambiguous.
- SHOULD reserve `@media` queries for page-level concerns that are not inline-size-driven: `prefers-color-scheme`, `prefers-reduced-motion` (not currently wired), `print` (not currently wired).

## Scoping and Specificity

Scoping and Specificity sets the required project default: wrap every component's styles in `@scope (.<componentRoot>) { ... }` to isolate selectors from other components. This is paired with the `@layer components` placement from [styling.md](./styling.md).

**Guidelines:**

- MUST wrap every component's styles in `@scope (.<componentRoot>) { ... }` to isolate selectors from other components. This is paired with the `@layer components` placement from [styling.md](./styling.md).
- MUST use `:where(:scope)` (or `:where(<selector>)`) to declare rules on the scope root or shared wrappers without contributing specificity. The flat-specificity discipline lets the `className` prop override safely via `clsx`.
- MUST NOT nest one `@scope` inside another.
- MAY declare separate `@scope` blocks per component root within the same module file when a file defines multiple exported components (see `loaded.module.css` in `webembed/` and `blog-post-list/` for the two-scope pattern).
- MUST NOT write descendant selectors that pierce another component's scope (e.g., `.blogPostContent .snippet .viewer`). Cross-component styling MUST go through `className` override or a root-level token.

## Modern Units

Modern Units captures the project-specific context for the checklist below: `width: stretch` / `height: stretch` are the preferred way to fill the parent inline / block axis. `100%` MAY remain when the parent context requires it. The project also uses `width: 100dvw` for full-viewport elements.

- Container-relative units are preferred where appropriate:
  - `cqw` / `cqh` / `cqi` / `cqb` for sizes measured against the nearest container.
  - `dvh` / `dvi` / `svh` / `lvh` for viewport-relative sizes (the body uses `min-block-size: 100dvh`).
- Line- and character-relative units are idiomatic:
  - `1lh` for vertical rhythm that tracks the element's current line-height (`max-height: calc(attr(data-max-lines number, 9999) * 1lh)` in the loading placeholder).
  - `1ch` for monospace column widths (`width: attr(data-length ch)`).

**Guidelines:**

- SHOULD prefer `width: stretch` / `height: stretch` to fill the parent inline / block axis.
- MAY keep `100%` when the parent context requires it.
- MAY use `width: 100dvw` for full-viewport elements.
- MUST NOT introduce `px` literals for sizing — derive from the `--size-*` scale. `px` values remain acceptable only in legacy inline SVG attributes (`width="24"` on icons) and in specific pixel-precise graphic sizes (`--size-1: 1px`, `0.5px` border hairlines inside `.code`).

## Theme and Color-Scheme

Theme and Color-Scheme sets the required project default: rely on the project's color-scheme plumbing:

**Guidelines:**

- MUST rely on the project's color-scheme plumbing:
  - `:root` declares `color-scheme: var(--theme)` with `--theme: light` by default and `--theme: dark` under `@media (prefers-color-scheme: dark)`.
  - `scrollbar-color` is themed via the accent ramp.
  - Surfaces that need to branch on theme SHOULD use `@container style(--theme: dark) { ... }` (the project's style-query bridge) rather than a component-local media query. Before reaching for this branch, confirm the design-side rules in [ui-design-principles › color-theming › legitimate-per-scheme-overrides](../../ui-design-principles/references/color-theming.md#legitimate-per-scheme-overrides) — per-surface dark-mode branches are only legitimate for filtered imagery.
- MUST use `currentColor` for SVG strokes and fills that track surrounding text color. The logo, social icons, and 404 underline patterns all depend on `color: var(--accent-11); fill: currentColor;`.

## Branded Imagery Filter

Thumbnails and web-embed cover images share a single filter chain so external imagery joins the palette rather than sitting beside it. The design-intent description of the four passes and the four-category imagery taxonomy live in [ui-design-principles › design-tone-and-taste › imagery-treatment](../../ui-design-principles/references/design-tone-and-taste.md#imagery-treatment); the canonical per-scheme saturation / brightness values live in [ui-design-principles › color-theming › imagery-brightness-compensation](../../ui-design-principles/references/color-theming.md#imagery-brightness-compensation).

**Guidelines:**

- MUST use the canonical filter expression verbatim on any new branded-imagery surface:
  ```css
  filter:
    sepia(1)
    saturate(var(--saturation))
    hue-rotate(calc(var(--accent-hue) - 92deg))
    brightness(var(--brightness));
  ```

- MUST NOT hard-code literal numbers inside the filter expression — keeping the values in scoped custom properties is what makes the per-scheme override declarative.
- MUST declare `--saturation` and `--brightness` on the imagery's own `@scope` root, with per-scheme values switched via `@container style(--theme: dark) { ... }` and hover values switched via the `:hover` selector on the parent surface.
- MUST NOT retune the `-92deg` offset per surface; it is a design-side calibration that aligns the sepia'd photo with the brand hue.
- MUST treat any warranted re-calibration as a global design change.
- MUST NOT use this filter chain on in-content imagery (blog-post `<Media>` and plain `<img>`). Its only permitted scheme adjustment is `filter: brightness(0.9)` in dark mode to keep light-mode-authored images from overpowering the inverted background.

## Type Features

Type Features sets the required project default: pair every font family declaration with its feature-settings variable: `font-family: var(--font-mono); font-feature-settings: var(--font-mono-features);`. Setting one without the other produces glyph mismatches between layouts.

**Guidelines:**

- MUST pair every font family declaration with its feature-settings variable: `font-family: var(--font-mono); font-feature-settings: var(--font-mono-features);`. Setting one without the other produces glyph mismatches between layouts.
- MUST declare `tab-size` explicitly on code-display surfaces (the snippet viewer uses `tab-size: 2`) — leaving it at the browser default produces inconsistent indent widths across platforms.

## Selection and Clipping

Selection and Clipping describes the preferred project default: use `-webkit-box` with `-webkit-line-clamp` + `-webkit-box-orient: vertical` + `overflow: hidden` for multi-line truncation (see `.description` / `.brief` / `.url` in the web-embed and blog-post list). Pair with `text-overflow: ellipsis` + `white-space: nowrap` for single-line truncation (see `.title`).

- `word-break: break-word` is the default for long-form body copy (`.p`, `.code`). Do not set it on short labels (titles, tags, timestamps).

**Guidelines:**

- SHOULD use `-webkit-box` with `-webkit-line-clamp` + `-webkit-box-orient: vertical` + `overflow: hidden` for multi-line truncation (see `.description` / `.brief` / `.url` in the web-embed and blog-post list). Pair with `text-overflow: ellipsis` + `white-space: nowrap` for single-line truncation (see `.title`).

## Transitions and Hover State

Transitions and Hover State captures the project-specific context for the checklist below: Interactive hover transitions MUST use the medium duration token paired with `ease-in-out`, as in `transition: background-color var(--duration-md) ease-in-out`. Project convention inlines the `ease-in-out` keyword inside `transition` shorthands for parity with CSS defaults; the `var(--ease-in-out)` token is reserved for standalone `animation-timing-function` / `transition-timing-function` declarations.

- Long atmospheric reveals (thumbnail sepia fade on initial load) use a literal `3s ease-in-out` rather than a token, because the 3-second cadence is distinct from interactive motion and does not belong on the `--duration-*` tier. Reuse the 3-second value when introducing additional slow reveals; promote it to a new `--duration-*` token only if the value needs to recur in ≥ 3 places.

**Guidelines:**

- MUST use the medium duration token paired with `ease-in-out` for interactive hover transitions, as in `transition: background-color var(--duration-md) ease-in-out`. Project convention inlines the `ease-in-out` keyword inside `transition` shorthands for parity with CSS defaults; the `var(--ease-in-out)` token is reserved for standalone `animation-timing-function` / `transition-timing-function` declarations.
- MUST use `transition: filter var(--duration-md) ease-in-out` for image-filter hover transitions (brightness bump on thumbnails).
- MUST toggle only the scoped `--brightness` / `--saturation` custom properties for image-filter hover transitions — never rewrite the whole `filter` chain per state. Re-authoring the chain per state detaches the image from the per-scheme compensation recipe defined in [ui-design-principles › color-theming › imagery-brightness-compensation](../../ui-design-principles/references/color-theming.md#imagery-brightness-compensation).

## Scroll-Driven Animations

Scroll-Driven Animations sets the required project default: wrap any use of `animation-timeline: scroll()` (or a named scroll timeline) in `@supports (animation-timeline: scroll())` so browsers that do not implement scroll-driven animations fall back to the non-animated resting state.

**Guidelines:**

- MUST wrap any use of `animation-timeline: scroll()` (or a named scroll timeline) in `@supports (animation-timeline: scroll())` so browsers that do not implement scroll-driven animations fall back to the non-animated resting state.
- MUST NOT make animated visuals (e.g., edge fades, pinned gradients, sticky overlays) themselves be the scroll container. The default `animation-timeline: scroll()` resolves to the nearest scrollable ancestor, which will skip a non-scrolling wrapper and fall through to the viewport.
- MUST use a **named scroll timeline** when animating an outer, non-scrolling ancestor against an inner scroll container: declare `scroll-timeline: --<name> inline;` (or `block`) on the actual scroll container, and expose it to the ancestor with `timeline-scope: --<name>;`. Pseudo-elements on the ancestor then reference `animation-timeline: --<name>;` to follow the inner element's scroll progress.
- SHOULD name the timeline with the component-scoped custom-property convention (project prefix + component + role, e.g., `--bpc-table-scroll`) so the timeline name does not collide with another component that later adopts the same pattern.
- MUST NOT reach for `animation-timeline: scroll()` without first confirming the element consuming the timeline is structurally related to the intended scroll container. A silent fall-through to the viewport is the failure mode this rule exists to prevent.

## Focus Ring

Focus Ring captures the project-specific context for the checklist below: Interactive surfaces MUST replace the default browser focus ring with the project's canonical `:focus-visible` pattern, not remove it outright. The design-side requirement is in [ui-design-principles › accessibility › keyboard-focus](../../ui-design-principles/references/accessibility.md#keyboard-focus).

- The canonical CSS template is:
  ```css
  .a {
    border-radius: var(--radius-sm);
    outline: none;
  }

  .a:focus-visible {
    outline: var(--accent-5) solid var(--size-3);
    outline-offset: var(--size-3);
  }
  ```

**Guidelines:**

- MUST replace the default browser focus ring on interactive surfaces with the project's canonical `:focus-visible` pattern, not remove it outright. The design-side requirement is in [ui-design-principles › accessibility › keyboard-focus](../../ui-design-principles/references/accessibility.md#keyboard-focus).
- MUST NOT retune the outline color, width, or offset per surface. The `--accent-5` palette token handles per-scheme contrast automatically; a per-surface override of any of these three properties is a design-level decision, not a component tweak.
- MUST match the focus target's `border-radius` to the surface's resting corner shape so the ring tracks the squircle silhouette rather than revealing a rectangular underlying box.

## Hit-Area Expansion

Hit-Area Expansion captures the project-specific context for the checklist below: Small interactive elements (inline icons, social-link glyphs) MUST expand their hit area beyond the icon's drawn bounds using the project's invisible padding + negative margin pattern, so the visual position does not move while the tap target grows to ~40×40. The design-side requirement is in [ui-design-principles › accessibility › tappable-target-size](../../ui-design-principles/references/accessibility.md#tappable-target-size).

- The canonical CSS template (from `social-link-list.module.css`):
  ```css
  .item {
    display: flex;
    padding: var(--size-8);
    margin: calc(var(--size-8) * -1);
    border-radius: var(--radius-md);
  }
  ```

**Guidelines:**

- MUST expand the hit area of small interactive elements (inline icons, social-link glyphs) beyond the icon's drawn bounds using the project's invisible padding + negative margin pattern, so the visual position does not move while the tap target grows to ~40×40. The design-side requirement is in [ui-design-principles › accessibility › tappable-target-size](../../ui-design-principles/references/accessibility.md#tappable-target-size).
- MUST match the padding value and its negation exactly so the surface's visible position is unchanged. The `border-radius` MUST come from the shared radius tier so the pressed-state background reads as on-brand rather than a generic hit-box.

## Intentional Exceptions

Intentional Exceptions captures the project-specific context for the checklist below: Physical `border-left` currently appears on `.blockquote`; new code SHOULD use `border-inline-start` and existing occurrences MAY be migrated opportunistically.

- Physical `width` / `height` are acceptable for: inline SVG icons sized by intrinsic px dimensions, skeleton placeholder rectangles, `100%` / `100dvh` full-surface claims, and `width: auto` / `height: auto` image reset.
- Pixel literals are acceptable inside: the 1px-like hairline borders (`var(--size-1)`, `0.5px`), SVG `width` / `height` attributes, and root-level definitions inside `variables.css`.

**Guidelines:**

- SHOULD use `border-inline-start` for new code where physical `border-left` currently appears on `.blockquote`.
- MAY migrate existing physical `border-left` occurrences opportunistically.
