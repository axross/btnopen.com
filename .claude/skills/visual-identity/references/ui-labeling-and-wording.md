# UI Labeling and Wording

Apply these rules when writing any user-facing string — navigation labels, button copy, headings, section titles, error messages, icon / image accessibility strings, loading-placeholder sample text, and metadata strings shown to humans.

## Language

Language captures the project-specific context for the checklist below: The site serves two locales, negotiated per request — `ja-JP` and `en-US`, with `ja-JP` as the default. UI copy is not written inline; it comes from the per-locale catalogs under `app/(app)/_/translations/`, read through `next-intl`.

- Primary UI copy language is **Japanese**. English is the fallback for readers outside Japanese-reading locales, as the project overview in the repository's working agreement states — and the negotiation encodes exactly that: `defaultLocale` is `ja-JP`, and English is reached only by an explicit choice or a matching `Accept-Language`.

**Guidelines:**

- MUST add a new UI string to every locale catalog under `app/(app)/_/translations/`, not to one — a key present in only one catalog leaves the other locale rendering a missing-message fallback.
- MUST NOT hardcode user-facing copy in a component when an equivalent catalog key would serve; the language attribute and the copy have to agree, and only the catalog keeps them in step.
- SHOULD write Open Graph / Twitter / metadata strings in the language that best serves discovery for the primary audience — the homepage is currently authored in Japanese for its social-preview copy, and `alternateOpenGraphLocales` advertises the other locale.

## Voice and Tone

Voice and Tone captures the project-specific context for the checklist below: Error and empty-state headings SHOULD adopt a **code-syntax voice** — a JS-expression-shaped line that reads as `<subject>.<predicate> === <value>`. The canonical examples:

- The brand voice is **developer-flavored, technical-but-playful**. Copy leans into code-shaped expressions rather than reading as corporate.

**Guidelines:**

- SHOULD write error and empty-state headings in a **code-syntax voice** — a JS-expression-shaped line that reads as `<subject>.<predicate> === <value>`. The canonical examples:
  - 404 (generic): `page.found === false`
  - 404 (blog post not found): `post.found === false`
  - Predicates MAY be past-tense states such as `loaded`, `authorized`, or `exists` when those read more naturally than `found`.

- SHOULD pair each code-syntax heading with a humanized Japanese description stating what was not found:
  - `お探しのページは見つかりませんでした` (page not found)
  - `お探しの投稿は見つかりませんでした` (post not found)

- SHOULD write primary-action copy in error states as short English sentence-case imperatives — the canonical example is `Go back home`.
- SHOULD write section headings on index and listing surfaces as short English nouns with no trailing punctuation — the canonical example is `Posts`.
- MUST NOT use exclamation marks, emoji, or scare quotes in UI copy (see the no-emoji rule below).

## Specific Copy Conventions

Specific Copy Conventions captures the project-specific context for the checklist below: Brand name SHOULD appear as `btnopen.com` in body copy and as the wordmark `<btn open />` (spaces, angle brackets, and slash intentional) inside browser-tab titles.

**Guidelines:**

- SHOULD render the brand name as `btnopen.com` in body copy and as the wordmark `<btn open />` (spaces, angle brackets, and slash intentional) inside browser-tab titles.
- MUST NOT coerce case, translate, or reformat tag strings in the UI layer — tag labels come directly from the CMS, so render the CMS value verbatim.
- MUST NOT append titles or honorifics at the UI layer. The author's display name is used as both body copy and as the accessibility label on the portrait.
- MUST display only the host portion of a URL in web-embed cards, not the full path — the preview is meant to identify the source at a glance, not reproduce it.
- MUST NOT editorialize within code content; inline code and code blocks MUST preserve the author's original casing and whitespace.

## Timestamps

Timestamps captures the project-specific context for the checklist below: Listing surfaces (the home-page blog-post list) MUST render **relative** timestamps — e.g., `about 4 months ago`. A relative form communicates recency at a glance.

**Guidelines:**

- MUST render **relative** timestamps on listing surfaces (the home-page blog-post list) — e.g., `about 4 months ago`. A relative form communicates recency at a glance.
- MUST render **absolute**, long-form timestamps on detail surfaces (the blog-post header) — e.g., `April 16, 2026`. An absolute form communicates "when exactly" for the reader who chose to open the post.
- MUST route date formatting through the project's shared date library (`date-fns`, already a dependency) rather than a per-component reimplementation — consistency of format across the site is the point.

## `aria-label` and `alt` Strings

`aria-label` and `alt` Strings captures the project-specific context for the checklist below: Icons that represent a destination or a brand MUST use the canonical host name as the accessibility label:

**Guidelines:**

- MUST label icons that represent a destination or a brand with the canonical host name:
  - GitHub icon: `github.com`
  - X (Twitter) icon: `x.com`
  - LinkedIn icon: `linkedin.com`
  - Logo: `btnopen.com`

- SHOULD label icons that represent an abstract graphic concept with a short, descriptive English label — `Background` for the portrait backdrop, `Web Page` for the web-embed fallback illustration, `favicon shape` for the favicon glyph.
- MUST make image alt text describe the depicted subject, not the image's role in the layout:
  - Post cover / thumbnail: the post's title.
  - Author avatar: the person's display name.
  - CMS-sourced media: the author-supplied alt, falling through to the upload's own alt, falling through to empty only when the image is genuinely decorative.

- SHOULD make web-embed images describe the remote page: the remote page's title if available, then the author-provided link text, then the raw URL as a last resort.

## Emoji

Emoji is a project prohibition: do not include emoji in rendered UI copy or in Markdown content authored for the project's own surfaces.

**Guidelines:**

- MUST NOT include emoji in rendered UI copy or in Markdown content authored for the project's own surfaces.
- MAY allow emoji in observability module identifiers because they are not rendered UI copy. See the project's observability conventions.

## Loading-Placeholder Sample Text

Loading-Placeholder Sample Text captures the project-specific context for the checklist below: Loading placeholders render lorem-ipsum-style strings whose **shape** mirrors the real content. Sample text MUST match the proportions of what it stands in for:

**Guidelines:**

- MUST ensure loading placeholders render lorem-ipsum-style strings whose **shape** mirrors the real content. Sample text MUST match the proportions of what it stands in for:
  - Timestamp placeholders: short phrases sized like real timestamps (e.g., `about 2 weeks ago`, `about 4 months ago`, `about 1 year ago`).
  - Title placeholders: one-line Latin strings sized like real titles (e.g., `Lorem ipsum dolor sit amet consectetur adipiscing elit`).
  - Brief / description placeholders: two-to-three-sentence Latin strings that clamp cleanly to the same line-clamp as the real content.

- MUST NOT use real UI copy, product names, or actual post titles as sample text — the placeholders are deliberately non-semantic so the reader perceives them as "loading", not as "copy".
- MAY vary sample strings across items in a list so the skeleton does not look rhythmically repetitive.

## Metadata Strings

Metadata Strings captures the project-specific context for the checklist below: The brand wordmark `<btn open />` MUST appear in the browser-tab title of every page (as the trailing suffix after a separator) to keep the voice consistent across every tab.

**Guidelines:**

- MUST include the brand wordmark `<btn open />` in the browser-tab title of every page (as the trailing suffix after a separator) to keep the voice consistent across every tab.
- MUST source description, keywords, authors, and Open Graph fields from the CMS rather than hard-coding them at the route level — the CMS is the single source of truth for marketing-facing copy.
