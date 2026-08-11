---
status: accepted
---

# Share a draft with one rotatable bearer token per post

Showing an unpublished post to a reviewer meant giving them a CMS account. The
draft gate resolves from a Payload session and nothing else, so there was no
answer between "sign in to the admin" and "publish it and hope nobody reads it
yet". The reviewers this site actually has — a colleague reading a post before it
goes out — warrant neither.

**Every post now carries its own secret, and a request presenting it reads that
post's draft while signed out.** The secret is 256 bits of CSPRNG output rendered
base64url, minted on the server by a collection hook that is the only site in the
system where a token is created, and compared in constant time against the post's
latest version. It travels as a `token` query parameter on the post's own preview
URL, so the link is self-contained, depends on no cookie, and can be pasted
anywhere.

**It is a bearer credential, and that is the whole of its security model.**
Holding the link is the authorization; there is no identity behind it, nothing to
audit, and no way to tell two holders apart. That is proportionate for
pre-publication review of a personal blog and would not be for anything else, so
the boundaries are drawn tightly: a token opens one post and no other, and it
opens neither the draft list, nor the agentic view — whose `outline` and
`authoringNotes` carry editorial policy and progress notes not meant for an
outside reader — nor the live-preview refresh action, which would let an outside
holder repeatedly evict a post's cache.

**There is no expiry, so rotation is the only revocation.** A link stays valid
until someone replaces the secret, and replacing it invalidates every outstanding
link at once — cutting off one reviewer cuts off all of them. Because that makes
revocation an operational habit rather than a mechanism, rotation is built into
both surfaces an author already uses, the Payload admin and the MCP server, and
takes effect on the next request with no save step. It also cannot be undone:
the minting hook resolves the current secret from the post's latest version
rather than from the incoming write, so restoring an older version of a post
keeps the current secret rather than reinstating the one that version carried —
and a later bulk write, which Payload hands the collection row rather than the
latest version, cannot carry a revoked secret forward either.

**A URL-borne secret was accepted with its costs named rather than waved past.**
The secret reaches browser history, server and CDN access logs, and the draft
page's own rendered HTML, where the `og:image` URL carries it so an unfurl of the
shared link shows the draft's card. Three sinks were closed in the same change:
Sentry events have the parameter redacted out of every surface that carries a
URL — the request URL, the query string, each request header value, every string
a breadcrumb carries, and every span attribute, meaning `contexts.trace.data` and
each `spans[].data`; no error-linked replay is uploaded from a page that has
carried a token, because a replay records the URL through a path no `beforeSend`
sees; and every `?draft=true` render that resolves opts out of search indexing,
so a forwarded link cannot put unpublished content into an index. Mixpanel needed
no work — its page-view allowlist was already closed by construction.

The span and breadcrumb surfaces are named because they are the ones that do not
look like sinks. A transaction carries the request URL as a span attribute rather
than in its request object, so a redaction that reads only `request` leaves the
secret in every trace while appearing to cover the event; a console breadcrumb
carries it in `message`, which no list of URL-bearing key names reaches at all;
and the header pass exists because `Referrer-Policy:
strict-origin-when-cross-origin` sends the full URL back on every same-origin
subresource a draft page asks for. All three are matched on the value rather than
the name, so a renamed header, a newly added attribute, or a breadcrumb field
nobody listed does not silently reopen them.

The redaction is the one piece of this that is code rather than configuration,
and that is a liability worth naming: it runs inside `beforeSend`, where a throw
does not merely lose the event but tears down whatever response is being
rendered. It is kept IO-free and total, and its unit tests exist as much to pin
that as to pin the redaction.

Four alternatives were weighed and rejected.

**A separate share-link collection**, giving per-reviewer revocation and expiry,
was several times the scope of the problem. The accepted cost is the
all-or-nothing revocation above.

**A cookie exchange instead of a query parameter** — the token arrives once, is
swapped for a scoped `HttpOnly` cookie, and the URL is replaced — would keep the
secret out of every sink after the first navigation. It was reconsidered after an
audit recommended it and rejected on one fact: an unfurl crawler carries no
cookie, so the draft's own card image would stop working unless the `og:image`
URL kept the token, which reopens most of the exposure the exchange was meant to
close. The audit's principal argument, a wholesale query-string forward to
Mixpanel, had been closed independently by then.

**Sentry's `dataCollection.urlQueryParams` instead of a `beforeSend` hook** was
not available. The installed SDK attaches the full request URL unconditionally
and consults that option only for a separate `query_string` field; the allow and
deny forms its type permits are applied to query parameters nowhere.

**Minting the token in the admin component** would have needed no endpoint and no
hook signal, and the browser's Web Crypto is a perfectly good CSPRNG. It was
rejected because it puts a second minting site in the browser, makes the stored
value something a caller supplies, and leaves the field open to being written
with a weak value over REST or MCP.
