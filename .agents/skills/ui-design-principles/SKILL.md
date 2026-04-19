---
name: ui-design-principles
description: Use this skill whenever designing, writing, or reviewing any user-facing surface of this website from a UI/UX design perspective — picking colors/spacing/radii/duration tokens, deciding the look-and-feel of a new component or page, adapting a surface across mobile / tablet / desktop, verifying a surface in light and dark modes, writing UI copy/labels, designing loading or empty states, or adding ARIA/alt/focus affordances. Covers the developer-flavored visual identity (IBM Plex Sans + JetBrains Mono, angle-bracket logo, code-syntax error headings), the `--accent-*` / `--neutral-*` palette semantics driven by `--accent-hue` and a shared `--lightness-*` scale, the squircle shape language and `--radius-*` role assignments, motion taste (single `--ease-in-out` curve + `--duration-*` tier), imagery treatment (color-grading recipe — sepia wash + saturation boost + hue shift onto brand hue + per-scheme brightness — for branded imagery; unfiltered avatars; natural in-content media), responsive layout (the two canonical breakpoint transitions at `width > 30rem` and `width > 50rem`, the three named tiers mobile / tablet / desktop, shared `--max-width` reading surface, mobile→tablet structural transformations like stacked→grid cards or column→row intro or full-bleed→inset imagery, per-tier image aspect-ratio pairings), light/dark color theming (inverted `--lightness-*` scale keeping step-roles invariant across schemes, per-scheme imagery brightness/saturation compensation, the rule that per-surface `@theme: dark` branches are a design smell unless compensating filtered imagery, chrome/affordance auto-adaptation), `:focus-visible` rings, Japanese-primary / English-fallback copy with code-syntax error headings (`page.found === false`), loading placeholder shapes + `ViewTransition` list→detail continuity, the 404 glitch aesthetic, and the semantic-HTML + `role="img"` + `aria-label` + external-link `rel="noopener noreferrer"` requirements. Use even when the user only says "design", "palette", "look and feel", "theme", "dark mode", "light mode", "color scheme", "theming", "responsive", "breakpoint", "mobile", "tablet", "desktop", "a11y", "accessibility", "aria", "alt text", "copy", "wording", "color", "typography", "squircle", "loading state", "view transition", or "not found".
user-invocable: false
---

# UI Design Principles

Apply these rules whenever designing, writing, or reviewing any user-facing surface of this website from a UI/UX design perspective.

This skill governs the **design decisions** that sit on top of the component and styling mechanics defined in [react-component-guidelines](../react-component-guidelines/SKILL.md). For CSS-mechanic conventions — CSS-Module / `@layer components` / `clsx` wiring in [react-component-guidelines › styling](../react-component-guidelines/styling.md), and CSS property-choice rules (logical properties, `@container` / `@scope`, `oklch()` / relative color, modern units, `currentColor`, theme plumbing) in [react-component-guidelines › css-property-usage](../react-component-guidelines/css-property-usage.md) — defer to those files. This skill deliberately does not restate them.

## Design Tone and Taste

See [design-tone-and-taste.md](./design-tone-and-taste.md) for:

- The developer-flavored visual identity (angle-bracket wordmark, sans + Japanese-sibling + monospace type pairing, code-syntax voice in error and empty states)
- Color system: accent ramp (brand) vs neutral ramp (chrome), the single shared lightness axis, and the 13-step semantic role table (Step 0 page background → Step 12 high-contrast text)
- Shape language: the squircle corner profile and the extra-small / small / medium / large / full radius tier with role assignments
- Motion language: the single shared ease-in-out curve, the named duration tier, and the reserved multi-second atmospheric cadence
- Imagery treatment: the signature color-grading recipe (sepia wash → saturation boost → hue shift onto brand hue → per-scheme brightness) for thumbnails and web-embed images; natural in-content media; unfiltered circular avatars; palette-colored decorative marks
- Typography scale with named tiers and weight-as-semantic-hierarchy (regular body / medium links / semibold subheads / bold titles / black for emphasis inside headings)
- Layout posture: centered narrow reading column, shared per-tier column widths, mobile-only gutters, full-bleed as an intentional atmospheric choice

## Responsive Layout

See [responsive-layout.md](./responsive-layout.md) for:

- The two canonical breakpoint transitions (at ~480px and ~800px) and the three named tiers (mobile / tablet / desktop)
- Shared reading-column widths per tier (~448px tablet, ~736px desktop) for every reading surface
- The mobile-only ~16px horizontal-gutter rule and the coordinated tier-wide posture shift
- Mobile → tablet structural transformations (column→row, stacked→grid, full-bleed→inset, always-on fill→hover-only fill, snippet breakout collapse) — all structural shifts fire at this boundary, not at tablet→desktop
- Per-tier image aspect-ratio pairings (list-item `1600/600` ↔ `1600/1200` for morph continuity into the detail page)
- When full-bleed is legitimate, and how full-bleed elements transition to inset at tier shifts
- The rule that layout tiers react to the surface's own container, not the viewport

## Color Theming (Light / Dark)

See [color-theming.md](./color-theming.md) for:

- The shared lightness scale inverted end-to-end between schemes, so step-roles stay invariant and per-surface dark-mode forks become a design smell
- The two legitimate per-scheme override categories (filtered imagery; browser-level primitives like the system color-scheme declaration and scrollbar colors)
- Imagery brightness/saturation compensation recipe across branded thumbnails, in-content media, and the portrait foreground — including the light-hovers-bump / dark-hovers-reset rule
- Chrome / affordance auto-adaptation via palette tokens (scrollbar, selection, focus ring) and the prohibition on per-scheme overrides of these
- Palette-hue drift discipline and the single-brand-hue rule
- Dark-mode verification as a merge-gate discipline

## UI Labeling and Wording

See [ui-labeling-and-wording.md](./ui-labeling-and-wording.md) for:

- Primary copy language (Japanese) and the English-fallback pattern for readers in other locales
- Code-syntax voice in error / empty-state headings (`page.found === false`, `post.found === false`) paired with humanized Japanese subtext
- Sentence-case short imperatives for navigation copy (`Go back home`) and short English nouns for section headings (`Posts`)
- Accessibility strings for brand and social icons using canonical host names (`github.com`, `x.com`, `linkedin.com`, `btnopen.com`)
- Timestamp forms by surface type — relative on listings, absolute long-form on detail surfaces — and the requirement to route all date formatting through the shared date library
- Emoji prohibition in rendered UI copy
- Loading-placeholder sample text: lorem-style strings sized to match the real content's proportions, never real UI copy
- Brand wordmark `<btn open />` in browser-tab titles and the rule that metadata copy comes from the CMS, not route code

## Loading and Empty States

See [loading-and-empty-states.md](./loading-and-empty-states.md) for:

- The two placeholder primitives (rectangle for media, word-shaped pills for text) and the rule that sample text mirrors the real content's **shape**, not its meaning
- Loaded / loading visual parity — same outer dimensions, same spacing, same grid, only the content swaps
- Design intent for loading-boundary placement — size around the smallest meaningful region, never a full-page spinner
- View-transition usage for list-item → detail-page morphs, the `<entity>-<identifier>-<role>` transition-name pattern, and the pairing of image morph with a slow sepia fade-in
- The 404 aesthetic: glitched triplet of the big status number with two hue-offset layers and alternating noise masks, code-syntax heading, Japanese subtext, single `Go back home` escape hatch — no secondary actions
- Empty-state posture: muted message inside the container rather than collapsing the container, code-syntax heading voice where appropriate

## Accessibility

See [accessibility.md](./accessibility.md) for:

- Semantic region roles (page header, main, section, article, top-level heading, list + list-item, time) and the prohibition on faking them with generic wrappers
- Icon labeling: a single accessible name at the icon's outer boundary, decorative icons hidden from assistive tech
- Alt-text requirements and the priority chain for CMS-sourced media (author alt → upload alt → empty only when truly decorative)
- External-link isolation (new tab + no opener / referrer leakage), internal navigation routed through the internal-link primitive
- Focus visibility: every interactive surface shows a ring on keyboard focus; removing the default without a replacement is prohibited (canonical CSS template lives in `css-property-usage` under the `react-component-guidelines` skill)
- Theme and color parity — every surface legible in both schemes, no information conveyed through color alone, links always underlined
- Non-color hover affordances — every interactive state change carries a fill / underline / border delta, not just a color swap
- Tappable target size — ~40×40 minimum, via the invisible padding + negative-margin pattern (canonical CSS template in `css-property-usage`)
- Language attribute, reduced-motion rule for new animations, and the native-dialog requirement for any future modal
