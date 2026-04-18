# Accessibility

Apply these rules when building any user-facing surface. These rules are absolute requirements; accessibility regressions are treated as correctness bugs, not polish items.

## Semantic HTML

- MUST use the semantic landmark and structural element that matches the role of the region:
  - `<header>` for the page header (wraps the logo link in `app/(app)/_components/header.tsx`).
  - `<main>` for the primary content region of a page (the index page, `NotFoundContent`).
  - `<section>` for sibling regions inside a `<main>` (the intro + Posts section pattern on the index page).
  - `<article>` for self-contained content units (blog-post renderings).
  - `<header>` inside an article for the post's title/meta block (see `blog-post-header/loaded.tsx`).
  - `<h1>` for the primary heading of a page; subsequent headings in document order without skipping levels.
  - `<ul>` / `<li>` for any list of peer items (blog-post list, tags, social-link list). MUST NOT use `<div>`s styled to look like a list.
  - `<time>` SHOULD be used for machine-readable timestamps in future work; current code renders dates inside plain `<div>`s — MAY migrate opportunistically.
- MUST NOT use `<div>` or `<span>` when a semantic element exists for the role.
- MUST NOT wrap interactive content in `<div onClick>` — use `<button>` or `<a>` with an `href` / `onClick`.

## Inline SVG Icons

- Inline SVG that communicates meaning (logo, social icons, brand illustrations, web-embed fallback) MUST carry both:
  - `role="img"`
  - `aria-label="<canonical label>"` — see [ui-labeling-and-wording › aria-label-and-alt-strings](./ui-labeling-and-wording.md#aria-label-and-alt-strings) for the exact string conventions.
- Inner SVG paths MUST NOT receive their own `aria-label`; the outer `<svg>` is the single accessible-name source.
- SVG icons that are purely decorative (a graphical flourish behind text, a visual divider) MAY omit `role="img"` and SHOULD be marked `aria-hidden="true"` or (preferred) wrapped in a decorative element that is itself `aria-hidden`.
- MUST NOT rely on SVG `<title>` alone for the accessible name; use `aria-label` to match the rest of the project.

## Decorative Text

- Purely decorative text content (the giant `404` glyph in `not-found-content.tsx`) MUST carry `aria-hidden="true"` so the accessible name comes from the real `<h1>` heading, not the decorative number.
- MUST NOT wrap meaningful copy in `aria-hidden` to work around layout issues — if it would confuse the reader when exposed to assistive tech, rework the layout.

## Images

- Every `<Image>` (from `next/image`) and every `<img>` MUST pass an `alt` attribute.
- CMS-sourced media via the `<Media>` component in `app/(app)/_/components/media.tsx` MUST fall through `alt ?? fileAlt ?? ""`:
  - Author-supplied `alt` wins if present.
  - Otherwise the media upload's `alt` field from Payload.
  - Finally an empty string — signals "decorative" only when genuinely decorative.
- Thumbnail / cover images MUST use the post title (`alt={blogPost.title}`). Avatars MUST use the person's display name.
- MUST NOT leave `alt=""` on images that convey meaning; the empty fallback in `media.tsx` is a last-resort signal, not a default.

## External Links

- Every `<a href="…">` pointing at an external origin MUST set:
  - `target="_blank"`
  - `rel="noopener noreferrer"`
- The project's existing external links follow this exactly (`social-link-list.tsx`, `webembed/loaded.tsx`).
- Internal navigation MUST use `next/link`'s `<Link>` (which does not need `target` / `rel`) so client-side routing kicks in.

## Keyboard Focus

- MUST NOT set `outline: none` (or any equivalent) without also defining an explicit `:focus-visible` replacement.
- `:focus-visible` outlines SHOULD use a numbered accent/neutral token and the `--size-3` token for width / offset — the blog-post-content link treatment is the canonical pattern:
  ```css
  .a {
    border-radius: var(--radius-sm);
    outline: none;
  }

  .a:focus-visible {
    outline: var(--action-5) solid var(--size-3);
    outline-offset: var(--size-3);
  }
  ```
- SHOULD ensure `border-radius` on the focus target matches the outline's corner-shape so squircle rings look correct.
- MUST preserve keyboard focusability on every clickable surface (`<button>`, `<a>`, `<Link>`) — do not add `tabIndex="-1"` for styling convenience.

## Theme and Color Parity

- MUST rely on the shared `--lightness-*` scale + `prefers-color-scheme` plumbing for dark-mode parity (see [design-tone-and-taste › color-system](./design-tone-and-taste.md#color-system) and [css-property-usage › theme-and-color-scheme](./css-property-usage.md#theme-and-color-scheme)).
- Content contrast MUST remain legible under both light and dark schemes. The numbered scale's step-11 → step-0 contrast is the baseline; MUST NOT build surfaces that only work in one scheme.
- MUST NOT convey information through color alone. Interactive hover MUST accompany the color change with a background-fill / underline / border delta so colorblind and low-vision users perceive the state.
- Links MUST retain an underline (`text-decoration: underline`) with `text-underline-offset: var(--size-2)` — color-only link treatment is not acceptable.

## Hover / Interactive Affordances

- Interactive surfaces MUST have a visible non-color hover affordance:
  - Text links pick up a background fill swap (`--accent-2` → `--accent-3` depending on density).
  - Cards swap their background from `--accent-3` → `--accent-4` and may bump the image `--brightness` value.
  - Icons swap both color and background (`--accent-11` → `--accent-12` text, `--accent-2` → `--accent-3` background).
- MUST NOT implement hover with color change only.

## Tappable Target Size

- Interactive icons and small inline controls MUST have an effective hit area of at least ~40px regardless of the icon's visual size. The project's idiomatic pattern is to add padding and compensate visually with a negative margin — see `social-link-list.module.css`:
  ```css
  .item {
    display: flex;
    padding: var(--size-8);
    margin: calc(var(--size-8) * -1);
    border-radius: var(--radius-md);
  }
  ```
- MUST NOT rely solely on the visual bounds of a 24×24 SVG as the click target.

## Language Attribute

- The root `<html lang="en">` is currently set on both `app/(app)/layout.tsx` and `app/global-not-found.tsx`. MUST keep both in sync when the root language eventually changes.
- Inline Japanese content inside English-metadata documents is currently unwrapped. When the site grows a multi-page Japanese surface, SHOULD introduce `lang="ja"` wrappers on the Japanese regions — but do not retrofit that change piecemeal; treat it as a site-wide i18n decision.

## Motion Preferences

- The project does not yet honor `prefers-reduced-motion`. When introducing new animations, SHOULD guard them with `@media (prefers-reduced-motion: reduce)` branches that disable or shorten the motion — this is the forward-looking rule for any new work, even though existing animations (sepia fade, glitch layers) do not yet comply.
- MUST NOT introduce infinite, full-screen flashing animation without a reduced-motion fallback.

## Analytics, Overlays, Modals

- Analytics event handlers (`trackAction(...)`) MUST NOT interfere with the default click behavior of a link (see `social-link-list.tsx`: `onClick={onGitHubLinkClick}` runs alongside native navigation). Never call `preventDefault()` in a tracker.
- The project does not currently use modals/dialogs. When introducing one, MUST use the `<dialog>` element with `role="dialog"` / `aria-modal="true"` and focus management; do not roll a `<div>`-based modal.
