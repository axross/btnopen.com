# Comments Subsystem

Apply this reference when touching reader comments — the Clerk sign-in that authenticates a commenter, the `comments` collection, the three route handlers under `posts/[slug]/comments/`, the CSRF helper guarding them, or the comment UI. Authentication and CSRF as disciplines belong to the application security capability, and Clerk's own API surface belongs to Clerk's current documentation; no installed capability covers Clerk. This reference records only how this repository wires the subsystem together.

The subsystem is the one place a member of the public writes to this site's database. Everything below follows from that: the write path is layered, what it stores is deliberately minimal, and nothing a reader submits appears publicly until the author approves it.

## File Inventory

Every file the subsystem owns, so it is locatable from one place. Each rule about these files lives in the section or reference named beside it.

| Surface | Files | Rules owned by |
| --- | --- | --- |
| Dependency | `@clerk/nextjs` (`package.json`) | [tech-stack.md](./tech-stack.md) |
| Environment | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` (`.env.example`) | [security-conventions.md](./security-conventions.md) |
| Availability gate | `clerkPublishableKey`, `isClerkAvailable` (`app/(app)/_/runtime.ts`) | this file, below |
| Auth wiring | `proxy.ts`, `AuthProvider` in `app/(app)/layout.tsx` | this file, below |
| Collection | `payload/collections/comment.ts` | [payload-conventions.md](./payload-conventions.md) |
| Route handlers | `app/(app)/posts/[slug]/comments/route.ts`, `comments/token/route.ts`, `comments/caches/route.ts` | [routing-conventions.md](./routing-conventions.md) |
| Helpers | `app/(app)/_/helpers/comment-csrf.ts`, `app/(app)/_/helpers/request-origin.ts` | [security-conventions.md](./security-conventions.md) |
| Realm-neutral logic | `shared/comments.ts` | [architecture-boundaries.md](./architecture-boundaries.md) |
| Repository | `app/(app)/_/repositories/get-blog-post-comments.ts` | [architecture-boundaries.md](./architecture-boundaries.md) |
| Components | `app/(app)/posts/[slug]/_components/comments/` — `comments.tsx`, `comment-composer.tsx`, `comment-avatar.tsx`, `leave-a-review.tsx` | [component-conventions.md](./component-conventions.md) |
| Avatar hosts | `img.clerk.com`, `avatars.githubusercontent.com` (`next.config.ts`) | [security-conventions.md](./security-conventions.md) |
| Tests | `app/(app)/_/helpers/comment-csrf.spec.ts`, `shared/comments.spec.ts`, `e2e/tests/routes/posts/comments.test.ts`, `e2e/helpers/api/comment.ts` | [testing-conventions.md](./testing-conventions.md) |

**Guidelines:**

- MUST place a new comment-related module by the same tier rules as any other module, per [placement-and-naming.md](./placement-and-naming.md); the subsystem spans four tiers and is not a directory of its own.
- MUST keep logic both realms need in `shared/comments.ts` — the collection's reply-depth validation imports it, so moving it into `app/` would make the Payload realm import `app/`.

## The Availability Gate

Clerk is optional at runtime. `clerkPublishableKey` is read from the environment barrel and `isClerkAvailable` derives from it, so local development without Clerk credentials, CI, and forked-pull-request previews all build and run green. Every Clerk touchpoint is behind that flag, and each one degrades rather than failing.

| When `isClerkAvailable` is false | What happens |
| --- | --- |
| `proxy.ts` | `clerkMiddleware()` is skipped entirely; the proxy passes the request through |
| `app/(app)/layout.tsx` | `AuthProvider` renders its children unwrapped — no `ClerkProvider` mounts |
| `comments.tsx` | The composer is not rendered; existing approved comments still render read-only |
| `comments.tsx`, with no visible comments | The whole section returns `null`, so an unconfigured deployment shows no dead comment UI |
| `posts/[slug]/comments/route.ts` | The write path answers `503` before reaching Clerk |

**Guidelines:**

- MUST gate any new Clerk touchpoint on `isClerkAvailable` and give it a working unconfigured path; a surface that throws or renders broken without Clerk credentials breaks local development, CI, and forked-pull-request previews at once.
- MUST NOT import a Clerk hook into a component that renders when Clerk is unavailable. `CommentComposer` may call `useUser()` only because `comments.tsx` mounts it behind the flag, so the provider is guaranteed present.
- MUST keep the composer out of a draft or preview view as well as an unconfigured one. The write path accepts published posts only, so a composer there could never succeed.

## The Write Path

`POST /posts/[slug]/comments` is the only public write path in the application, and it applies five checks in a fixed order before it writes. The order matters: the cheap header checks reject a forged request before it costs a Clerk round-trip or a database read.

1. **Same-site** — `isSameSiteRequest(request)` from `request-origin.ts`, else `403`.
2. **Double-submit CSRF token** — `hasMatchingCommentCsrfToken(request)` from `comment-csrf.ts`, else `403`.
3. **Clerk availability, then identity** — `503` when unconfigured, `401` when `auth()` yields no `userId`.
4. **Body shape** — `CommentSubmission.safeParse(...)` from `shared/comments.ts`, else `400`.
5. **Target post** — published and not `isCommentsEnabled: false`, else `404`.

Only then does it create through the Payload local API with `status: "pending"`, snapshotting the reader's identity onto the row.

**Guidelines:**

- MUST keep both CSRF layers on the write path. The same-site check is the primary guard and the double-submit token is defense in depth; either alone is a narrower guarantee than the pair, and the token endpoint exists solely to serve the second.
- MUST NOT let the public write path set `parent` or `authorReply`. Those are author-only, set in the Payload admin, and a reader able to set either could forge a reply or an author-badged comment.
- MUST create through the Payload local API rather than the public REST endpoint. The collection's `create` access is locked to authenticated admins precisely so `/api/comments` rejects unauthenticated rows; the local API bypasses that by design.
- MUST keep a new reader-writable field out of the create call unless it is validated by `CommentSubmission`; the schema is what bounds what a reader can put in the database.

## Moderation Model

A reader-created comment is invisible until the author approves it in the admin, and moderation is expressed through `status` rather than deletion — a rejected comment is hidden but kept. Replies are author-only and at most one level deep, enforced by the `parent` field's own `validate` through `isReplyToReply`.

The collection carries no soft-delete on purpose. Deleting a post hard-deletes its comments through the blog-post `beforeDelete` hook, so a lingering trashed row can never block that deletion against the required `blogPost` foreign key.

**Guidelines:**

- MUST keep a new comment row defaulting to `status: "pending"`; a default of `approved` publishes unmoderated public writes.
- MUST NOT add a soft-delete or trash mechanism to the collection without resolving the cascading-delete constraint above first.
- MUST render a hidden top-level comment as a tombstone rather than dropping the thread, when it still anchors an approved author reply — `getBlogPostComments` returns `comment: null` with the replies intact for exactly this case.

## Read Path and Cache Invalidation

`getBlogPostComments` reads through the repository layer like every other read here, on `cacheLife("hours")` and tagged `blog-post-comments:<slug>`. Because a comment becomes visible through an admin edit rather than a deploy, the cache-busting pair is what makes approval appear at all: the collection's `afterChange` and `afterDelete` hooks `fetch` the `comments/caches` handler, which revalidates that tag.

Two narrowings in that pair are deliberate and easy to undo by accident. `afterChange` returns early unless the write moves a comment into or out of `approved`, so a fresh pending comment skips the round-trip it would not change anything with. And `bustCommentCache` returns early on `req.context.skipCommentCacheBust`, so a cascading post delete does not fan out one identical cache-bust per comment.

**Guidelines:**

- MUST keep the repository's returned view type free of moderation fields. `BlogPostComment` deliberately omits `status`, `parent`, and `authorProviderId`; adding one leaks internal state into the public render.
- MUST bust `blog-post-comments:<slug>` from any new write path that can change what renders publicly, per the invalidation pairing rule in [payload-conventions.md](./payload-conventions.md).
- MUST NOT let a cache-bust failure fail the content write; `bustCommentCache` reports to Sentry and returns, because a missed revalidation is recoverable and a failed admin save is not.

## Stored Reader Identity

The row snapshots the reader's identity at submit time rather than resolving it from Clerk on every render, so a comment survives the commenter deleting their Clerk account and the render path needs no Clerk call. Four fields carry it, and no email address is among them.

| Field | Source | Notes |
| --- | --- | --- |
| `authorProviderId` | Clerk `userId` | The identity-provider user id. Empty on author replies. Never rendered |
| `authorName` | Clerk `fullName`, falling back to the GitHub username, then `firstName`, then the literal `"GitHub user"` | Rendered publicly |
| `authorGithubUsername` | The `oauth_github` external account's username | Rendered publicly, linked to `github.com/<username>` |
| `authorAvatarUrl` | Clerk `imageUrl` | Rendered through `next/image`, so `images.remotePatterns` gates the host |

What this posture means for capture and privacy — what Clerk holds, what is logged, and what is never forwarded to Sentry or Mixpanel — is recorded in [third-party-services.md](./third-party-services.md).

**Guidelines:**

- MUST NOT add an email address to the collection or to the create call. The subsystem deliberately reads none from Clerk, so the database holds no commenter email to leak or to have to erase.
- MUST NOT render `authorProviderId`. It is stored to attribute a row to an account, not to display, and it is the one stored field that is not already public.
- MUST re-check `images.remotePatterns` when a new identity provider is added; an avatar URL from an unlisted host renders as a broken image rather than failing loudly at build time.
