# Blog Posts

The site's primary content type. This describes what a post is, what it carries,
and how it moves from draft to published. How a post's body renders is
[markdown-rendering.md](./markdown-rendering.md); the surfaces it appears on are
[reader-surfaces.md](./reader-surfaces.md); the editing surfaces are
[content-authoring.md](./content-authoring.md).

## What a Post Carries

| Field | Localized | Required | Notes |
| --- | --- | --- | --- |
| `title` | yes | yes | |
| `slug` | no | yes | Unique across the collection; the post's address |
| `body` | yes | yes | Lexical rich text, rendered as markdown |
| `brief` | yes | yes | The summary shown in the post list and in metadata |
| `coverImage` | no | yes | An upload from the `cover-images` collection |
| `tags` | no | no | Any number, from the `tags` collection |
| `author` | no | yes | A `users` record |
| `publishedAt` | no | no | A date, chosen by the author, shown to the day |
| `isCommentsEnabled` | no | yes | Defaults to on; controls whether the comments section appears |
| `outline` | no | no | An authoring artifact, never rendered publicly |
| `authoringNotes` | no | no | An authoring artifact, never rendered publicly |

`outline` and `authoringNotes` are described in
[content-authoring.md](./content-authoring.md).

## Localization

The site serves two locales — `ja-JP` and `en-US` — with **`ja-JP` as the
default**. A reader-facing field marked localized above holds a separate value per
locale, and `en-US` falls back to `ja-JP` when its value is absent. Nothing falls
back the other way.

The **slug is not localized**, so a post has exactly one address regardless of the
reader's language, and the sitemap lists it once.

## Slugs

A slug is unique and validated against a shared schema when a post is published.
That validation exists because the slug is what cache invalidation is keyed on: a
slug the CMS accepted but the cache-invalidation endpoint rejects would leave a
published post serving stale output forever.

Draft and autosave writes skip validation entirely, so the check gates
**publishing** rather than every keystroke.

## Draft and Published

Every post is either a draft or published, and Payload keeps version history with
autosave.

A published post is world-readable. A draft is not: an unauthenticated read of the
public API sees published posts only, and the reader-facing route serves a draft
only to a request authenticated through the CMS. A `?draft=true` search parameter
asks for the draft, but asking is not authorization — the authentication is what
grants it.

`?preview=true` does **not** unlock draft content. It only decides whether the
live-preview bridge renders, so an author editing in the admin sees the page
update as they type.

A post can also be moved to trash rather than deleted outright. Permanently
deleting one deletes its comments first, since a comment holds a required
reference to its post.

## Publishing Side Effects

Publishing, unpublishing, or deleting a post clears the cached output for the post
list and for that post's own page. Draft and autosave writes do not: they cannot
change what a reader sees, so they skip the invalidation entirely.

A failure to clear a cache never fails the write. The failure is reported for
investigation and the content change stands, because a missed revalidation is
recoverable and a refused save is not.

## Tags and Cover Images

A **tag** is a shared record a post points at, so the same tag is one entity
across every post carrying it. Tag labels render exactly as the CMS holds them —
the UI does not coerce case, translate, or reformat them.

A **cover image** is an upload in its own collection, distinct from the `media`
collection used for images inside a post body. It appears as the post's hero on
the post page, as the list item's cover in the post list, and as the source for
the post's generated Open Graph image. Its alt text is the post's title, because
alt text describes the depicted subject.

Cover images, body media, and avatar images are all publicly readable, as static
assets.
