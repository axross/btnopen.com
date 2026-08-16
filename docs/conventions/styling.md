# Styling

What a CSS Module here reads its values from, how it answers a width and a
pointer, and the templates a surface copies verbatim rather than reinventing.

**Everything else about styling is owned by the installed React-component-styling
capability**, and is deliberately not restated here: `@layer components`,
`@scope` with `:where(:scope)`, the module-per-component pairing, merging the
consumer `className` last, logical properties, one colour space, container
queries over media queries, `stretch` over `100%`, dynamic viewport units,
`currentColor` on SVG, scroll-timeline guards, and the hit-area padding/negative
margin technique are all rules that capability states in full. Load it alongside
this document; what follows assumes it.

The design rationale behind the tokens and tiers — what each colour role means,
why the shape and motion tiers are what they are — is in
[visual-identity.md](./visual-identity.md).

## Tokens

All colour, spacing, radius, duration, easing, and font values come from the
tokens declared in `app/(app)/variables.css`.

| Family | Tokens |
| --- | --- |
| Spacing | `--size-1` (1px) … `--size-960` (60rem); the number is the pixel equivalent |
| Radius | `--radius-xs` / `--radius-sm` / `--radius-md` / `--radius-lg` / `--radius-full` |
| Duration | `--duration-sm` / `--duration-md` / `--duration-lg` / `--duration-xl` / `--duration-2xl` / `--duration-3xl` |
| Easing | `--ease-in-out` — the only easing token |
| Font | `--font-sans` / `--font-mono`, each paired with `--font-sans-features` / `--font-mono-features`; `--font-mono-optical-scale`, the mono optical correction |
| Colour | `--color-<tier>-<scheme>-<slot>`, plus an `-alpha` twin of each; `<scheme>` is `accent` (brand) or `neutral` (chrome) |

A CSS Module MUST be imported as `css`, and an incoming `className` MUST be
merged with `clsx` — `clsx(css.snippet, className)`. `clsx` is this project's
merge utility; nothing else is used.

A font-family declaration MUST be paired with its feature-settings variable
(`font-family: var(--font-mono); font-feature-settings: var(--font-mono-features);`).
`tab-size` MUST be declared explicitly on code-display surfaces; the snippet
viewer uses `tab-size: 2`, and the browser default produces inconsistent indent
widths across platforms.

The two code surfaces MUST take the mono optical correction through
`--font-mono-optical-scale` rather than as a literal multiplier. A surface that
has to track its container — the inline code chip, which appears inside a
heading, a list item, a blockquote, and a table cell — MUST apply it as
`font-size: calc(1em * var(--font-mono-optical-scale))`, because a fixed tier
cannot follow the context. A surface that sits on a tier of its own — the snippet
viewer — MUST apply it as
`font-size: calc(var(--text-…) * var(--font-mono-optical-scale))`, and carries a
second, coarse-pointer-gated declaration on top of it; see
[Pointer Adaptation](#pointer-adaptation) before changing its size. What the
correction is for, which surfaces carry it, and why a retune of the `--text-*`
scale has to carry it forward are in
[visual-identity.md](./visual-identity.md).

A literal `3s ease-in-out` MAY be used for a long atmospheric reveal such as the
thumbnail sepia fade, which is deliberately off the `--duration-*` interaction
tier. Reuse the 3-second value for further slow reveals; promote it to a token
only once it recurs in three or more places.

Components read colour only through semantic roles. The `--accent-*` /
`--neutral-*` scales those roles map onto are the theme's private tier: they are
declared in `app/(app)/variables.css` and MUST NOT be referenced anywhere else,
including from an inline `fill` on a React-authored SVG. The slot vocabulary and
what each one means is in
[visual-identity.md](./visual-identity.md).

## Breakpoints and the `--variant` Convention

Two canonical breakpoints serve reading surfaces: `width > 30rem`
(mobile → tablet) and `width > 50rem` (tablet → desktop). The tier meanings and
the structural transformations expected at each are in
[../specs/reader-surfaces.md](../specs/reader-surfaces.md).

Responsive state propagates downward through a custom property:

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

`--variant` MUST be declared at the scope root, its value branched inside
`@container (width > …)`, and consumed through
`@container style(--variant: "…")` in descendants.

`--variant` / `--page-variant` MUST NOT be expected to distinguish tablet from
desktop. The property is binary (`"mobile"` / `"desktop"`) and flips at the
30rem boundary, because no structural transformation fires at the
tablet → desktop boundary.

## Theme Plumbing

`:root` declares `color-scheme: var(--theme)`, with `--theme: light` by default
and `--theme: dark` under `@media (prefers-color-scheme: dark)`.
`scrollbar-color` is themed from the accent ramp.

A component MUST branch on theme with `@container style(--theme: dark) { … }` —
this project's style-query bridge — rather than a component-local media query,
and MUST NOT add a per-surface dark-mode branch except for filtered imagery; see
the legitimate-override rules in
[visual-identity.md](./visual-identity.md).

## Branded Imagery Filter

Thumbnails and web-embed cover images share one filter chain, so external imagery
joins the palette rather than sitting beside it. The design intent and the
per-scheme saturation/brightness values are in
[visual-identity.md](./visual-identity.md).

```css
filter:
  sepia(1)
  saturate(var(--saturation))
  hue-rotate(calc(var(--accent-hue) - 92deg))
  brightness(var(--brightness));
```

Any new branded-imagery surface MUST use that expression verbatim, with
`--saturation` and `--brightness` declared on the imagery's own `@scope` root —
per-scheme values switched via `@container style(--theme: dark)`, hover values
via `:hover` on the parent surface. Literal numbers MUST NOT be hard-coded inside
the filter expression; keeping the values in scoped custom properties is what
makes the per-scheme override declarative. The `-92deg` offset MUST NOT be
retuned per surface either. It is a design-side calibration that aligns the
sepia'd photo with the brand hue, and any warranted re-calibration is a global
design change.

This chain MUST NOT be used on in-content imagery (blog-post `<Media>` and plain
`<img>`). Its only permitted scheme adjustment is `filter: brightness(0.9)` in
dark mode, which keeps light-mode-authored images from overpowering the inverted
background.

Image-filter hover transitions MUST use
`transition: filter var(--duration-md) ease-in-out`, toggling only the scoped
`--brightness` / `--saturation` properties. Interactive hover transitions use the
medium duration token with the `ease-in-out` keyword inlined in the `transition`
shorthand (`transition: background-color var(--duration-md) ease-in-out`); the
`var(--ease-in-out)` token is reserved for standalone
`animation-timing-function` / `transition-timing-function` declarations.

## Focus Ring

```css
.a {
  border-radius: var(--radius-sm);
  outline: none;
}

.a:focus-visible {
  outline: var(--color-component-accent-selected) solid var(--size-3);
  outline-offset: var(--size-3);
}
```

The default browser focus ring on an interactive surface MUST be replaced with
that template rather than removed outright. Its outline colour, width, and offset
MUST NOT be retuned per surface: `component.accent.selected` handles per-scheme
contrast automatically, and changing any of the three is a design-level decision.
The focus target's `border-radius` MUST match the surface's resting corner shape,
so the ring tracks the squircle silhouette rather than revealing a rectangular
underlying box.

## Pointer Adaptation

Two media conditions decide how a surface answers the input hardware, and they
gate on deliberately different families. Why each family is the correct one, and
the mechanics behind both, belong to the installed React-component-styling
capability. This repository's answers are:

| What adapts | Gate | Never |
| --- | --- | --- |
| A hover style | `@media (hover: hover) and (pointer: fine)` | `any-hover` |
| An interactive target's size | `@media (any-pointer: coarse)` | `pointer: coarse` |

The hover gate MUST be written inside the module that owns the hover style, at
the point in that module where it applies. It cannot be declared once and opted
into: `@layer` carries no media condition, so a gate in `layers.css` would have
to wrap the whole `components` layer, which would take every rule in it — not
only the hover rules — off a touch device.

A selector list that pairs `:hover` with a state attribute MUST be split, leaving
the attribute half ungated and duplicating its declarations into the gate. The
duplication is deliberate. `language-switcher.module.css` does it twice, for
`[data-popup-open]` on the trigger and `[data-highlighted]` on a menu item:
both have to keep applying on a touch device, which is the device that needs
them most.

An interactive target MUST meet 44px on the long side and 24px on the short side
under `@media (any-pointer: coarse)`, and those two numbers — and any padding
derived from them — MUST be written as literal lengths rather than `--size-*`
tokens. They are accessibility constants fixed by the specification and the input
hardware, so routing them through the spacing scale would let a retune of that
scale move an accessibility floor. A minimum MUST be measured as the hit area
rather than as the drawn glyph. A 24px social-link glyph centred in a 44×44
target passes; growing the glyph itself is not what the minimum asks for.

A **type-size** floor of `11pt` (14.667px) applies under the same gate, and
reaches the snippet viewer alone. The viewer MUST express it as
`max(11pt, calc(var(--text-sm) * var(--font-mono-optical-scale)))` — as a `max()`
against the corrected value, so the declaration states the relationship rather
than a bare constant. The gate is load-bearing rather than incidental: the
corrected tier maxes at 14.0625px and so sits under the floor at *every*
viewport width, meaning an unscoped floor would not raise the block occasionally
but pin it to a constant everywhere and take the optical correction out of it.
`11pt` is a literal for the same reason the target minimums are, and is written
in points rather than as its pixel equivalent because points is the unit the
platform states the floor in, so no rounding of the conversion can leave the
value under the figure it expresses.

**Inline code is deliberately not floored.** A chip is sized to sit optically
level with the prose it interrupts, so a floor would restore the oversizing the
correction exists to remove; it renders below 14.667px wherever its container is
small enough to put it there, and that is correct. Why the floor exists at all
is in [visual-identity.md](./visual-identity.md).

Fine-pointer rendering MUST NOT change in order to reach a coarse-pointer
minimum. Every control sized under the coarse gate renders on a mouse exactly
as it did before it was sized.

## Hit-Area Expansion

```css
.item {
  display: flex;
  padding: var(--size-8);
  margin: calc(var(--size-8) * -1);
  border-radius: var(--radius-md);

  @media (any-pointer: coarse) {
    padding: 10px;
    margin: -10px;
  }
}
```

Small interactive elements — inline icons, social-link glyphs — grow to roughly
40×40 with this template, from `social-link-list.module.css`, and to exactly
44×44 under a coarse pointer: the glyph is a 24px SVG, so 24 + 10 + 10 lands on
the minimum. The padding and its negation match exactly at both sizes, so the
visible position does not move.

An inline box is the one case that takes padding alone. Vertical padding on it
does not affect the line box, so there is nothing for a margin to offset, and an
inert negative margin would read as though it were doing something.
`markdown-content.module.css` `.a` and the tweet embed's `.link` are the two
occurrences.

## Truncation

Multi-line truncation SHOULD use `-webkit-box` with `-webkit-line-clamp`,
`-webkit-box-orient: vertical`, and `overflow: hidden` (`.description` /
`.brief` / `.url` in the web-embed and blog-post list); single-line truncation
SHOULD use `text-overflow: ellipsis` with `white-space: nowrap` (`.title`).

`word-break: break-word` SHOULD be set on long-form body copy (`.p`, `.code`) and
not on short labels — titles, tags, timestamps.

## Recorded Exceptions

- Physical `border-left` remains on `.blockquote`. New code SHOULD use
  `border-inline-start`; existing occurrences MAY be migrated opportunistically.
- Physical `width` / `height` MAY be used for inline SVG icons sized by
  intrinsic pixel dimensions, skeleton placeholder rectangles, `100%` / `100dvh`
  full-surface claims, and the `width: auto` / `height: auto` image reset.
- Pixel literals MAY be used inside hairline borders (`var(--size-1)`,
  `0.5px`), SVG `width` / `height` attributes, the coarse-pointer target
  minimums and the padding derived from them, and the root-level definitions in
  `variables.css`. The coarse-pointer type-size floor is the one absolute
  literal not written in pixels — it is written in points, for the reason given
  under [Pointer Adaptation](#pointer-adaptation).
- Four surfaces name a role whose generic label does not match their local job,
  and they are deliberate rather than mistakes: the focus ring sits on
  `component.accent.selected` where the canonical role for a focus ring would be
  `border.interactive`, the monochrome submit button fills from `text.high`, the
  markdown horizontal rule paints from `border.subtle`, and the table scrollbar
  thumb from `border.hovered`. Each preserves the colour the surface had before
  the role layer existed. Correcting them means moving colour on several surfaces
  at once, so it is a design change with its own issue and MUST NOT be made as a
  rename in passing.
