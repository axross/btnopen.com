# Reader Surfaces

The surfaces a reader of btnopen.com actually meets: the routes, what each one
shows, how they behave across widths, and what they do when there is nothing to
show. What those surfaces look like is [visual-identity.md](./visual-identity.md);
how a post body is rendered is
[markdown-rendering.md](./markdown-rendering.md).

## Routes

| Route | Serves |
| --- | --- |
| `/` | The site's only landing surface: the author's portrait, bio, social links, and the blog-post list |
| `/posts/[slug]` | One blog post — header, body, and, when enabled, its comments |
| `/posts` | Nothing of its own; it redirects to `/` |
| `/privacy` | What the site collects, on what basis, and the permanent control for changing the analytics decision |
| `/posts/[slug]/thumbnail.png` | The post's generated Open Graph image |
| `/sitemap.xml` | The index page plus every published post |
| `/robots.txt` | Allows every agent, and points at the sitemap |
| `/admin` | The Payload admin — an author surface, see [content-authoring.md](./content-authoring.md) |

A request for a post that does not exist, or that is a draft the requester is not
authorized to see, renders the not-found surface described below.

The index page carries `BlogJsonLd`, and a post page carries `BlogPostingJsonLd`,
so a post is machine-readable as structured data as well as HTML.

## Chrome

Two elements bracket every route. The **header** carries the wordmark, linking
home, and the language switcher. The **footer** is a single row — the copyright
on the left, the privacy link on the right — above a hairline rule, and it also
holds the page's trailing breathing room, so the space that used to sit below the
last section now sits above the footer instead. Both stretch the full width while
the content between them stays in the reading column.

The footer renders on every route, in every consent state, including the
not-found surface: the privacy link has to outlive the consent banner, which
disappears the moment a visitor answers it.

## Consent

A visitor who has not answered the analytics question sees a **consent banner**,
and no analytics code is loaded until they answer. It is a compact card anchored
to the bottom-right corner from tablet width up, and a full-width card inset from
both edges on mobile. It states what is collected, that error reporting runs
either way, and links to `/privacy`.

It offers two answers and no third way out — closing without deciding would leave
a visitor permanently unasked — and both sit at the same slot of their own colour
scheme, so neither is easier to pick than the other. Once answered it never
appears again; `/privacy` carries the permanent control, and is the only place a
decision can be changed. That control reports **three** states, because a visitor
who has not answered has not declined.

Answering takes effect immediately and in both directions, with no page reload.
Granting reports the page the visitor is already on; nothing from before the
grant is sent.

The sitemap lists each post **once**, under the default locale, because slugs are
not localized. `robots.txt` renders at request time rather than build time: the
origin comes from Vercel's system environment variables, which are absent on the
Actions runner where both pipelines build, so a prerendered `robots.txt` would
bake in `http://localhost:3000` on a preview and `https://undefined` in
production.

## Widths

The design has **two breakpoint transitions and three named tiers**, and a tier
responds to the **surface's own container width**, not the viewport's — a
blog-post component embedded inside a narrower shell tiers against that shell.
Viewport-level queries are reserved for genuinely viewport-global concerns:
colour scheme, motion preference, print.

| Tier | Width | Posture |
| --- | --- | --- |
| **Mobile** | up to ~480px | Single column; full-bleed imagery; ~16px edge gutters; always-on card fills; stacked sub-elements |
| **Tablet** | ~480–800px | Centred ~448px reading column; gutters removed; side-by-side structural layouts unlock |
| **Desktop** | above ~800px | Centred ~736px reading column; denser layouts; more breathing room around the column |

The ~480px transition is the "stop scrolling as a phone column, start reading on a
tablet" moment; the ~800px transition is the "treat this like a full desktop
reading page" moment. There are only these two, and a surface that wants a
different density at some intermediate width adapts by proportional sizing —
column width, image aspect ratio — rather than by adding a tier.

Every reading surface — post body, post header, index intro, section containers —
shares the same column width per tier, inherited from the page root rather than
declared locally. Mobile reading surfaces carry ~16px horizontal gutters so text
never touches the viewport edge; tablet and desktop remove them, because the
shared column already insets the content and doubling up would narrow the column
below the shared value. Crossing ~480px reads as one coordinated posture shift
rather than a scatter of per-surface gutter changes.

### Structural Transformations

Every structural change fires at the **mobile → tablet** boundary; the
tablet → desktop boundary is reserved for density. Five exist, and a new surface
reuses one rather than inventing a variant:

- **Column → row-reverse** — the homepage intro reverses from stacked
  portrait-above-bio to portrait-beside-bio.
- **Stacked card → image-beside-text grid** — the blog-post list item and the
  web-embed card both switch to a two-column grid, image left, text right.
- **Always-on card fill → hover-only fill** — cards carrying a resting background
  fill on mobile (so a card reads as a card without hover) drop it at tablet,
  because the grid structure already differentiates the card.
- **Full-bleed → inset** — the post cover image is flush to the viewport edge with
  no corner radius on mobile, and gains a soft card corner at tablet so it
  realigns inside the reading column.
- **Full-bleed → column-aligned** — code snippets extend to the viewport edge on
  mobile and settle inside the reading column at tablet.

A full-bleed element transitions to inset by gaining a soft card corner, so it
reads as having joined the column rather than still trying to be full-bleed at a
size where that makes no sense. Full-bleed is reserved for content that wants to
read as atmospherically large; inset is the default for anything in the prose
flow.

### Image Ratios

An image's aspect ratio changes between tiers only when its role in the
composition changes, and never more than twice — one crop for mobile, one for
tablet and desktop:

| Image | Mobile | Tablet+ | Intent |
| --- | --- | --- | --- |
| Blog-post list item cover | `1600 / 600` | `1600 / 1200` | Short banner above text, versus tall left column beside text — the same asset, recropped |
| Blog-post header cover | `1600 / 840` | `1600 / 840` | Stable hero; only the corner radius changes |
| Web-embed card image | `1200 / 630` | `1200 / 630` | Stable OG-sized preview; the container shape changes around it |
| Index-page portrait | `1 / 1` | `1 / 1` | Stable portrait; container sizing changes, ratio does not |

Both crops read as the same asset viewed differently, never as two unrelated
images — which is what keeps the list → detail morph coherent.

## Loading

A surface that is fetching renders a **skeleton at the same outer dimensions,
spacing, and grid structure** as its loaded counterpart, so navigating into a
route shows the skeleton collapsing into real content with no layout shift.
Skeleton line clamps, aspect ratios, and text widths match the loaded surface's
proportions, so the transition reads as the same layout filling in.

Two placeholder primitives serve every skeleton:

- a **rectangle placeholder** for image, media, and figure slots — a
  medium-radius rectangle tinted at a subtle neutral step, pulsing one step
  brighter;
- a **text placeholder** for text slots — each whitespace-separated word in the
  sample text renders as a pill sized to the word's character count, wrapped and
  clamped to the matching line clamp.

There is no third primitive; a genuinely new shape extends these with a new
exported variant. The pulse cadence is identical everywhere on the site, so
several placeholders on screen pulse in phase — the page reads as waiting, rather
than as several independent things waiting.

Sample text mirrors the real content's **shape**, not its meaning: Latin strings
sized like real titles, briefs, and timestamps — `about 2 weeks ago`,
`Lorem ipsum dolor sit amet consectetur adipiscing elit`, two-to-three-sentence
briefs that clamp cleanly. Real UI copy, product names, and actual post titles are
never used as sample text, because the placeholder should be perceived as loading
rather than as copy. Sample strings may vary across items in a list so the
skeleton does not look rhythmically repetitive.

Each loading boundary is sized around the smallest meaningful content region
rather than the whole page. A full-page spinner is not on brand here: the loading
experience reads as "this specific part of the page is filling in". The site-wide
root-level boundary exists to serve analytics-style side effects and is not a
substitute for a per-section boundary.

## List-to-Detail Continuity

Navigating from a list item to its post morphs the shared visual elements — cover
image, timestamp, title — in place, so the reader feels the list item *becoming*
the post rather than dissolving and being replaced. Shared-element transitions are
named `<entity>-<identifier>-<role>`, and both the list side and the detail side
wrap the same semantic element with the same name; a missing pairing breaks the
morph silently.

The image morph pairs with a slow sepia fade-in, so the thumbnail's accent tint
settles after the shape morph completes. That fade is deliberately longer than
interactive motion — a roughly 3-second atmospheric reveal rather than a
hover-speed snap.

## Not Found

Every missing route renders through **one shared not-found surface**; there is no
ad-hoc per-route not-found UI.

The giant status number is its signature decorative element: typeset in the
monospace family, bold, at the largest size on the page, and rendered as a glitched
triplet — one base layer in an accent step with two slightly hue-offset copies
clipped by alternating noise masks. The effect reads as a tasteful terminal
flicker, never as broken, and it is hidden from assistive technology so the
accessible name comes from the real heading.

The heading follows the code-syntax voice (`page.found === false`,
`post.found === false`), the description is a single Japanese sentence stating
what was not found, and the primary action is a single `Go back home` link to the
index. There are no secondary actions — no search, no report, no recent-posts
list. The glitch visual plus one escape hatch is the intended aesthetic.

## Empty

A list that can legitimately be empty renders a muted message **inside** the list
container rather than collapsing the container, so the surrounding chrome stays
anchored and the page does not reflow. An empty-state heading takes the same
code-syntax voice as a not-found heading where that reads naturally, and any
future empty-state surface is a shared component following the not-found surface's
composition pattern rather than a route-local one-off.
