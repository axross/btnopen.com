# Comments

Reader comments on a blog post. This is the one place a member of the public
writes to the site's database, and everything here follows from that: the write
path is layered, what is stored is deliberately minimal, and nothing a reader
submits appears publicly until the author approves it.

How the subsystem is wired is spread across
[../conventions/payload.md](../conventions/payload.md),
[../conventions/security.md](../conventions/security.md), and
[../conventions/observability.md](../conventions/observability.md).

## Availability

Comments depend on Clerk, which brokers GitHub OAuth, and Clerk is **optional at
runtime**. Without its publishable key nothing Clerk-related initializes — which
is how local development, CI, and forked-pull-request previews run without
credentials.

Every touchpoint degrades rather than failing:

| When Clerk is unconfigured | What a reader sees |
| --- | --- |
| Authentication middleware | Skipped; the request passes through |
| The page's auth provider | Renders its children unwrapped |
| A post with approved comments | The comments render read-only, with no composer |
| A post with no visible comments | The whole section is absent — no dead comment UI |
| The write endpoint | Answers `503` |

The composer is also absent from a draft or preview view, because the write path
accepts published posts only and a composer there could never succeed.

## Signing In and Commenting

A reader signs in with GitHub through Clerk, then writes a comment on a published
post whose comments are enabled.

The write applies five checks, in a fixed order, before anything is stored — the
cheap header checks reject a forged request before it costs a Clerk round-trip or
a database read:

1. **Same-site** — the request must come from this site, else `403`.
2. **Double-submit CSRF token** — a token minted by a companion endpoint, held in
   an `HttpOnly`, `SameSite=Strict` cookie and echoed in a header, compared in
   constant time, else `403`.
3. **Identity** — `503` when Clerk is unconfigured, `401` when the reader is not
   signed in.
4. **Body shape** — the submission is validated against a schema, else `400`.
5. **Target post** — it must be published and have comments enabled, else `404`.

Both CSRF layers are kept: the same-site check is the primary guard and the
double-submit token is defence in depth. Either alone is a narrower guarantee than
the pair.

## Moderation

A reader-created comment is stored as **pending** and is invisible until the
author approves it in the admin. Moderation is expressed through status rather
than deletion — a rejected comment is hidden but kept.

Replies are **author-only and at most one level deep**. A reader cannot reply to
anything, and a reply to a reply is refused. Neither the reply relationship nor
the author-reply flag can be set through the public write path, so a reader can
neither forge a reply nor post a comment badged as the author's.

A hidden top-level comment that still anchors an approved author reply renders as
a **tombstone** rather than dropping the thread, so the reply keeps its context.

Comments carry no soft-delete. Deleting a post hard-deletes its comments, and a
lingering trashed row would block that deletion against the required reference a
comment holds to its post.

## What Is Stored About a Commenter

The comment row **snapshots** the reader's identity at submit time rather than
resolving it from Clerk on every render, so a comment survives the commenter
deleting their Clerk account and rendering needs no call to Clerk.

| Stored | Source | Rendered? |
| --- | --- | --- |
| Identity-provider user id | Clerk's user id | Never |
| Display name | Clerk's full name, falling back to the GitHub username, then the first name, then the literal `GitHub user` | Yes |
| GitHub username | The GitHub OAuth account's username | Yes, linked to the profile |
| Avatar URL | Clerk's image URL | Yes |

**No email address is stored, logged, or read.** The write path reads none from
Clerk and the collection has no field for one, which is what keeps the site's
database free of a commenter identifier it would otherwise have to protect and
erase. Neither the error tracker nor the analytics tool is given a commenter
identity; commenter names, handles, and avatars do reach analytics autocapture,
but they are public content by construction.

Reader-submitted links in comments carry `nofollow ugc`, unlike links in a post
body.

## Visibility After Approval

A comment becomes visible through an admin edit rather than a deploy, so approval
appears only because the write clears the cached comment thread for that post.
Two narrowings in that pairing are deliberate: a write that does not move a
comment into or out of approved skips the round trip, and a cascading post
deletion busts once rather than once per comment.

The publicly rendered view deliberately omits every moderation field — status, the
reply relationship, and the identity-provider id are not part of what a reader
receives.
