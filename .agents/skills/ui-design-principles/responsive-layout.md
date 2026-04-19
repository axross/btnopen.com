# Responsive Layout

Apply these rules when deciding how a surface should behave across screen widths — which transitions should happen at which width, how content density and structure should shift, and when a surface needs to opt into a layout variant at all. This file governs **design intent**; the mechanics for propagating tier state down into descendant styles live in [react-component-guidelines › css-property-usage › responsive-layout](../react-component-guidelines/css-property-usage.md#responsive-layout), and the high-level reading posture sits in [design-tone-and-taste › layout-posture](./design-tone-and-taste.md#layout-posture).

## Breakpoint Tiers

The design has two breakpoint transitions and three named tiers. Tiers respond to the **surface's own width**, not the viewport's — a blog-post component embedded inside a narrower shell still tiers against that shell.

| Tier | Width | Posture |
|---|---|---|
| **Mobile** | up to ~480px | Single column; full-bleed imagery; ~16px edge gutters; always-on card fills; stacked sub-elements |
| **Tablet** | ~480–800px | Centered ~448px reading column; gutters removed; side-by-side structural layouts unlock |
| **Desktop** | above ~800px | Centered ~736px reading column; denser layouts (image-beside-text card grids); more breathing room around the column |

- MUST NOT introduce a new breakpoint to accommodate a specific surface. The two transitions are the project's canonical reading-posture shifts — if a surface needs a different density at some intermediate width, the design SHOULD adapt via proportional sizing (column width, image aspect ratio) rather than a new tier.
- Tier transitions are referenced by **name** (mobile / tablet / desktop), not raw width, from descendant surfaces. A surface announces its tier once at its root; descendants react to the name.
- Semantic meaning of each transition: the ~480px transition is the "stop scrolling as a phone column, start reading on a tablet" moment; the ~800px transition is the "treat this like a full desktop reading page" moment. When a surface introduces a structural change, pick the transition that matches this framing.
- All observed structural transformations (see [Mobile → Tablet Structural Transformations](#mobile--tablet-structural-transformations)) fire at the **mobile→tablet** boundary. The tablet→desktop boundary is reserved for density adjustments (column widens, gutters grow) rather than structural re-layout.

## Reading-Surface Column Width

Every reading surface — blog post body, blog post header, index-page intro, section containers — MUST share the **same column width** per tier, inherited from the page root:

- **Tablet**: ~448px reading column.
- **Desktop**: ~736px reading column.

- MUST NOT author a per-surface column width. If a surface appears too wide or too narrow at a tier, the fix is to pick a different surface strategy (full-bleed, fixed-width asset, embedded figure that self-constrains) rather than to redefine the column.
- New reading surfaces MUST inherit the shared column width from the nearest page-level container rather than redeclaring it locally.

## Horizontal Gutters

- **Mobile**: reading surfaces MUST carry ~16px horizontal gutters so text never touches the viewport edge.
- **Tablet and desktop**: gutters MUST be removed because the shared column width already insets the content from the viewport edge; doubling up would narrow the column below the shared value.
- The visual consequence: a reader scrolling past the ~480px transition feels a single coordinated posture shift — NOT a scatter of per-surface gutter changes. When a new surface is added, it SHOULD join this pattern rather than carry its own gutter strategy.

## Mobile → Tablet Structural Transformations

A surface that changes **structure** (not just proportional size) across tiers MUST announce its tier by name so the transformation reads as declarative, not ad-hoc. Every observed structural transformation fires at the mobile→tablet boundary; none fires at the tablet→desktop boundary.

- **Column → row-reverse**: the homepage intro reverses from a stacked portrait-above-bio to a portrait-beside-bio row at tablet.
- **Stacked card → image-beside-text grid**: the blog-post list item and web-embed card both switch to a 2-column grid (image-left, text-right) at tablet.
- **Always-on card fill → hover-only fill**: cards that carry a resting background fill on mobile (so the card reads as a card without hover) drop the resting fill at tablet and only pick up a fill on hover, because the grid structure already differentiates the card.
- **Full-bleed → inset**: the blog-post cover image is flush to the viewport edge with no corner-radius on mobile and gains a soft card-corner at tablet so it realigns inside the reading column.
- **Full-bleed → column-aligned**: code snippets extend to the viewport edge on mobile and settle inside the reading column at tablet (the same ~16px gutter that made them appear full-bleed disappears, and the snippet collapses into the column automatically).

SHOULD NOT invent a new structural variant per surface. When a new surface needs one of the above shifts, it SHOULD re-use the existing pattern rather than introducing a fresh pair of layouts.

## Image Aspect-Ratio Across Tiers

An image's aspect ratio MAY change between tiers when the image's role in the composition changes. Observed pairings:

| Image | Mobile ratio | Tablet+ ratio | Intent |
|---|---|---|---|
| Blog-post list item cover | `1600 / 600` | `1600 / 1200` | Short banner above text (mobile) vs. tall left column beside text (tablet/desktop) — same asset, recropped |
| Blog-post header cover | `1600 / 840` | `1600 / 840` | Stable hero; only corner-radius changes across tiers |
| Web-embed card image | `1200 / 630` | `1200 / 630` | Stable OG-sized preview; container shape changes around it, the image crop does not |
| Index-page portrait | `1 / 1` | `1 / 1` | Stable portrait; container sizing changes, ratio does not |

- When an image has distinct per-tier aspect ratios, both crops MUST read as the same asset viewed differently — never as two unrelated images. The `1600/600` ↔ `1600/1200` pairing on list items is an explicit choice to preserve a coherent list→detail morph target; see [loading-and-empty-states › ViewTransition for Visual Continuity](./loading-and-empty-states.md#viewtransition-for-visual-continuity).
- MUST NOT introduce a third aspect ratio at some intermediate tier for the same image; the design tolerates exactly two crops per image (one for mobile, one for tablet-and-desktop).

## Full-Bleed vs Inset

- **Full-bleed** elements (cover images on mobile, code snippets on mobile) extend to the viewport edge. This is reserved for content that WANTS to read as atmospherically large — not a default.
- **Inset** elements stay inside the reading column; this is the default for any content that belongs to the prose flow.
- At tier transitions, full-bleed elements MUST transition gracefully to inset rather than remain flush — gaining a soft card-corner is the canonical resolution so the element reads as "joined the column" rather than "still trying to be full-bleed at a size where that doesn't make sense".

## Container-Driven, Not Viewport-Driven

- Layout tier decisions MUST be driven by the surface's own container width, not the viewport's. A blog-post component embedded in a narrower shell (e.g., a future sidebar, a preview pane) MUST re-tier against that shell — never against the viewport.
- Viewport-level queries are reserved for genuinely viewport-global concerns: color scheme (see [color-theming](./color-theming.md)), motion preferences, print. These are not layout decisions.
