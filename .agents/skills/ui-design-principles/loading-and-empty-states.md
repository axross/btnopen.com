# Loading and Empty States

Apply these rules when designing, writing, or reviewing any UI state that is not the "happy, loaded, populated" view — loading skeletons, suspense fallbacks, empty lists, 404 / not-found pages, and visual continuity during client-side navigation.

The component-pair mechanics (a `loaded` / `loading` sibling pair wired through `<Suspense>` per route-group conventions) are defined in [react-component-guidelines › client-components](../react-component-guidelines/client-components.md) and [routing-guidelines](../routing-guidelines/SKILL.md). This document governs what those states should **look and feel like**, not how they are wired.

## Visual Parity Between Loaded and Loading

- The `loading` sibling component MUST render with the same outer dimensions, spacing, and grid structure as its `loaded` counterpart. A reader who navigates into the route SHOULD see the skeleton collapse into the real content without layout shift.
- MUST reuse the same CSS-Module selectors and tokens across the pair (see the `blog-post-list/loading.module.css` + `loaded.module.css` pairing) so that adding a new cell on one side doesn't silently diverge from the other.
- Prop shape: the `loading` sibling SHOULD accept the same `data-testid` (suffixed with `-loading` per [react-component-guidelines › testable-components](../react-component-guidelines/testable-components.md)) and the same `className` passthrough — parents swap only the component, not the surrounding markup.

## Skeleton Shapes

Use the two built-in placeholder primitives in `app/(app)/_/components/loading-placeholder.tsx`:

- `<LoadingPlaceholderRect />` for image / media / figure slots. Renders as a `--radius-md` rectangle tinted at `--neutral-2` with the `pulse` animation alternating toward `--neutral-3` every 500ms.
- `<LoadingPlaceholderText sampleText="…" maxLines={n} />` for text slots. Renders each whitespace-separated word of `sampleText` as a pill whose width comes from `data-length` in `ch` units, clamped vertically by `data-max-lines * 1lh`.

Rules for using them:

- MUST pass a `sampleText` that mirrors the expected real content's **shape**, not its meaning. Sample strings are in Latin placeholder style — see [ui-labeling-and-wording › loading-placeholder-sample-text](./ui-labeling-and-wording.md#loading-placeholder-sample-text).
- MUST set `maxLines` to the same line-clamp count used on the matching loaded surface (e.g., `brief` clamps to 2 lines both loaded and loading).
- MUST NOT introduce a third placeholder primitive. If a new shape is genuinely needed (circle avatar, etc.), extend `loading-placeholder.tsx` with a new exported variant rather than inlining one in a component.
- The pulse animation's `500ms linear infinite alternate` cadence MUST remain constant across all skeletons so multiple placeholders on-screen pulse in phase.

## Suspense Boundaries and Fallbacks

- Every `loaded` sibling that awaits remote data MUST be wrapped by a `<Suspense>` boundary whose `fallback` is the matching `loading` sibling. The wrapper component is conventionally the route-level component that holds the boundary (see `BlogPostList` as the pattern).
- SHOULD NOT rely on the global / layout-level `<Suspense>` in `app/(app)/layout.tsx` as a substitute for a per-section boundary — that boundary exists for analytics-style side effects, not for primary content.
- SHOULD size each Suspense boundary around the smallest meaningful content region, not the entire page. A full-page spinner is not on-brand for this site.

## ViewTransition for Visual Continuity

- Navigation from a list item to its detail page MUST use `<ViewTransition name="…">` to morph the shared visual elements (image, timestamp, title) in place. The current naming convention:
  - Image: `blog-post-<slug>-image`
  - Timestamp: `blog-post-<slug>-timestamp`
  - Title: `blog-post-<slug>-title`
- New shared-element morphs SHOULD follow the `<entity>-<identifier>-<role>` naming pattern so names stay collision-free as the site grows.
- Both sides of the transition (list and detail) MUST wrap the same semantic element with `<ViewTransition name="…">`. Missing one side breaks the morph silently.
- The target element on the detail side SHOULD preserve the source's intrinsic proportions (the post thumbnail uses `aspect-ratio: 1600 / 840` on the cover image — matching the list's `aspect-ratio: 1600 / 600` with a taller `1600 / 1200` crop on desktop to provide a coherent morph target).
- Image-specific transitions pair with a sepia-filter `transition: filter 3s ease-in-out` so the thumbnail's accent tint fades in after the morph completes (see `coverImage` in `blog-post-header/loaded.module.css`).

## The 404 / Not-Found Aesthetic

- Every "missing" route MUST render `<NotFoundContent heading="…" description="…" />` from `app/(app)/_/components/not-found-content.tsx`. Do not implement ad-hoc not-found UI per route.
- Heading SHOULD follow the code-syntax voice (`page.found === false`, `post.found === false`) per [ui-labeling-and-wording › voice-and-tone](./ui-labeling-and-wording.md#voice-and-tone).
- Description SHOULD be a single Japanese sentence stating what was not found (`お探しのページは見つかりませんでした`).
- The giant `404` status number is:
  - Rendered via `<p className={css.statusCode} aria-hidden="true">404</p>` — the `aria-hidden` MUST remain so screen readers don't double-announce the numeric code.
  - Typeset in `var(--font-mono)` with `var(--font-mono-features)`, sized at `var(--size-96)`, weight `700`.
  - Colored at `--accent-10` with two offset pseudo-elements at `oklch(from var(--accent-9) l c calc(h ± 16))` clipped by the `noise-fast` / `noise-slow` keyframes to create the glitch effect.
  - Backed by `var(--neutral-0)` on the pseudo-elements so the glitch offset masks cleanly against the page background.
- The primary action MUST be a single inline-flex `<Link href="/">` labeled `Go back home`, padded at `var(--size-12)` × `var(--size-24)`, transitioning background on hover to `--accent-2` over `var(--duration-md)` / `var(--ease-in-out)`.
- MUST NOT add secondary actions (search, report, recent posts, etc.) to the not-found surface — the glitch visual + single escape hatch is the intended aesthetic.

## Empty States (No Items)

- Lists that can legitimately be empty (e.g., a future tag-filtered archive) SHOULD render a muted message inside the list container rather than collapsing the container entirely, so the surrounding chrome stays anchored.
- MUST use the same code-syntax heading voice for empty messages when appropriate (`posts.length === 0`).
- Currently the project has no dedicated empty-state surface; when introducing one, place it in `app/(app)/_/components/` as a shared component following the `NotFoundContent` pattern.

## Hover and Filter Transitions

- Background-color hover transitions on interactive cards MUST use `transition: background-color var(--duration-md) ease-in-out` (see `.blogPostListItem`). The project's convention is to name `ease-in-out` as the literal keyword inside `transition` shorthands for parity with CSS defaults; the token `var(--ease-in-out)` is reserved for standalone `animation-timing-function` / `transition-timing-function` declarations.
- Image-filter hover transitions (brightness bump on thumbnails) MUST use `transition: filter var(--duration-md) ease-in-out` and toggle only `--brightness` / `--saturation` custom properties — never rewrite the whole `filter` chain per state.
- Long "reveal" filter transitions (thumbnail sepia fade on initial load) use `filter 3s ease-in-out` — not a token, because the intent is a slow ambient reveal distinct from interactive motion. Reuse the 3-second value when introducing additional slow reveals; introduce a `--duration-*` token only if the value needs to recur in ≥ 3 places.
