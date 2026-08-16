# Visual Identity

What btnopen.com looks and sounds like. This is the brand a change has to keep
true — the part no general design capability can supply, because it is particular
to this site. How the CSS encodes it is
[styling.md](./styling.md); the surfaces it is
applied to are [../specs/reader-surfaces.md](../specs/reader-surfaces.md).

## Tone

The audience is developers, and the identity MUST show it rather than leaving it
to the subject matter. The site carries a **developer-flavoured,
technical-but-playful** voice: code-syntax flourishes appear where another site
would use marketing language, an error heading is shaped as a JavaScript
expression, and technical numerics — status codes, timestamps, URLs — are
celebrated in monospace rather than hidden. The mood is monochromatic with a
single accent: there are no multi-hue gradients, no drop shadows, and no
secondary accent hue.

Identity is carried by one wordmark and one accent hue. There are no additional
brand marks, mascots, or logo variants.

## Colour

Components MUST NOT name a colour by its position on a scale. They read a
**semantic role** — `--color-<tier>-<scheme>-<slot>` — and the role says what
the surface *is*: a page background, a component at rest, a border on something
interactive, low-contrast text. The 13-step scales those roles resolve to are the
theme's private tier, declared once in `app/(app)/variables.css` and referenced
nowhere else. A single shared lightness axis powers both light and dark schemes.

That split is the point. A step index records how a value looked when it was
chosen; a role records what it is for. With the index at the call site, retuning
the scale has to be re-reasoned at every one of them, and nothing mechanical can
tell a deliberate contrast choice from a copy-paste.

Two schemes share the role vocabulary. The **accent** scheme is the brand one,
used for anything that should visibly carry identity — links, selection,
interactive hover, branded card surfaces. The **neutral** scheme is chrome, used
for anything that should read as neutral UI rather than brand.

| Slot | What the surface is | Step |
| --- | --- | --- |
| `background.plain` | Page / app background | 0 |
| `background.app` | Subtle app background | 1 |
| `background.subtle` | Subtle component background | 2 |
| `component.rest` | Component background, at rest | 3 |
| `component.hovered` | Component background, hovered | 4 |
| `component.selected` | Component background, active or selected | 5 |
| `border.subtle` | Subtle border on non-interactive | 6 |
| `border.interactive` | Border on interactive, and focus rings | 7 |
| `border.hovered` | Hovered border | 8 |
| `solid.rest` | Solid background, at rest | 9 |
| `solid.hovered` | Solid background, hovered | 10 |
| `text.low` | Low-contrast text | 11 |
| `text.high` | High-contrast text | 12 |

`text.onSolid` sits outside that run, one per scheme. Steps 11 and 12 are text on
a *background* step; text drawn on a solid fill needs its own value, and guessing
white is only right for some hues.

Every slot also carries a translucent `-alpha` twin, for a colour that composites
over content the theme does not control — imagery, a scrolling surface, another
component. Their alphas are the published Radix UI Colors scales taken verbatim,
`purple` for accent and `mauve` for its purple-tinted neutral, so the grading is
inherited rather than invented. A component MUST NOT hand-write an `rgba()` or a
slash-alpha; that is an off-scale value like any other.

A role MUST be picked by what the surface *is*, never by how a value looks in one
scheme. Accent and neutral MUST pair at the *same slot* when composing foreground
on background, because shared lightness means shared perceptual contrast. A
one-off variant MUST be derived by tweaking a single channel — hue, chroma, or
alpha — of a role token rather than introducing a new colour; a surface-local
colour that resolves to no role is a design smell. An interactive state MUST move
along its own tier: a card at `component.rest` hovers to `component.hovered`, and
crossing schemes on hover is prohibited because the result reads inconsistently
between light and dark.

The brand hue is a **single global knob**. Rotating it recolours the entire brand
ramp, keeps the neutral ramp slightly hue-coupled so neutrals do not feel
disconnected from the brand, and propagates into the imagery recipe so filtered
photos rotate along with it. A hue change MUST be verified in both schemes,
because a hue that reads well in light can appear muddy in dark: accent
saturation is applied at different lightness values per step. There is no second
brand hue, no dark-mode-only hue, and no per-surface hue override.

### Light and Dark

Both schemes share one lightness scale, **inverted end to end**. Step 0 is the
brightest value in light mode and the darkest in dark mode; step 12 is the
reverse. Because each role is a fixed map onto one step, both schemes come free:
a surface that picks the right role adapts correctly with no per-surface
override, and every other rule here exists to preserve that property.

Only two categories MAY legitimately carry a per-scheme override:

1. **Filtered imagery** — thumbnails, web-embed images, the portrait foreground,
   in-content media. The colour-grading recipe is applied on top of an external
   photograph, so the resulting luminance does not auto-adapt to the surface it
   sits on.
2. **Browser-level primitives** — the system colour-scheme declaration, scrollbar
   colours, text-selection colours. These are driven by palette tokens at the root
   and are never redeclared per surface.

A third category is a design smell. A per-surface dark-mode fork that merely
reassigns a role means the wrong role was chosen upstream; the fix is the role,
not the branch. When a bug report says "looks wrong in dark mode only", role
choice is where the investigation starts.

## Typography

Type taste is technical and utilitarian: a single sans-serif family paired with
its Japanese sibling for body copy, and a single monospace family reserved for
content that is semantically technical. Monospace MUST NOT be used decoratively —
its homes are inline code, code blocks, URLs, status codes, and code-syntax error
headings.

Size and leading sit on a restrained, site-wide scale with named tiers. A size
that fits no existing tier is a design-level decision, not a component-level
tweak.

The scale is tuned on the sans, so **the two code surfaces — inline code and the
code block — MUST carry an optical correction of `0.9375`**. JetBrains Mono's
x-height is 0.5625 per em against IBM Plex Sans's 0.5313, a ratio of 0.9444, so
an uncorrected mono surface reads larger than the prose beside it at the same
nominal size; `0.9375` is the nearest sixteenth to that ratio. The correction
belongs to the pairing of the two families rather than to either surface, so a
later retune of the `--text-*` scale MUST carry it forward; dropping it silently
restores the oversized rendering it exists to fix. How a surface applies it is in
[styling.md](./styling.md). Why this correction rather than `font-size-adjust` or
a size tier of its own is in
[../decisions/2026-08-16-correct-the-two-code-surfaces-with-an-optical-scale-token.md](../decisions/2026-08-16-correct-the-two-code-surfaces-with-an-optical-scale-token.md).

The rule reaches those two surfaces and no others. The site's remaining
monospace is uncorrected today and sits outside it: the comment count, the
empty-state expression, the commenter handle, the badge, and the timestamp; the
web-embed URL; the state message; and the not-found heading and the `404`
status-code glyph.

Weight reads as a semantic hierarchy rather than a visual flourish:

| Weight | Used for |
| --- | --- |
| Regular (400) | Body text and ordered-list items |
| Medium (500) | Inline link anchors, light emphasis inside blockquotes |
| Semibold (600) | Subheadings, inline strong emphasis in body, table headers, definition terms |
| Bold (700) | Page and post titles, top-level headings, primary-action link copy |
| Black (900) | Strong emphasis **nested inside headings** only — not a general-purpose emphasis weight |

## Shape and Motion

The shape taste is **squircle**, not a plain rounded corner: corners curve with a
softer, more geometric profile than a traditional radius arc. The treatment is
established globally and every branded surface MUST preserve it. Radii live on a
small named tier — extra-small, small, medium, large, full:

- **Medium** is the default for cards, images, focus rings, buttons, and hover
  surfaces.
- **Small** is the default for inline chips — tags and inline code.
- **Full** is reserved for capsule-shaped pills that must stay rounded at any
  height.
- **Circular avatars** MUST stay truly circular — the one explicit opt-out from
  the squircle tier.

A sixth radius value is a design-level decision; a surface that seems to need one
MUST first re-examine whether an existing tier reads correctly at its size.

Motion is restrained and consistent: a **single easing curve** and a fixed
duration tier. Interactive hover and background swaps use the medium duration —
fast enough to feel immediate, slow enough not to flicker. Longer atmospheric
reveals MAY use a multi-second duration when the transition is clearly
atmospheric rather than interaction feedback; the canonical 3-second sepia fade on
a post's cover image is the reference point. Skeleton pulses MUST share one exact
timing across the whole site, so every placeholder pulses in phase.

## Imagery

Four categories, each with a distinct treatment.

**Branded imagery** — thumbnails and web-embed cover images — runs through the
site's signature colour-grading recipe, in four passes, so external imagery joins
the palette rather than sitting beside it:

1. **Sepia wash** strips the photo's original colour, leaving a brown monochrome.
2. **Saturation boost** pumps up the sepia tone so the next pass has rich colour
   to rotate. Pushed harder in light mode than in dark.
3. **Hue shift onto the brand hue** rotates the saturated tone to land on
   (brand hue − 92°), so every branded photo tracks the brand hue automatically
   and a brand-hue change recolours every photo without per-image tuning. The 92°
   offset is a one-time calibration and is never retuned per surface.
4. **Per-scheme brightness** keeps the photo readable on the surface it sits on.

The canonical compensation values:

| Surface | Light mode | Dark mode |
| --- | --- | --- |
| Branded imagery at rest (list-item cover, web-embed card image) | saturation ×1.75, brightness 100% | saturation ×1.5, brightness 90% |
| Branded imagery on hover | brightness 110% | brightness 100% (reset, no bump) |
| In-content plain imagery (blog-post media, plain `<img>`) | unfiltered | brightness 90% |
| Index-page portrait foreground | sepia 0.5, saturation ×1.75 | same, plus brightness 90% and saturation ×2 |

In light mode, filtered imagery sits on a bright surface, so a slight
over-brightening on hover brings the image forward. In dark mode the image is
already brighter than its surface, so hover **resets** to 100% — bumping further
would create glare.

**In-content imagery** — media embedded inside a post body — stays in natural
colour with no sepia wash or hue shift. A subtle brightness reduction in dark mode
is the only permitted adjustment, so images authored with a light-mode assumption
do not overpower the inverted background. The compensation is a surface-type
decision, never a per-asset knob.

**Author avatars** are unfiltered and circular. **Decorative vector marks** —
the portrait backdrop — are colourable via the palette rather than baked-in
coloured assets; they are extensions of the palette, not standalone artwork.

## Layout Posture

The reading posture is a **centred, narrow column**. Main content MUST respect it
rather than sprawling edge to edge, and reading surfaces MUST share one canonical
column width per tier, inherited from the page root rather than redeclared per
surface. Horizontal gutters apply on mobile only; at wider tiers the shared column
width and centred alignment already inset content from the viewport edge.

Full-bleed surfaces — mobile cover images, mobile code snippets — break out to the
viewport edge by extending past the reading column's gutter. That treatment is
reserved for content meant to read as atmospherically large, not a default. The
tiers and their widths are in [../specs/reader-surfaces.md](../specs/reader-surfaces.md).

## Copy

The site serves two locales, negotiated per request: `ja-JP` and `en-US`, with
`ja-JP` as the default. Primary UI copy is **Japanese**; English is the fallback
for readers outside Japanese-reading locales, reached only by an explicit choice
or a matching `Accept-Language`. UI copy MUST NOT be written inline — it comes
from the per-locale catalogues under `app/(app)/_/translations/`, read through
`next-intl`, so a string added to one catalogue and not the other leaves the other
locale rendering a missing-message fallback.

### Voice

A **not-found heading** MUST adopt a **code-syntax voice** — a JS-expression
shaped line reading `<subject>.<predicate> === <value>`:

- 404, generic: `page.found === false`
- 404, blog post not found: `post.found === false`

Predicates MAY be past-tense states such as `loaded`, `authorized`, or `exists`
when those read more naturally than `found`. Each code-syntax heading MUST be
paired with a humanized Japanese description of what was not found —
`お探しのページは見つかりませんでした`, `お探しの投稿は見つかりませんでした`.

The voice reaches only a heading that exists. The shared empty-and-error surface
deliberately has none, so nothing on it takes this form; its composition is in
[../specs/reader-surfaces.md](../specs/reader-surfaces.md).

Primary-action copy in an error state MUST be a short English sentence-case
imperative — `Go back home`. Section headings on index and listing surfaces MUST
be short English nouns with no trailing punctuation — `Posts`. There MUST be no
exclamation marks, no scare quotes, and **no emoji** in rendered copy or in
Markdown authored for the site's own surfaces. (Emoji in observability module
identifiers are not rendered copy and are exempt.)

### Naming and Formatting

The brand name MUST appear as `btnopen.com` in body copy and as the wordmark
`<btn open />` — spaces, angle brackets, and slash intentional — in browser-tab
titles, where it is the trailing suffix after a separator on every page. Tag
labels come from the CMS and MUST be rendered verbatim: the UI layer does not
coerce case, translate, or reformat them. The author's display name MUST NOT
carry an appended title or honorific. A web-embed card MUST display only the
**host** portion of a URL, because the preview identifies the source at a glance
rather than reproducing it. Inline code and code blocks MUST preserve the
author's original casing and whitespace.

Timestamps take the form that answers the reader's actual question. Listing
surfaces MUST render **relative** timestamps — `about 4 months ago` — because
recency-at-a-glance is what a list communicates. Detail surfaces MUST render
**absolute**, long-form timestamps — `April 16, 2026` — because a reader who
opened the post wants to know when exactly. Formatting MUST route through
`date-fns` rather than a per-component reimplementation.

Description, keywords, authors, and Open Graph fields MUST come from the CMS
rather than being hard-coded at the route level.

### Accessible Names

Icons representing a destination or brand MUST be labelled with the canonical
host name: `github.com`, `x.com`, `linkedin.com`, `btnopen.com` for the logo.
Icons representing an abstract graphic concept MUST take a short descriptive
English label — `Background` for the portrait backdrop, `Web Page` for the
web-embed fallback illustration, `favicon shape` for the favicon glyph.

Alt text MUST describe the depicted subject, not the image's role in the layout:
a post cover or thumbnail takes the post's title, an author avatar takes the
person's display name, and CMS-sourced media falls through author-supplied alt →
the upload's own alt → empty, the last only when the image is genuinely
decorative. A web-embed image MUST describe the remote page: its title if
available, then the author-provided link text, then the raw URL as a last resort.

## Accessibility Commitments

Accessibility regressions are correctness bugs here, not polish items.

**Semantic structure.** Every region MUST use the landmark and structural element
matching its **role**, not its appearance: a page header for the logo and
navigation region, main for the primary content region, section for sibling
regions inside it, article for a self-contained blog-post rendering, a header
inside that article for the title and meta block. Headings MUST follow document
order without skipping levels. Any group of peer items — the blog-post list, tags,
the social-link list — MUST be a real list, never generic wrappers styled to look
like one. An interactive affordance MUST be a real button or link, never a click
handler bolted onto a non-interactive wrapper.

**Icons and decorative content.** An icon that communicates meaning MUST carry a
single accessible name at its outer boundary; inner paths are never labelled, and
a hover tooltip is never the primary accessible name. Purely decorative icons MUST
be hidden from assistive technology, as is purely decorative text — the giant
`404` glyph on the not-found surface — so the accessible name comes from the real
heading.

**Links.** Every link pointing at an external origin MUST open in a new tab and
isolate that tab from the originating page: no access back to the opener, no
referrer leakage. Internal navigation MUST use the internal-link primitive so
client-side routing applies, and never carries the external-link attributes.
Links MUST keep a visible underline offset from the baseline; colour-only link
treatment is not acceptable.

**Focus.** Every interactive surface MUST show a visible focus indicator when
reached by keyboard. Removing the browser default without a replacement is
prohibited, as is removing a clickable surface from the tab order for styling
convenience. The replacement ring MUST use an accent role and match the surface's
corner shape, and its width, offset, and colour are never retuned per surface.

**Colour and state.** Every surface MUST stay legible in both schemes; a surface
that loses contrast in one is a design bug. State MUST NOT be conveyed through
colour alone — every hover, active, selected, and error state also carries a
non-colour signal. Text links pick up a background-fill swap one slot along the
accent scheme; cards swap their background one slot along their resting tier and
may bump image brightness; icons swap both stroke colour and a subtle background
pill one slot along.

**Targets.** Every interactive icon and small inline control MUST have an
effective tap area of at least roughly 40×40 regardless of its visual size — the
drawn bounds of an icon are not its tap area.

**Language.** The root document's language attribute MUST be negotiated per
request rather than fixed. `negotiateLocale` in `app/(app)/_/helpers/i18n.ts`
takes an explicit `NEXT_LOCALE` cookie choice first, then the highest-quality
`Accept-Language` entry mapping to a supported locale, then falls back to
`ja-JP`. Three root documents render it: `app/(app)/_components/document.tsx`
and `app/global-not-found.tsx` resolve the live negotiated locale, while
`app/(app)/global-error.tsx` uses the default because a last-resort error boundary
cannot do request-time async work. A run of content whose language differs from
the negotiated root MUST carry its own `lang` attribute — the language switcher's
per-locale options are the worked example, each naming its own language rather
than the document's.

**Motion.** The reduced-motion preference MUST be honoured on looping and
attention-grabbing motion; it is not yet honoured on hover fades. Four
stylesheets carry a `@media (prefers-reduced-motion: reduce)` guard — the loading
placeholder's pulse, the not-found heading's glitch pseudo-elements, the index
portrait's glitch layers, and the markdown table scrollbar's fade. Three filter
and colour transitions remain unguarded: the blog post header's 3-second sepia
fade, the blog post list's hover fade, and the language switcher's transition.
They are single-shot, user-initiated, and low-amplitude, which is why they were
not covered first — but they are the remaining gap, not the accepted state.

**Overlays and analytics.** A modal or dialog MUST use the native dialog element,
with its built-in accessible name, focus trap, and escape-to-close, rather than a
custom overlay built from generic wrappers. An analytics handler on a link MUST
run alongside the native click, never instead of it.
