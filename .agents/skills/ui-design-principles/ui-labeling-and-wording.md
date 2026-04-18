# UI Labeling and Wording

Apply these rules when writing any user-facing string — navigation labels, button copy, headings, section titles, error messages, `aria-label` / `alt` text, loading-placeholder sample text, and metadata strings shown to humans.

## Language

- Primary UI copy language is **Japanese**. English is the fallback for readers outside Japanese-reading locales (see the [project overview in AGENTS.md](../../../AGENTS.md)).
- `<html lang="en">` is currently set on the root `<html>` element. MUST NOT change it without a deliberate i18n rollout; inline Japanese content inside English-metadata documents is accepted without per-element `lang` attributes today.
- Open Graph / Twitter / `<Metadata>` strings SHOULD adopt the language that best serves discovery for the primary audience — the homepage's Open Graph `locale` is currently `ja_JP`.

## Voice and Tone

- The brand voice is **developer-flavored, technical-but-playful**. Copy leans into code-shaped expressions rather than reading as corporate.
- Error and empty-state headings SHOULD adopt a **code-syntax voice**:
  - 404 (global): `page.found === false`
  - 404 (blog post not found): `post.found === false`
  - When adding a new error heading, SHOULD follow `<subject>.<predicate> === <value>` shaped in JS-expression style (past-tense predicates such as `loaded`, `authorized`, `exists` are also acceptable).
- A humanized description SHOULD accompany each code-syntax heading in Japanese:
  - `お探しのページは見つかりませんでした` (page not found)
  - `お探しの投稿は見つかりませんでした` (post not found)
- Primary-action copy in error states SHOULD be short English sentence-case imperatives: `Go back home`.
- Section headings on index and listing surfaces SHOULD be short English nouns with no trailing punctuation: `Posts`.
- MUST NOT use exclamation marks, emoji, or scare quotes in UI copy (see the no-emoji rule below).

## Specific Copy Conventions

- Brand name SHOULD appear as `btnopen.com` in user-facing text and `<btn open />` inside HTML `<title>` metadata (see `global-not-found.tsx`: `"Not Found | <btn open />"`).
- Tag labels come directly from Payload CMS. MUST NOT coerce case, translate, or reformat tag strings in the UI layer — render the CMS value verbatim.
- Author name (`website.creator.name`) is used as both display text and `alt` on the portrait image. MUST NOT add titles/suffixes client-side.
- URLs displayed inside web-embeds show only the host (`new URL(urlSource ?? href).host`). MUST NOT display full paths in embed cards.
- Inline code and code blocks MUST preserve the author's original casing and whitespace. MUST NOT editorialize.

## Timestamps

- Listing surfaces (the home-page blog-post list) MUST render relative timestamps via `formatDistanceToNow(publishedAt, { addSuffix: true })` — e.g., `about 4 months ago`.
- Detail surfaces (the blog-post header) MUST render absolute timestamps via `format(blogPost.publishedAt, "PPP")` — e.g., `April 16, 2026`.
- MUST route all date formatting through `date-fns` (already a dependency); do not use `toLocaleString` or `Intl.DateTimeFormat` directly.

## `aria-label` and `alt` Strings

- Inline SVG icons that represent a destination or a brand MUST use the canonical host name as the `aria-label`:
  - GitHub icon: `aria-label="github.com"`
  - X (Twitter) icon: `aria-label="x.com"`
  - LinkedIn icon: `aria-label="linkedin.com"`
  - Logo: `aria-label="btnopen.com"`
- SVGs that represent an abstract graphic concept SHOULD use a short, descriptive English label:
  - Brush-grunge portrait backdrop: `aria-label="Background"`
  - Web-embed fallback illustration: `aria-label="Web Page"`
  - Favicon shape: `aria-label="favicon shape"`
- `alt` text on `<Image>` MUST describe the depicted subject, not the image's role in the layout:
  - Post cover / thumbnail: `alt={blogPost.title}`.
  - Author avatar: `alt={blogPost.author.name}`.
  - CMS-sourced media via `<Media>`: `alt ?? fileAlt ?? ""` — never drop `alt` on uploaded media; fall through to the file's `alt` field, then to an empty string for genuinely decorative uploads.
- Web-embed images use `alt={embedMetadata.title ?? title ?? href}` — prefer the remote page's title, then the author-provided link text, then the raw URL as a last resort.

## Emoji

- MUST NOT include emoji in rendered UI copy, component source files, or Markdown content authored for the project's own surfaces.
- The observability helpers use emoji as logger-module identifiers (`rootLogger.child({ module: "🖼️" })`) — that is **not** UI copy and MAY continue. See [observability-guidelines](../observability-guidelines/SKILL.md).

## Loading-Placeholder Sample Text

- Loading placeholders render lorem-ipsum-style strings through `<LoadingPlaceholderText sampleText="…" maxLines={…} />`. Sample text MUST match the shape of the real content:
  - Timestamp placeholders: short strings sized like real timestamps (`"about 2 weeks ago"`, `"about 4 months ago"`, `"about 1 year ago"`).
  - Title placeholders: one-line strings of Latin text matching title length (`"Lorem ipsum dolor sit amet consectetur adipiscing elit"`).
  - Brief placeholders: two-to-three-sentence Latin strings that clamp cleanly to `maxLines={2}`.
- MUST NOT use real UI copy, product names, or actual post titles as sample text — the placeholders are deliberately non-semantic.
- MAY vary sample strings across list items to avoid a repetitive-looking skeleton (see `blog-post-list/loading.tsx` for the three-item rotation).

## Metadata Strings

- `<title>` suffix MUST be `<btn open />` (with spaces, angle brackets, and slash) rather than a plain name, to keep the brand voice consistent in browser tabs.
- `description`, `keywords`, `authors`, and Open Graph fields MUST come from the CMS (`website` / `blogPost` records); MUST NOT hard-code copy into the route.
