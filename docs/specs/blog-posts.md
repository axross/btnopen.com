# Blog Posts

The site's only content type. This describes what a post is, what it carries, and
how it moves from draft to published. A post takes tags and, when enabled,
comments; beyond that there is no page builder, no newsletter, and no series or
category hierarchy, so the content model a reader meets is this one type. How a
post's body renders is
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
| `shareToken` | no | yes | The draft share link's secret. Minted on the server, never returned to a signed-out caller |

`outline` and `authoringNotes` are described in
[content-authoring.md](./content-authoring.md); the share link `shareToken`
carries is below, and the author's control over it is in the same document.

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
to a request authenticated through the CMS, or to one presenting that post's own
secret — see [The Draft Share Link](#the-draft-share-link). A `?draft=true`
search parameter asks for the draft, but asking is not authorization; a session
or the right secret is what grants it.

A session stays the primary control and is still the *only* one for everything
but a single post's own page: the draft list, the agentic view, and the
live-preview refresh action all resolve from the session alone.

`?preview=true` does **not** unlock draft content. It only decides whether the
live-preview bridge renders, so an author editing in the admin sees the page
update as they type.

A post can also be moved to trash rather than deleted outright. Permanently
deleting one deletes its comments first, since a comment holds a required
reference to its post.

## The Draft Share Link

A session is not the only way to read a draft. Every post carries its own secret,
and a request presenting that post's current secret reads that post's draft while
signed out — the page, its body, and its Open Graph thumbnail. The link is the
post's own preview URL with the secret appended:

```text
https://btnopen.com/posts/<slug>?draft=true&token=<secret>
```

The reviewer sees the real page. Nothing on it says the post is a draft, and the
only signal is the URL.

What a link **does not** unlock is the point of the design. The secret is per
post, so it opens that post and no other; it does not open the draft list at
`/?draft=true`, the agentic view at `?agentic=true&draft=true`, or the
live-preview refresh action. A request with no secret, a rotated one, a malformed
one, or another post's sees exactly what it saw before the feature existed — the
published post, or the not-found surface when there is nothing published.

A draft render is never indexable. Every `?draft=true` render that resolves — of
`/posts/<slug>` and of the index route alike — carries `noindex, nofollow`, so
a link that leaks or gets forwarded cannot put unpublished content into a search
index. The thumbnail the shared page advertises is covered too: a
`/posts/<slug>/thumbnail.png` request that resolves as a draft answers with an
`X-Robots-Tag: noindex` header, since it is a separate response from the page
and the URL that reaches it is itself the secret. That response carries no
`nofollow`, because an image has no links to follow. A published render's
metadata is untouched on both routes, and a thumbnail request that does not
resolve as a draft — which is every request not carrying that post's current
token — answers exactly as it did before. A `?draft=true`
request that resolves to nothing renders the not-found surface instead, which
carries no such opt-out: it answers `404`, which is what keeps it out of an
index, and it has no draft content on it to protect. The index route's
draft list resolves from the session alone, so a crawler reaching it would see
only published posts either way; it opts out regardless, because the rule is
about the render rather than about what each route currently happens to
disclose.

The secret is a **bearer credential**: anyone holding the link can read the
draft, there is no expiry, and there is no per-recipient revocation. Replacing
the secret — rotation, described in
[content-authoring.md](./content-authoring.md) — invalidates every outstanding
link at once and is the only revocation there is. Why it works that way is
[../decisions/2026-08-11-share-a-draft-with-one-rotatable-bearer-token-per-post.md](../decisions/2026-08-11-share-a-draft-with-one-rotatable-bearer-token-per-post.md).

The secret never reaches a signed-out caller: not through `/api/blog-posts`, and
not through any MCP tool but the two built to serve it. GraphQL is not a third
surface to close — `payload/config.ts` disables that API, so `/api/graphql`
answers `404` without building a schema and there is no query to ask. It
is minted on the server, so a write that tries to set it leaves the stored value
unchanged. It does reach one public place by design — the draft page's rendered
HTML, in the `og:image` URL — because an unfurl of the shared link has to hand
the secret back to render the draft's own card. Only a holder can render that
page.

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
