---
name: visual-identity
description: The visual identity of btnopen.com and the CSS that encodes it — the brand half of UI work, which no general design capability can supply. Covers the developer-flavored design language (angle-bracket wordmark, squircle shape tier, accent/neutral ramps on one shared lightness axis, motion tiers, the signature image color-grading recipe), the two breakpoints and per-tier reading-column widths, light/dark theming by scale inversion, Japanese-primary copy with its code-syntax error voice, loading-placeholder and 404 aesthetics, the project's accessibility commitments, and the CSS Modules, design-token, and modern-property conventions that implement all of it.
when_to_use: Use when designing, building, or reviewing any user-facing surface of this website — choosing a color role, radius, duration, or type tier; deciding responsive behavior; writing or reviewing a CSS Module; writing UI copy or an accessible name; building a loading, empty, or not-found state. Pair it with the general high-fidelity UI design capability, which owns craft such as contrast targets and interaction-state completeness, and with the React component styling capability, which owns styling mechanics in the abstract; this skill owns what is specific to this site.
user-invocable: false
---

# Visual Identity

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119.html).

Apply this skill whenever designing, writing, or reviewing a user-facing surface of this website.

It holds the half of UI work that is particular to btnopen.com: what the site looks like, what each named tier means here, and the CSS conventions that carry those decisions into stylesheets. The general craft sits in installed capabilities and is not restated — the high-fidelity UI design capability owns contrast targets, hierarchy, and interaction-state completeness; the React component styling capability owns styling mechanics such as token layering and adaptive rules in the abstract; the wireframe design capability owns low-fidelity layout exploration. When one of those says "the project's convention", this is the convention.

File placement, naming, and test hooks are not here — the project's structure and conventions skill owns them.

## Design Tone and Taste

See [design-tone-and-taste.md](./references/design-tone-and-taste.md) for:

- the developer-flavored visual identity: angle-bracket wordmark, the sans + Japanese-sibling + monospace type pairing, the code-syntax voice in error and empty states
- the color system: accent ramp (brand) versus neutral ramp (chrome), the single shared lightness axis, and the 13-step semantic role table
- shape language (the squircle corner profile and radius tier), motion language (the shared ease curve and duration tier), and the typography scale with weight-as-hierarchy
- the imagery color-grading recipe and the layout posture of a centered narrow reading column

## Responsive Layout

See [responsive-layout.md](./references/responsive-layout.md) for:

- the two canonical breakpoint transitions (~480px and ~800px) and the three named tiers
- shared reading-column widths per tier and the mobile-only gutter rule
- the mobile → tablet structural transformations, which is where every structural shift fires
- per-tier image aspect-ratio pairings, when full-bleed is legitimate, and the rule that tiers react to the surface's own container

## Color Theming

See [color-theming.md](./references/color-theming.md) for:

- the shared lightness scale inverted end-to-end between schemes, which makes per-surface dark-mode forks a design smell
- the two legitimate per-scheme override categories, and the imagery brightness/saturation compensation recipe
- chrome and affordance auto-adaptation through palette tokens, and the single-brand-hue rule

## UI Labeling and Wording

See [ui-labeling-and-wording.md](./references/ui-labeling-and-wording.md) for:

- Japanese as primary copy with the English-fallback pattern
- the code-syntax voice in error and empty-state headings, paired with humanized Japanese subtext
- accessibility strings for brand and social icons, timestamp forms by surface type, and the emoji prohibition in rendered copy
- loading-placeholder sample text and the `<btn open />` wordmark in browser-tab titles

## Loading and Empty States

See [loading-and-empty-states.md](./references/loading-and-empty-states.md) for:

- the two placeholder primitives and the rule that sample text mirrors the real content's shape, not its meaning
- loaded/loading visual parity and where a loading boundary should sit
- view-transition usage for list-item → detail morphs, and the 404 and empty-state aesthetics

## Accessibility

See [accessibility.md](./references/accessibility.md) for:

- semantic region roles, icon labeling, and alt-text priority for CMS-sourced media
- external-link isolation, keyboard focus visibility, and theme/color parity
- non-color hover affordances, tappable target size, and the reduced-motion rule

## CSS Authoring

See [css-authoring.md](./references/css-authoring.md) for:

- CSS Modules named after their component and imported as `css`
- the `@layer components` requirement and `@scope`-based isolation
- the style-isolation prohibition on root-element `position` / `margin` / `width` / `height`, and `clsx` class-name merging

## CSS Property Usage

See [css-property-usage.md](./references/css-property-usage.md) for:

- the logical-property mandate and the mandatory design tokens that replace hard-coded values
- `oklch()` and relative-color derivations, `@container` size and style queries, and the `--variant` / `--page-variant` convention
- container-relative units, `currentColor`, theme plumbing, and the image-filter transition rule
- the canonical `:focus-visible` and hit-area-expansion templates, and scroll-driven animation guards
