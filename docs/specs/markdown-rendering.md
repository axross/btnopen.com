# Markdown Rendering

What a blog post body renders into, and what the site guarantees about content
written in the CMS. How the pipeline is built is
[../conventions/markdown-pipeline.md](../conventions/markdown-pipeline.md); how a
construct is added is
[../conventions/markdown-extensions.md](../conventions/markdown-extensions.md).

Post bodies are authored in Payload's Lexical rich-text editor and converted to a
markdown string at render time. Everything below describes what that markdown then
becomes.

## The Supported Syntax

Standard CommonMark renders in full: headings, paragraphs, emphasis, strong
emphasis, lists, blockquotes, inline code, fenced code, images, and links.

Emphasis boundaries are **CJK-aware**. Japanese is the primary authoring
language, and plain CommonMark refuses emphasis markers that sit adjacent to CJK
characters, so a run of Japanese text can carry emphasis where it otherwise could
not.

GitHub Flavored Markdown is supported **partially — strikethrough and tables
only**. Autolinks, footnotes, and task lists are not supported; the constrained
format is deliberate, because every capability the format cannot express is an
attack the renderer never has to defend against.

### Tables

A GFM pipe table renders end to end. Column alignment (`:---`, `:---:`, `---:`)
reaches the rendered page as an inline `text-align` style rather than an
attribute, and overrides the stylesheet's `text-align: start` default whenever
alignment is authored.

A table sits inside a horizontally scrollable region with its own focus ring, so a
wide table can be reached by keyboard as well as by pointer, and header cells are
always column headers — GFM syntax produces no row headers.

Two limits apply to tables **authored through the Lexical admin**, not to GFM
markdown reaching the pipeline from elsewhere:

- **Column alignment is not authorable.** The editor always emits `| --- |`
  dividers.
- **Merged cells are silently dropped.** GFM has no standard for `colspan` or
  `rowspan`, so the Lexical-to-markdown exporter discards them.

### Code

A fenced code block is syntax-highlighted with Shiki and themed through CSS
variables, so highlighting follows the site's colour scheme rather than carrying a
theme of its own. Adding a language is a code change — the set of languages is
compiled in rather than loaded on demand. Code surfaces declare their own tab
width, and inline code and code blocks preserve the author's original casing and
whitespace.

On mobile a code block extends to the viewport edge and settles back inside the
reading column at tablet width.

### Embeds

A paragraph containing nothing but a bare link becomes an **embed**: a rich card
previewing the linked page, with its title, description, host, and cover image,
rather than a plain anchor. The card shows only the **host** portion of the URL,
because it identifies the source at a glance rather than reproducing it. An
author can also insert an embed deliberately from the editor.

Only web-page embeds render today. An embed whose URL is not `http` or `https`
renders nothing at all.

### Callouts

A **banner** block renders a callout with block-level content inside it. Two kinds
exist: `note` and `warning`. A banner of an unrecognized kind renders as a `note`
and reports the unknown kind for investigation rather than failing.

### Images

An image in a post body renders through the site's media component, which reads
the stored dimensions from the CMS and falls back to serving the file unoptimized
when they are missing. An image with an unusable source renders nothing rather
than breaking the page. In-content images keep their natural colour — the branded
colour-grading recipe applies to covers and embed previews, not to body media; see
[visual-identity.md](./visual-identity.md).

### What Does Not Render

Raw HTML in a post body does not render as markup. The pipeline processes markdown
only, and never HTML.

Markdown directive syntax that the site does not implement is preserved as
**literal text**, exactly as the author typed it — name, attributes, and fences
included. This matters because directive syntax collides with ordinary prose: an
inline `:name` fires on any colon-word such as `TypeScript:strict`. Rather than
dropping such text, the renderer prints it verbatim.

A genuinely unknown construct is skipped and reported for investigation. Nothing in
the rendering path throws: a post with an unexpected construct renders the rest of
itself rather than failing.

## Content-Safety Guarantees

The pipeline turns CMS-authored content into markup, which makes it the site's
principal untrusted-content surface. Two facts shape everything else:

- **The CMS is not a filter.** Payload's Lexical link field rejects only empty
  values and values containing a space, so a `javascript:` destination is storable
  through the admin and through the MCP server alike.
- **The markdown-to-HTML bridge does not sanitize URLs**, and has no sanitizing
  mode to switch on. A dangerous protocol reaches the rendering layer intact.

So the guarantees are made by explicit controls:

| Guarantee | How it holds |
| --- | --- |
| A rendered link destination is `http`, `https`, `mailto`, or `tel` — nothing else | A protocol allowlist runs as the last step before rendering, and the same check runs again inside the link component. Either alone would suffice; both exist so removing one does not open the surface |
| A refused destination loses its `href`, never its text | The author's link text still renders, so refusing a URL never erases prose |
| An embed renders only for `http(s)` | Embeds bypass the anchor path entirely, so they carry their own gate |
| Text and attribute values are output-encoded | Rendering goes through React's JSX runtime. This is an encoding guarantee, **not** a URL defence — React refuses `javascript:` as an internal precaution and lets `data:` through |
| An unexpected construct degrades rather than crashing | The unknown-node handler reports and skips. It is permissive by design, which also means it stops nothing |

### Links in a Post Body

Every link in a post body is the only anchor on the site whose destination is
authored rather than coded.

- An **external** destination opens in a new tab, isolated from the originating
  page — no access back to the opener, no referrer leakage.
- An **internal** destination routes client-side, with neither attribute.
- A **protocol-relative** destination (`//host/path`) counts as external. It
  carries no scheme, so a naive check would call it internal and hand an off-site
  navigation to the internal-link primitive.
- `mailto:` and `tel:` get neither attribute; they hand off to another
  application rather than opening a browsing context.
- A body link carries **no** `nofollow`. A post body is author-written;
  `nofollow ugc` belongs to reader-submitted links in comments.

A same-origin **absolute** destination such as `https://www.btnopen.com/posts/x`
is deliberately treated as external. Resolving it to internal would mean comparing
against the deployment's own origin, which on a preview deployment is the branch
host — so one authored link would behave differently on preview and on production.
The cost is an unnecessary new tab, not a safety gap.

### Images from Elsewhere

The image host allowlist is the only gate between an authored URL and the image
pipeline, and rendering an image "unoptimized" skips that check entirely. The web
embed's cover image is served that way, with the remote URL coming from the
scraped page — a known and accepted risk rather than an oversight, and one that
should not be worsened.
