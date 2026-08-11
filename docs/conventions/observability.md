# Observability

The logger and its module emoji, the log levels, where Sentry is wired here, and
what the third-party services capture.

Two installed capabilities own most of the practice: the software-instrumentation
capability owns where `try`/`catch` belongs, how to choose a level, the
"Started / Completed" message shape, and what may not enter telemetry — naming
roles rather than SDKs — and the Sentry-instrumentation capability owns the
Sentry vendor layer beneath it, including SDK choice, `dataCollection`, sampling,
replay masking, and per-framework initialization. This document fills in the
roles and records the decisions this repository has made inside them.

| Role | This project | Vendor capability |
| --- | --- | --- |
| Structured logger | [Pino](https://getpino.io/), via `rootLogger` exported from `shared/logger.ts` | none installed — the conventions below are the whole of it |
| Error tracker | [Sentry](https://sentry.io/), via `@sentry/nextjs` | the Sentry-instrumentation capability |
| Analytics | [Mixpanel](https://mixpanel.com/) | none installed — see below |
| Commenter authentication | [Clerk](https://clerk.com/), brokering GitHub OAuth | none installed — consult Clerk's own current documentation |

## Logger Usage

Pino has no installed vendor capability, so these conventions are the complete
contract for logging here.

```typescript
import { rootLogger } from "@/shared/logger";

const logger = rootLogger.child({ module: "📥" });

logger.info({ slug, draft }, "Started fetching post.");
logger.info({ slug, duration: performance.now() - startedAt }, "Completed fetching post.");
```

The `module` emoji identifies a **category of work**, not an individual file.
That is what makes `module: 📥` a useful filter: it selects every Payload read at
once, which is the question a log search actually asks. Several modules sharing
one emoji is the scheme working, not a collision.

| Emoji | Category | Modules today |
| --- | --- | --- |
| `📥` | Payload reads through the repository layer | seven of the nine `app/(app)/_/repositories/get-*.ts` — all but `get-tweet.ts` and `get-webembed-metadata.ts`, which have their own rows below — plus `posts/[slug]/comments/_/repositories/get-commentable-blog-post.ts`, for eight in total |
| `🌏` | outbound web requests to a third party | `app/(app)/_/repositories/get-webembed-metadata.ts` |
| `𝕏` | tweet retrieval | `app/(app)/_/repositories/get-tweet.ts` |
| `🧹` | cache invalidation | the three `caches/route.ts` handlers under `posts/` |
| `💬` | the comment write path | `app/(app)/posts/[slug]/comments/route.ts` |
| `🔐` | draft authorization | `app/(app)/_/helpers/draft-access.ts` |
| `👁️` | Payload live preview | `app/(app)/posts/[slug]/_components/payload-live-preview/refresh.ts` |
| `🖼️` | media and image handling | `app/(app)/_/components/media.tsx` |
| `👽` | OG image generation | `app/(app)/posts/[slug]/thumbnail.png/route.tsx` |
| `🚢` | the Payload realm | `payload/helpers/logger.ts` |
| `🤖` | the Payload MCP server | `payload/helpers/mcp/logger.ts` |

A repository that fetches a third party takes that party's category rather than
`📥` — `get-tweet.ts` and `get-webembed-metadata.ts` are the worked examples.
`📥` means "read from our own CMS".

The base logger MUST be the `rootLogger` exported from `shared/logger.ts`,
imported as `@/shared/logger`; do not construct a `pino()` instance directly. A
child logger MUST be created per module, setting a `module` field with the emoji
of the category that module belongs to, from the table above. The emoji MUST stay
unique per **category**, so a filter on one emoji selects that whole category and
nothing else. Reuse an existing emoji when the module joins an existing category;
add a row to the table when it genuinely starts a new one. Every log message MUST
end with a period.

Context SHOULD be passed as Pino's first argument and the message as the second,
including identifiers (`slug`, `url`, `filename`) and, on completion lines for
latency-sensitive operations, a `duration`.

## Log Levels

Levels are the filter operators reach for under pressure, so a message at the
wrong level is either noise burying a signal or a signal buried in noise. This
project splits the two informational levels and routes errors somewhere else
entirely: `logger.info()` SHOULD be used for normal progress and `logger.warn()`
for recoverable unexpected conditions, while `logger.error()` MUST NOT be used at
all. An error goes to Sentry via `captureException()` and then propagates.

## Where Sentry Lives Here

The Sentry-instrumentation capability owns how Sentry is configured and what may
enter an event. What it defers to the project is which files hold that
configuration and which surfaces this application routes through them.

| Surface | File |
| --- | --- |
| Server and edge initialization | `sentry.server.config.ts`, `sentry.edge.config.ts`, imported from `instrumentation.ts` |
| Browser initialization | `instrumentation-client.ts` |
| Build-time wrapper | `withSentryConfig` in `next.config.ts` |
| Last-resort error boundary | `app/(app)/global-error.tsx` |

`app/(app)/global-error.tsx` MUST stay the last-resort boundary for the whole
application; route-level `error.tsx` files may follow the same pattern.
`captureException()` MUST NOT be called from a `not-found.tsx`; `notFound()` is
normal control flow here, and reporting it would bury real errors in noise.

Draft content, Payload session data, raw markdown, and private CMS fields MUST
NOT be attached to a Sentry event. `slug`, `url`, and `filename` are
intentionally public in this project and make issues actionable; the general
secret and PII boundary belongs to the Sentry-instrumentation capability's
data-collection rules.

An unexpected non-thrown state SHOULD be reported rather than ignored, using the
idiom `markdown.ts`'s `unknownHandler` established:
``captureException(new Error(`Handled unknown mdast node (type: ${node.type}).`))``.
An error message SHOULD identify the failing function or condition on its own,
since a Sentry issue is usually read with the stack trace minified or several
clicks away — `retrieveImageFromVercelBlob() was called but the Vercel Blob token
is null.` rather than `Token is missing.`

## Capture Settings Already in Force

Two services capture, on two different bases, and the split is the thing to hold
onto: **Sentry runs for every visitor**, and **Mixpanel runs only for a visitor
who has granted consent**. The privacy question for a new surface is therefore
"which of the two reaches it, and does that one need permission".

| Setting | Where | What it means |
| --- | --- | --- |
| `dataCollection`, diagnostics on and content off | `sentry.server.config.ts`, `sentry.edge.config.ts`, `instrumentation-client.ts` | Sentry captures IP address and user identity, request and response headers, URL query parameters, and stack-frame variables with five lines of surrounding source. It does **not** capture cookies, request or response bodies, database query values, generative-AI content, or GraphQL variables. All ten categories are set explicitly in all three files |
| The share-token redaction | `app/(app)/_/helpers/share-token-scrubbing.ts`, wired into `beforeSend` and `beforeSendTransaction` in all three files | A post's draft share token is replaced with `[Filtered]` in **every string the event carries** — at every depth, under every key, inside every array. The walk names no event field, so this row states how it works rather than what it covers: `request.url`, a `Referer` header, a console breadcrumb's `message`, `contexts.nextjs.request_path`, `contexts.trace.data`, `spans[].data`, `spans[].description`, `transaction`, an exception value, and a field a later SDK version adds are each reached because they are part of the event and not because they are on a list. It matches on the **value**, in the escaped forms as well as the literal one, and replaces whatever is bound to the name `token` as a record key or as the head of a `[name, value]` pair — which is what the object and pair-list forms of `request.query_string`, holding the bare secret, need. What it does not reach: `sdkProcessingMetadata`, lifted out because it holds live objects rather than JSON and `createEventEnvelope` deletes it before serializing; an attachment, which is not part of the event; a value behind a reference cycle or nested past 32 levels, both of which come back as `[Circular ~]` / `[Object]` rather than as the unvisited subtree; and a bare secret bound to no name it can recognize. `urlQueryParams` is not this control and cannot be: the SDK attaches the full URL unconditionally and reads that option only for the separate `query_string` field |
| Session Replay at `replaysSessionSampleRate: 0`, `replaysOnErrorSampleRate: 1.0` | Sentry client init | No ordinary session is recorded. A session that hits an error is, DOM mutations and form input included — unless the document has carried a share token, in which case `beforeErrorSampling` suppresses the upload |
| `tracesSampleRate: 1` | all three Sentry init points | Every transaction is traced. Each of the three carries the one-line rationale for the rate |
| `Mixpanel.init` with no capture options at all | `app/(app)/_/helpers/analytics.ts`, in `startAnalytics()` | Every SDK default applies: autocapture off, session recording off, heatmaps off, Do Not Track honoured. Page views and three link-click actions are sent explicitly, and are the whole of what Mixpanel receives |
| The consent gate | `app/(app)/_/helpers/analytics-consent.ts`, `app/(app)/_/components/analytics-consent-provider.tsx` | The decision is a cookie. Until it reads `granted`, `mixpanel-browser` is not imported, so the SDK is not downloaded and cannot send |
| The page-view allowlist | `app/(app)/_/helpers/reportable-search-params.ts` | Only `draft` and `agentic` reach a Mixpanel payload. Every other query parameter is dropped, including one the list has never heard of |

Mixpanel initialization MUST stay inside `startAnalytics()`, reached only from
the consent provider, and the `mixpanel-browser` import MUST stay dynamic. A
static import at module scope puts the SDK in the bundle of a visitor who
declined, which is the gate this design exists to hold. Mixpanel has no installed
vendor capability, so these rules are the whole of its contract here. A raw
email, IP, or payment identifier MUST NOT be passed to `Mixpanel.track(…)` — use
a hashed or opaque identifier. A query parameter MUST be added to
`reportableSearchParams` deliberately, or not at all. The list is closed by
construction so that a parameter carrying a secret is dropped by default rather
than by someone remembering to exclude it —
[#205](https://github.com/axross/btnopen.com/issues/205)'s per-post share token
is the case it was closed for.

`replaysOnErrorSampleRate` MUST NOT be lowered below `1.0`. The vendor capability
asks for error-linked capture at or near full rate; this project pins the floor
at exactly full, because error-time replay is the most diagnostic signal
available here and a sampled one is absent precisely when it is wanted. The
`beforeErrorSampling` hook beside it is the deliberate exception and is not a
sampling decision: it withholds the upload from a document that has carried a
post's share token, because a replay records the URL through a path no
`beforeSend` sees. Suppressing there rather than lowering the rate is what keeps
every other visitor's error replay intact.

That suppression MUST be re-checked before adding the Sentry **Feedback** widget.
`beforeErrorSampling` is consulted on the error-sampling path only. The installed
`@sentry/replay` flushes a buffered replay from two further places, and both are
Feedback's — the `beforeSendFeedback` and `openFeedbackWidget` client hooks —
neither of which consults the hook. No Feedback integration is installed today,
so the suppression is complete as things stand; adding one would reopen the
replay upload from a token-bearing page without touching a line of this
configuration, which is exactly the kind of silent reopening this note exists to
prevent.
A secret that travels in a URL MUST be redacted through `beforeSend` **and**
`beforeSendTransaction`, in all three initialization files, rather than through
`dataCollection.urlQueryParams`. That option is not an alternative:
`@sentry/core` 10.69 attaches the full request URL unconditionally — its own
source comment says so — and consults the option only for the separate
`query_string` field, while the allow and deny forms the option's type permits
are applied to query parameters in no installed package. A transaction carries
the URL just as an error does, so wiring only the first hook leaves the secret in
every trace. `share-token-scrubbing.ts` is the worked example; keep such a module
IO-free and total, because a throw inside one of these hooks loses the event and
takes the response being rendered with it.

Such a redaction MUST be written as a walk over the **whole event** — every
string, at every depth, under every key, in every array — and MUST NOT be written
as a set of fields believed to carry the URL. This rule was four times an
enumeration and four times short, and each round read like the last one's fix:
`request.headers`, then `contexts.trace.data` and `spans[].data`, then
`contexts.nextjs.request_path`, then `spans[].description`, which
`@sentry/browser-utils` sets to the full document URL on every navigation-timing
child span of every pageload. Each of those was found by a reviewer rather than
by the walk, because a list cannot report what is missing from it. Whole-event
coverage costs a few lines more than the shortest list that happens to be right
today; a list costs a secret in an issue nobody notices, and one
``captureException(new Error(`failed for ${request.url}`))`` is all it takes to
make yesterday's list wrong. `share-token-scrubbing.ts` is the worked example and
names no event field anywhere.

Such a walk MUST be bounded against a cycle and against depth, and MUST answer a
value it declines to visit with a marker rather than with the value itself.
Handing the unvisited subtree back is the one outcome a redaction cannot have —
it returns the branch that was never redacted straight into the event about to be
sent. `share-token-scrubbing.ts` answers with `@sentry/core`'s own `[Circular ~]`
and `[Object]`, so a reader of an issue meets one convention rather than two.
Such a redaction MUST match on a header's, an attribute's, or a breadcrumb
field's **value** rather than on its name. `Referer` is why: `Referrer-Policy:
strict-origin-when-cross-origin` sends the full URL on a same-origin request, so
every subresource a token-bearing page asks for reports that URL back, and a
name-keyed check is one header rename or one new span attribute away from
silently missing. The SDK's own `SENSITIVE_KEY_SNIPPETS` filter is no help
either: it matches attribute *names* against `auth`, `token`, `secret` and the
rest, and `http.target`, `url.full`, and `http.url` contain none of them. Match
on the name only where the value cannot be recognized at all — the object and
pair-list forms of `request.query_string` hold the bare secret with no `token=`
prefix to see — and apply that check wherever such a binding appears rather than
at the one field that needs it, so it does not become a small enumeration of its
own.

Over-redaction SHOULD be accepted as the cheap direction of this trade. A
value-matched walk rewrites any string that reads like the assignment, including
a source-context line that quotes one, and it rewrites the escaped forms —
`&amp;` from an HTML-escaped href, `%3F` / `%26` / `%3D` from a link nested as
another URL's query value — that a name-and-shape-matched one would pass through.
Losing a byte of diagnostic context is recoverable; a leaked bearer credential is
not.

A secret that travels in a URL MUST NOT be logged, and adding no log line on its
path at all is preferable to adding one that omits it. The share-token path
carries no logging for exactly that reason: no line to get wrong is a stronger
guarantee than a line that currently happens to be right.

`replaysSessionSampleRate` MUST NOT be raised above `0` without a stated privacy
basis. Recording sessions that never failed is the collection this project
removed deliberately — see
[../decisions/2026-08-10-collect-only-what-is-read-and-ask-before-collecting-it.md](../decisions/2026-08-10-collect-only-what-is-read-and-ask-before-collecting-it.md).

`/privacy` MUST be updated in the same change as any new collection. The page
describes what the code does, not what the site intends, so a new captured field
that does not reach it makes the page wrong rather than merely incomplete.

Every `dataCollection` category MUST stay set explicitly, in all three
initialization files at once. Omitting one does not leave it at a safe default:
once `dataCollection` is present the SDK falls back to its all-on defaults, so a
category dropped from the object is a category switched back on. A change to any
other Sentry row above MUST be treated as vendor-layer work, and the
Sentry-instrumentation capability — which owns replay masking, sampling, and the
data-collection posture — MUST be consulted; the file table above records only
which files hold this project's configuration.

## Clerk's Identity Posture

Clerk is the only one of the services that handles identity, so its posture is
about what crosses the boundary in each direction rather than what a sampling
rate captures. It is also the only one that is off unless configured:
`isClerkAvailable` derives from `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, and without
the key no provider mounts and no Clerk code initializes — which is how local
development, CI, and forked-pull-request previews run without credentials. Each
line below is verified against this repository's code rather than inferred from
the vendor's defaults.

| Question | Answer here |
| --- | --- |
| What Clerk holds | The reader's GitHub OAuth identity, in Clerk's own store. This repository never queries it beyond the submit-time read in the comment write path |
| What this repository stores | Four snapshot fields on the comment row — the Clerk user id, display name, GitHub username, and avatar URL. See [../specs/comments.md](../specs/comments.md) |
| Email addresses | None. The write path reads no email from Clerk, and the collection has no field for one |
| What is logged | The Clerk user id, on the Pino line the comment write path emits after a successful create |
| What reaches Sentry | No linked user — nothing calls `Sentry.setUser()`. Comment submission bodies are excluded by `httpBodies: []`, which the config comment names comment submissions as a reason for |
| What reaches Mixpanel | Nothing about a commenter. No linked user — nothing calls `Mixpanel.identify()` — and with autocapture off, commenter names, handles, and avatars are DOM that Mixpanel never reads |

A commenter email address MUST NOT be introduced into this repository — not into
the collection, a log line, or an analytics call. The subsystem reads none from
Clerk today, and that absence is what keeps the site's database free of a
commenter identifier it would have to protect and erase.

`Sentry.setUser()` and `Mixpanel.identify()` MUST NOT be called with a Clerk
identity. Neither service links a commenter today, and linking one would attach a
real person to every event and replay from that session, which no diagnostic need
here justifies.

The table above MUST be re-verified against the code when the comment write path
changes, rather than trusted; it records what the code does at a point in time,
and a new stored or logged field silently invalidates a row.

## Environment Divergence

Code gated to the local environment escapes every production test and review
scenario, so its divergence surfaces only after deployment. A code path that runs
only when `isLocalhost === true` (per `app/(app)/_/runtime.ts`) MUST therefore be
paired with an equivalent production path, or state why none is needed. A
localhost-only bypass that ships to production through a deployed branch is a
recurring class of bug here.
