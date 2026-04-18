# CSS Property Usage

Apply these rules when choosing between CSS properties and values in any component stylesheet. These rules sit on top of the CSS-Modules / `@layer components` / `clsx` mechanics defined in [react-component-guidelines › styling](../react-component-guidelines/styling.md); this document deliberately does not restate those mechanics.

## Logical Properties

- MUST write direction-agnostic, logical-property CSS throughout. Physical synonyms are only acceptable when the property itself has no logical equivalent (e.g., `transform`, `object-fit`, `aspect-ratio`).
  - Use `margin-block` / `margin-inline` instead of `margin-top` / `margin-bottom` / `margin-left` / `margin-right`.
  - Use `padding-block` / `padding-inline` instead of their physical counterparts.
  - Use `inline-size` / `block-size` / `max-inline-size` / `min-block-size` instead of `width` / `height` / `max-width` / `min-height` when sizing content boxes. Physical `width` / `height` MAY remain for graphical elements that have an intrinsic orientation (images, SVGs, skeleton rectangles).
  - Use `inset-block-*` / `inset-inline-*` for absolutely positioned elements.
  - Use `border-inline-start` / `border-block-end` for directional borders; `border-left` remains acceptable only when the property is already canonicalized (e.g., the blockquote accent currently uses `border-left` — prefer `border-inline-start` in new code).
- SHOULD use the `start` / `end` keywords on `text-align` (`text-align: start` / `text-align: end`) rather than `left` / `right`.
- MUST NOT mix directional paradigms on the same element (e.g., `margin-block-start: 8px; margin-bottom: 8px;`).

## Design Tokens Only

- MUST draw all color, spacing, radius, duration, easing, and font values from the tokens declared in `app/(app)/variables.css`.
  - Spacing: `--size-1` (1px) … `--size-960` (60rem). Numbers correspond to pixel equivalents.
  - Radii: `--radius-xs` / `--radius-sm` / `--radius-md` / `--radius-lg` / `--radius-full`.
  - Durations: `--duration-sm` / `--duration-md` / `--duration-lg` / `--duration-xl` / `--duration-2xl` / `--duration-3xl`.
  - Easing: `--ease-in-out` (the only easing token).
  - Fonts: `--font-sans` / `--font-mono`, paired with `--font-sans-features` / `--font-mono-features`.
  - Color: `--accent-*` / `--neutral-*`. Semantic slot reference is in [design-tone-and-taste.md](./design-tone-and-taste.md).
- MUST NOT introduce hard-coded color, spacing, radius, or duration literals in component CSS. The general prohibition is in [react-component-guidelines › styling](../react-component-guidelines/styling.md); this skill reinforces that the ban applies to duration / easing / font tokens as well.
- MAY introduce component-scoped CSS variables when a value needs to vary by context (see the `--max-width` / `--variant` / `--page-variant` / `--blog-post-content-negative-margin` / `--snippet-token-*` patterns). Component-scoped variables MUST still resolve to one of the root tokens somewhere in the chain — do not terminate a `--my-color: #fff` with a literal.

## OKLCH and Relative Color

- MUST express all new color values in `oklch()` rather than `rgb()` / `hsl()` / hex. Every root palette token is defined in `oklch()`, and mixing color spaces produces visible hue shifts.
- SHOULD derive contextual accent variants using **relative color syntax** on top of a numbered token, not by adding a new top-level token:
  ```css
  background-color: oklch(from var(--accent-11) l c h / 0.5);
  color: oklch(from var(--accent-11) l calc(c * 0.666) calc(h - 128));
  ```
- MUST keep the `l` / `c` / `h` channels coherent — if the derivation is about hue only, preserve `l` and `c` so the derived color sits at the same perceptual lightness as its parent. The Shiki token palette in `snippet.module.css` is the canonical example.
- SHOULD NOT write an `@media (prefers-color-scheme: dark) { ... }` override that merely reassigns a numbered token. If dark-mode parity needs an override, that is a signal to reconsider the step choice or to introduce a theme-aware derivation rather than a fork.

## Responsive Layout

- MUST prefer `@container` queries over `@media` queries for layout adaptation. The body element is declared as a container (`container: body / inline-size`), and every major surface opens its own named or anonymous container when it needs internal breakpoints.
- The canonical project breakpoints for reading surfaces are `width > 30rem` (mobile→compact-desktop) and `width > 50rem` (wide-desktop). SHOULD reuse these thresholds rather than inventing new ones.
- SHOULD name containers when a descendant needs to query a specific ancestor (e.g., `container: blog-post-content / inline-size` → `@container blog-post-content style(--variant: "desktop")`). Anonymous `@container` queries are acceptable when the nearest container is unambiguous.
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
  When adding a new responsive surface, SHOULD follow this exact pattern: declare `--variant` at the scope root, branch the value inside `@container (width > …)`, then consume via `@container style(--variant: "…")` in children.
- `@media` queries SHOULD be reserved for page-level concerns that are not inline-size-driven: `prefers-color-scheme`, `prefers-reduced-motion` (not currently wired), `print` (not currently wired).

## Scoping and Specificity

- MUST wrap every component's styles in `@scope (.<componentRoot>) { ... }` to isolate selectors from other components. This is paired with the `@layer components` placement from [react-component-guidelines › styling](../react-component-guidelines/styling.md).
- MUST use `:where(:scope)` (or `:where(<selector>)`) to declare rules on the scope root or shared wrappers without contributing specificity. The flat-specificity discipline lets the `className` prop override safely via `clsx`.
- `@scope` blocks MAY be declared per-component-root within the same module file when a file defines multiple exported components (see `loaded.module.css` in `webembed/` and `blog-post-list/` for the two-scope pattern). MUST NOT nest one `@scope` inside another.
- MUST NOT write descendant selectors that pierce another component's scope (e.g., `.blogPostContent .snippet .viewer`). Cross-component styling MUST go through `className` override or a root-level token.

## Modern Units

- Container-relative units are preferred where appropriate:
  - `cqw` / `cqh` / `cqi` / `cqb` for sizes measured against the nearest container.
  - `dvh` / `dvi` / `svh` / `lvh` for viewport-relative sizes (the body uses `min-block-size: 100dvh`).
- Line- and character-relative units are idiomatic:
  - `1lh` for vertical rhythm that tracks the element's current line-height (`max-height: calc(attr(data-max-lines number, 9999) * 1lh)` in the loading placeholder).
  - `1ch` for monospace column widths (`width: attr(data-length ch)`).
- `width: stretch` / `height: stretch` are the preferred way to fill the parent inline / block axis. `100%` MAY remain when the parent context requires it. The project also uses `width: 100dvw` for full-viewport elements.
- MUST NOT introduce `px` literals for sizing — derive from the `--size-*` scale. `px` values remain acceptable only in legacy inline SVG attributes (`width="24"` on icons) and in specific pixel-precise graphic sizes (`--size-1: 1px`, `0.5px` border hairlines inside `.code`).

## Theme and Color-Scheme

- MUST rely on the project's color-scheme plumbing:
  - `:root` declares `color-scheme: var(--theme)` with `--theme: light` by default and `--theme: dark` under `@media (prefers-color-scheme: dark)`.
  - `scrollbar-color` is themed via the accent ramp.
  - Surfaces that need to branch on theme SHOULD use `@container style(--theme: dark) { ... }` (the project's style-query bridge) rather than a component-local media query.
- MUST use `currentColor` for SVG strokes and fills that track surrounding text color. The logo, social icons, and 404 underline patterns all depend on `color: var(--accent-11); fill: currentColor;`.

## Type Features

- MUST pair every font family declaration with its feature-settings variable: `font-family: var(--font-mono); font-feature-settings: var(--font-mono-features);`. Setting one without the other produces glyph mismatches between layouts.
- MUST declare `tab-size` explicitly on code-display surfaces (the snippet viewer uses `tab-size: 2`) — leaving it at the browser default produces inconsistent indent widths across platforms.

## Selection and Clipping

- SHOULD use `-webkit-box` with `-webkit-line-clamp` + `-webkit-box-orient: vertical` + `overflow: hidden` for multi-line truncation (see `.description` / `.brief` / `.url` in the web-embed and blog-post list). Pair with `text-overflow: ellipsis` + `white-space: nowrap` for single-line truncation (see `.title`).
- `word-break: break-word` is the default for long-form body copy (`.p`, `.code`). Do not set it on short labels (titles, tags, timestamps).

## Intentional Exceptions

- Physical `width` / `height` are acceptable for: inline SVG icons sized by intrinsic px dimensions, skeleton placeholder rectangles, `100%` / `100dvh` full-surface claims, and `width: auto` / `height: auto` image reset.
- Pixel literals are acceptable inside: the 1px-like hairline borders (`var(--size-1)`, `0.5px`), SVG `width` / `height` attributes, and root-level definitions inside `variables.css`.
- Physical `border-left` currently appears on `.blockquote`; new code SHOULD use `border-inline-start` and existing occurrences MAY be migrated opportunistically.
