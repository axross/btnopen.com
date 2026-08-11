# Glossary

The words this repository uses, and what each one means here. The first half is
the product's vocabulary, grouped by the spec that details each domain. The second
half is the vocabulary of building and running the repository, grouped by the
document that owns it.

A term earns an entry when a newcomer would otherwise have to infer it. A word
whose ordinary meaning is already exact is left out.

# Product vocabulary

## Blog Posts

**Blog Post** — one article on the site, and its primary content type. It is
either a **Draft** or **Published**, and it is addressed by its **Slug**.

**Slug** — the non-localized identifier in a post's URL, unique across all posts.
It is also the key every cache entry for that post is tagged with.

**Draft** — a post's unpublished state. A draft is readable by a request
authenticated through the CMS, or by one presenting that post's **Draft Share
Link**, and never appears in the sitemap or the post list.

**Draft Share Link** — a **Blog Post**'s preview URL carrying that post's own
secret, which lets whoever holds it read that post's draft without signing in. It
has no expiry and no per-recipient revocation, so replacing the secret —
rotating it — invalidates every outstanding link at once and is the only
revocation there is.

**Published** — a post's world-readable state. Moving into or out of it is what
clears the cached output for that post and for the post list.

**Brief** — the localized one-paragraph summary of a **Blog Post**, shown in the
post list and in the page's metadata rather than in the post body.

**Tag** — a shared record a **Blog Post** points at, so the same tag is one entity
across every post carrying it. Its label renders exactly as the CMS holds it.

**Cover Image** — the upload that serves as a **Blog Post**'s hero, its list-item
cover, and the source for its generated social-preview image. It lives in its own
collection, separate from the media embedded inside a body.

## Markdown Rendering

**Body** — the rich-text field holding a **Blog Post**'s article content,
authored in the CMS editor and converted to markdown at render time.

**Partial GFM** — the subset of GitHub Flavored Markdown this site renders:
strikethrough and tables, and nothing else. Autolinks, footnotes, and task lists
are deliberately unsupported.

**Embed** — a rich preview card that a lone link in a **Body** becomes, showing
the linked page's title, description, host, and cover image instead of a plain
anchor.

**Banner** — a callout block inside a **Body**, in one of two kinds, `note` or
`warning`.

**Literalized Directive** — markdown directive syntax the site does not implement,
printed verbatim as the author typed it rather than dropped. It exists because
directive syntax collides with ordinary prose, such as a colon-word like
`TypeScript:strict`.

## Comments

**Comment** — one reader-submitted message on a **Blog Post**. It is the only
thing a member of the public can write to the site's database.

**Pending** — the state every reader-submitted **Comment** is stored in, and is
invisible to other readers until the author approves it.

**Author Reply** — a **Comment** written by the site's author in response to
another comment. Only the author can write one, and only one level deep.

**Tombstone** — how a hidden top-level **Comment** renders when it still anchors an
approved **Author Reply**, so the reply keeps its context instead of the thread
disappearing.

## Reader Surfaces

**Reading Column** — the centred, fixed-width column every reading surface shares
at a given **Tier**, inherited from the page root rather than declared per
surface.

**Tier** — one of the three named width bands the design responds to: mobile,
tablet, and desktop. A tier is resolved from the surface's own container width,
never from the viewport's.

**Full-Bleed** — a surface that extends past the **Reading Column**'s gutter to
the viewport edge, reserved for content meant to read as atmospherically large.

**Skeleton** — the placeholder rendering of a surface that is still fetching, built
at the same dimensions and grid as the loaded surface so no layout shift occurs
when it fills in.

## Content Authoring

**Agentic View** — the `noindex` rendering of a **Blog Post** at
`?agentic=true` that shows its authoring artifacts instead of the published
article, and is the surface handed back after writing either of them.

**Outline** — the authoring artifact mapping a **Blog Post**'s body structure: one
nested bullet list, one top-level bullet per section, with each section's
substance nested beneath. It carries no meta content and is never rendered
publicly.

**Authoring Notes** — the authoring artifact holding everything *about* the
writing — aims, conclusion, target reader, editorial policy, progress, and the
pre-publication checklist. It is never rendered publicly.

**Website Profile** — the CMS global holding the site's own name, description,
keywords, and creator, and the source of the reader-facing metadata.

**MCP API Key** — a credential for the CMS's Model Context Protocol server, scoped
to a specific set of tools, so what an agent can do is a property of its key.

# Development vocabulary

## Directory Structure

**Realm** — one of the two halves of the codebase that must not import each
other: the app realm under `app/`, and the Payload realm under `payload/`. Logic
both need lives in a realm-neutral tier they each import.

**Directory Tier** — the level a module is placed at, resolved from how many
callers it has: route-local, route-group-shared, the Payload realm, or
realm-neutral.

**Environment Barrel** — the single module per **Realm** through which runtime
configuration is read, so a review has one place to look to know what is exposed.

## React Components

**Loaded / Loading Triad** — the three-file shape of a component that fetches its
own data and shows a visible loading state: an orchestrator, a `loaded` sibling
rendering real data, and a `loading` sibling rendering the **Skeleton**.

## Visual Identity

**Accent Ramp** — the brand colour ramp, used for anything that should visibly
carry identity: links, selection, interactive hover, branded surfaces.

**Neutral Ramp** — the chrome colour ramp, used for anything that should read as
neutral UI rather than brand. It shares its lightness scale with the **Accent
Ramp**.

**Step** — one position on the 13-step scale both ramps share, carrying a defined
role such as "component background at rest" or "low-contrast text". The role is
identical in light and dark, which is what lets a surface adapt to both schemes
without a per-scheme override.

**Squircle** — the site's corner treatment: a softer, more geometric curve than a
traditional radius arc. Circular avatars are the one opt-out.

**Colour Grading Recipe** — the four-pass filter (sepia, saturation, hue shift onto
the brand hue, per-scheme brightness) applied to branded imagery so external
photographs join the palette rather than sitting beside it.

**Code-Syntax Voice** — the site's convention for error and empty-state headings,
shaped as a JavaScript expression such as `post.found === false`.

**Wordmark** — the brand mark `<btn open />`, spaces and angle brackets
intentional, which appears as the trailing suffix of every browser-tab title.

## Observability

**Module Emoji** — the emoji a child logger sets to name its **category of work**,
not its file. Several modules share one deliberately, so filtering on it selects a
whole category.

## Testing

**Scenario Coverage** — this project's measure of end-to-end coverage: which real
user journeys the suite *asserts*, rather than which application lines it
executes.

**Scenario** — one row in the journey catalogue, carrying a stable dotted id, a
title, an area, and a priority. A test joins to it by tag.

**Test Id** — the short, scope-relative attribute a test locates an element by.
The page-level component owns the top scope and passes it down, so ids are
readable in nesting order rather than globally unique.

## Preview Deployment

**Preview** — the live deployment of one pull request, served from a stable
per-pull-request URL and backed by its own database and media namespace.

**Preview Namespace** — the `pr-<n>/` prefix every file a **Preview** uploads is
stored under, so one preview's media never collides with another's or with
production's, and the whole prefix can be deleted at teardown.

**Seed** — the repository's own idempotent fixture-loading routine, which
populates a **Preview**'s empty database on first boot, and which local
development and the end-to-end suite also use.

## Agent Skills

**Installed Skill** — a capability copied into this repository from the shared
skill library and pinned by the lockfile. Every skill here is one; editing an
installed copy is pointless because the next install discards it.

**Deviation** — a rule this repository deliberately does not follow, where an
**Installed Skill** requires one thing and this repository does another. It is
recorded so it does not read as a plain violation.

**Gap** — an **Installed Skill** that is wrong, outdated, or silent on a case that
comes up here. It is recorded locally and, where it generalizes, filed upstream.
