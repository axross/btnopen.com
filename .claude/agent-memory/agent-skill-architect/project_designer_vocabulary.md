---
name: UI design skill vocabulary
description: Designer-facing phrasing used in ui-design-principles when the CSS mechanic lives in react-component-guidelines/css-property-usage.md
type: project
---

The `ui-design-principles` skill is deliberately designer-readable: CSS custom properties, React/JSX snippets, file paths, and HTML element names are translated to plain language, and implementation mechanics are relocated to `react-component-guidelines/css-property-usage.md`.

**Why:** The skill is read both by designers (who lack deep HTML/CSS knowledge) and by engineers, and the MECE split with `css-property-usage.md` is how both audiences stay served without duplication.

**How to apply:** When editing any file under `.agents/skills/ui-design-principles/`, use the softened vocabulary below and keep mechanics cross-referenced rather than inlined. If a new rule feels code-shaped, its real home is likely `css-property-usage.md` with a design-side cross-reference back here.

Vocabulary mapping (developer term → designer phrasing):

- `--accent-*` / `--neutral-*` → "accent ramp" / "neutral ramp"
- `-N` token suffix → "Step N" (e.g., `--accent-3` → "Step 3 on the accent ramp")
- `--lightness-*` → "shared lightness scale" or "shared lightness axis"
- `--radius-*` tiers → "extra-small / small / medium / large / full" named radius tier
- `--duration-*` tiers → "named duration tier" with "medium" etc. by role
- `var(--ease-in-out)` → "the project's shared ease-in-out curve"
- `--accent-hue` → "the brand hue" (single global knob)
- `@media (prefers-color-scheme: dark)` / `@container style(--theme: dark)` → "dark-mode override" or "per-scheme override"
- `@container` / `@scope` / `:where(:scope)` → omit; refer to "the surface's own container" or "the surface's root"
- `<header>` / `<main>` / `<article>` / `<h1>` → "page header" / "main" / "article" / "top-level heading"
- `<ul>` / `<li>` → "list + list-item"
- `role="img"` + `aria-label` → "a single accessible name at the icon's outer boundary"
- `aria-hidden="true"` → "hidden from assistive tech"
- `target="_blank"` + `rel="noopener noreferrer"` → "open in a new tab and isolate the new tab from the originating page"
- `<Image>` / `<img>` / `<Media>` → "images" / "CMS-sourced media"
- `<LoadingPlaceholderRect>` / `<LoadingPlaceholderText>` → "rectangle placeholder" / "text placeholder"
- `<Suspense>` → "suspense" lowercase, or "loading boundary"
- `<ViewTransition name="…">` → "view-transition affordance" / "shared-element transition"
- `<NotFoundContent>` → "the shared not-found surface"
- `date-fns` library name stays (library-choice rule) but `formatDistanceToNow(...)` / `format(..., "PPP")` calls are replaced with "relative timestamps" / "absolute long-form timestamps"
- Step notation: the table in `design-tone-and-taste.md#color-system` lists steps as plain `0` … `12` in the Step column (linter-normalized form), not `-0` / `Step 0`.

Mechanics that were moved from `ui-design-principles` into `react-component-guidelines/css-property-usage.md` during this refactor:

- **Transitions and Hover State** — the literal-keyword-`ease-in-out`-in-transition-shorthand convention, the "toggle scoped custom properties, never rewrite the filter chain" rule, the literal `3s` for atmospheric reveals.
- **Focus Ring** — the canonical `:focus-visible` CSS template using `var(--action-5)` and `var(--size-3)`. Note: `--action-5` is the real codebase token (verified in `app/(app)/posts/[slug]/_components/blog-post-content.module.css`); do not "correct" it to `--accent-5`.
- **Hit-Area Expansion** — the matching `padding` / negative `margin` template for ~40×40 tap targets.

The "Hover and Filter Transitions" section that used to live in `loading-and-empty-states.md` was deleted outright; its design-decision content duplicated `design-tone-and-taste.md`'s Motion section, and its mechanics moved to the Transitions and Hover State section of `css-property-usage.md`.
