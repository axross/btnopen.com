---
name: ui-design-principles
description: Use this skill whenever designing, writing, or reviewing any user-facing surface of this website — picking colors/spacing/radii/duration tokens, choosing between CSS properties, deciding the look-and-feel of a new component or page, writing UI copy/labels, designing loading or empty states, or adding ARIA/alt/focus affordances. Covers the developer-flavored visual identity (IBM Plex Sans + JetBrains Mono, angle-bracket logo, code-syntax error headings), the OKLCH-based `--accent-*` / `--neutral-*` palette driven by `--accent-hue` and a shared `--lightness-*` scale, the squircle shape language (`corner-shape: squircle` + `--radius-*`), motion tokens (`--duration-*` + `--ease-in-out`), imagery treatment (sepia + hue-rotate + per-theme brightness), the logical-property mandate (`margin-block`, `padding-inline`, `inline-size`, `block-size`, `100cqw`, `1lh`, `1ch`), `@container` inline-size queries and `@container style(--variant: "desktop")` style queries over `@media` for layout variants, `@scope` for component-level selector isolation, `oklch(from …)` relative color syntax, `currentColor` in SVGs, `:focus-visible` rings, Japanese-primary / English-fallback copy with code-syntax error headings (`page.found === false`), loading placeholder shapes + `ViewTransition` list→detail continuity, and the semantic-HTML + `role="img"` + `aria-label` + external-link `rel="noopener noreferrer"` requirements. Use even when the user only says "design", "palette", "look and feel", "theme", "dark mode", "a11y", "accessibility", "aria", "alt text", "copy", "wording", "color", "typography", "squircle", "oklch", "container query", "loading state", "view transition", or "not found".
user-invocable: false
---

# UI Design Principles

Apply these rules whenever designing, writing, or reviewing any user-facing surface of this website.

This skill governs the **design decisions** that sit on top of the component and styling mechanics defined in [react-component-guidelines › styling](../react-component-guidelines/styling.md) and [react-component-guidelines › conventions](../react-component-guidelines/conventions.md). Use those skills for CSS Module file rules, `@layer components` placement, `clsx` merging, style-isolation rules (no `position` / `margin` / root sizing), and `data-testid` conventions — this skill deliberately does not restate them.

## Design Tone and Taste

See [design-tone-and-taste.md](./design-tone-and-taste.md) for:

- The developer-flavored visual identity (angle-bracket logo, IBM Plex Sans + JetBrains Mono pairing, code-syntax voice in error and empty states)
- Color system: `--accent-*` vs `--neutral-*`, the `--accent-hue` + shared `--lightness-*` mechanism, light/dark theming
- Shape language: `corner-shape: squircle` + the `--radius-xs` → `--radius-lg` / `--radius-full` tier
- Motion language: the `--duration-sm` → `--duration-3xl` scale and the single `--ease-in-out` curve
- Imagery treatment: the sepia + hue-rotate + per-theme brightness recipe for thumbnails and web-embed images
- Typography scale (`--text-*`, `--leading-*`) and weight usage (400 body / 500 link / 600 strong and subheads / 700 titles / 900 inline-strong in headings)
- Layout posture: centered narrow column, container-query-driven responsiveness

## CSS Property Usage

See [css-property-usage.md](./css-property-usage.md) for:

- The logical-property mandate (`margin-block`, `padding-inline`, `border-inline-*`, `inline-size`, `block-size`, `inset-*`)
- Mandatory design tokens (color / spacing / radius / duration / ease / font) and the prohibition on hard-coded values
- `oklch()` and relative-color syntax (`oklch(from var(--accent-11) l c calc(h + 64))`) for derivations
- `@container` inline-size queries and `@container style(--variant: "desktop")` style queries over `@media` for layout variants, plus the `--variant` / `--page-variant` custom-property convention
- `@scope` for component-level selector isolation, paired with the `@layer components` placement rule
- Container-relative and modern units (`100cqw`, `1dvh`, `1lh`, `1ch`, `stretch`)
- `currentColor` for SVG strokes/fills, and `color-scheme` / `prefers-color-scheme` for theme-aware styling
- Font-feature activation via `--font-sans-features` / `--font-mono-features`

## UI Labeling and Wording

See [ui-labeling-and-wording.md](./ui-labeling-and-wording.md) for:

- Primary copy language (Japanese) and the English-fallback pattern for readers in other locales
- Code-syntax voice in error / empty-state headings (`page.found === false`, `post.found === false`) paired with Japanese subtext
- Sentence-case short imperatives for navigation copy (`Go back home`) and short English nouns for section headings (`Posts`)
- `aria-label` / `alt` strings for brand and social icons using canonical host names (`github.com`, `x.com`, `linkedin.com`, `btnopen.com`)
- Timestamp formatting (relative via `formatDistanceToNow` on list surfaces, absolute via `format(..., "PPP")` on detail headers)
- Emoji prohibition in rendered UI copy and source files
- Loading-placeholder sample text: lorem-style strings sized to match real content proportions, never real UI copy

## Loading and Empty States

See [loading-and-empty-states.md](./loading-and-empty-states.md) for:

- The `LoadingPlaceholderRect` / `LoadingPlaceholderText` shapes and the `data-length` + `data-max-lines` proportion conventions
- `<Suspense>` + loaded / loading component-pair visual parity (same layout, same outer dimensions — only the content swaps)
- `ViewTransition` usage for list-item → detail-page visual continuity (`blog-post-<slug>-image`, `…-timestamp`, `…-title` transition names)
- The 404 aesthetic: glitching `<p className={css.statusCode} aria-hidden="true">404</p>` with `noise-fast` / `noise-slow` keyframes, code-syntax heading, Japanese subtext, Go-back-home link
- Hover transition duration (`var(--duration-md)`) and filter transition duration (`3s` for thumbnail sepia fade) conventions
- Skeleton animation: the `pulse` keyframe on `--neutral-2` ↔ `--neutral-3`

## Accessibility

See [accessibility.md](./accessibility.md) for:

- Semantic landmark usage (`<header>`, `<main>`, `<section>`, `<article>`, `<nav>`, `<footer>`)
- Inline-SVG icon labeling: `role="img"` + `aria-label`, and `aria-hidden="true"` for purely decorative text
- `alt` text requirements on `<Image>`, including the `alt ?? fileAlt ?? ""` fallback used by `media.tsx`
- External anchors: `target="_blank"` paired with `rel="noopener noreferrer"`
- Focus visibility: `:focus-visible` outline using `var(--accent-*)` and `var(--size-3)` offset, never `outline: none` without a replacement
- Color-scheme-aware surfaces via `--lightness-*` + `prefers-color-scheme` / `@container style(--theme: dark)`
- Non-color hover affordances (background-color swaps on `--accent-2` / `--accent-3` / `--accent-4`)
- Minimum tappable-target size via padding + negative margin on link/button surfaces (e.g., social-link items)
