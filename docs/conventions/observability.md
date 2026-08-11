# Observability

Read this when writing or reviewing code that logs, throws, catches, or reports
an error, and when a change touches what the third-party services capture. Two
installed capabilities own most of the practice: the software-instrumentation
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

**Rules:**

- MUST use the `rootLogger` exported from `shared/logger.ts` as the base logger,
  imported as `@/shared/logger`; do not construct a `pino()` instance directly.
- MUST create a child logger per module, setting a `module` field with the emoji
  of the category that module belongs to, from the table above.
- MUST keep the emoji unique per **category**, so a filter on one emoji selects
  that whole category and nothing else. Reuse an existing emoji when the module
  joins an existing category; add a row to the table when it genuinely starts a
  new one.
- MUST end every log message with a period.
- SHOULD pass context as Pino's first argument and the message as the second,
  including identifiers (`slug`, `url`, `filename`) and, on completion lines for
  latency-sensitive operations, a `duration`.

## Log Levels

Levels are the filter operators reach for under pressure, so a message at the
wrong level is either noise burying a signal or a signal buried in noise. This
project splits the two informational levels and routes errors somewhere else
entirely.

**Rules:**

- SHOULD use `logger.info()` for normal progress and `logger.warn()` for
  recoverable unexpected conditions.
- MUST NOT use `logger.error()`. An error goes to Sentry via `captureException()`
  and then propagates.

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

**Rules:**

- MUST keep `app/(app)/global-error.tsx` as the last-resort boundary for the
  whole application; route-level `error.tsx` files may follow the same pattern.
- MUST NOT call `captureException()` from a `not-found.tsx`; `notFound()` is
  normal control flow here, and reporting it would bury real errors in noise.
- MUST NOT attach draft content, Payload session data, raw markdown, or private
  CMS fields to a Sentry event. `slug`, `url`, and `filename` are intentionally
  public in this project and make issues actionable; the general secret and PII
  boundary belongs to the Sentry-instrumentation capability's data-collection
  rules.
- SHOULD report an unexpected non-thrown state rather than ignoring it, using the
  idiom `markdown.ts`'s `unknownHandler` established:
  ``captureException(new Error(`Handled unknown mdast node (type: ${node.type}).`))``.
- SHOULD write an error message that identifies the failing function or condition
  on its own, since a Sentry issue is usually read with the stack trace minified
  or several clicks away — `retrieveImageFromVercelBlob() was called but the
  Vercel Blob token is null.` rather than `Token is missing.`

## Capture Settings Already in Force

Two services capture, on two different bases, and the split is the thing to hold
onto: **Sentry runs for every visitor**, and **Mixpanel runs only for a visitor
who has granted consent**. The privacy question for a new surface is therefore
"which of the two reaches it, and does that one need permission".

| Setting | Where | What it means |
| --- | --- | --- |
| `dataCollection`, diagnostics on and content off | `sentry.server.config.ts`, `sentry.edge.config.ts`, `instrumentation-client.ts` | Sentry captures IP address and user identity, request and response headers, URL query parameters, and stack-frame variables with five lines of surrounding source. It does **not** capture cookies, request or response bodies, database query values, generative-AI content, or GraphQL variables. All ten categories are set explicitly in all three files |
| The share-token redaction | `app/(app)/_/helpers/share-token-scrubbing.ts`, wired into `beforeSend` and `beforeSendTransaction` in all three files | A post's draft share token is replaced with `[Filtered]` in every event field that can hold a string. Those are: `request.url`, `request.query_string`, and each `request.headers` value (`Referer` carries the token back on every same-origin subresource); each breadcrumb's `message` as well as its `data`, because the console integration puts the logged line in the former; each context's own string values — `contexts.nextjs.request_path`, which `captureRequestError` sets flat — **and** those under a nested `data` record, which is where `contexts.trace` holds the root span's attributes; each `spans[].data`; and `exception.values[]`, `message`, `logentry`, `extra`, and `tags`. What it does not reach: `user`, `sdkProcessingMetadata`, an attachment, a stack frame's `filename`, and anything nested more than one array level deep — none of which carries a request URL, and the last of which is bounded deliberately so a self-referencing logged value cannot exhaust the stack. `urlQueryParams` is not this control and cannot be: the SDK attaches the full URL unconditionally and reads that option only for the separate `query_string` field |
| Session Replay at `replaysSessionSampleRate: 0`, `replaysOnErrorSampleRate: 1.0` | Sentry client init | No ordinary session is recorded. A session that hits an error is, DOM mutations and form input included — unless the document has carried a share token, in which case `beforeErrorSampling` suppresses the upload |
| `tracesSampleRate: 1` | all three Sentry init points | Every transaction is traced. Each of the three carries the one-line rationale for the rate |
| `Mixpanel.init` with no capture options at all | `app/(app)/_/helpers/analytics.ts`, in `startAnalytics()` | Every SDK default applies: autocapture off, session recording off, heatmaps off, Do Not Track honoured. Page views and three link-click actions are sent explicitly, and are the whole of what Mixpanel receives |
| The consent gate | `app/(app)/_/helpers/analytics-consent.ts`, `app/(app)/_/components/analytics-consent-provider.tsx` | The decision is a cookie. Until it reads `granted`, `mixpanel-browser` is not imported, so the SDK is not downloaded and cannot send |
| The page-view allowlist | `app/(app)/_/helpers/reportable-search-params.ts` | Only `draft` and `agentic` reach a Mixpanel payload. Every other query parameter is dropped, including one the list has never heard of |

**Rules:**

- MUST keep Mixpanel initialization inside `startAnalytics()`, reached only from
  the consent provider, and MUST keep the `mixpanel-browser` import dynamic. A
  static import at module scope puts the SDK in the bundle of a visitor who
  declined, which is the gate this design exists to hold. Mixpanel has no
  installed vendor capability, so these rules are the whole of its contract here.
- MUST NOT pass a raw email, IP, or payment identifier to `Mixpanel.track(…)` —
  use a hashed or opaque identifier.
- MUST add a query parameter to `reportableSearchParams` deliberately, or not at
  all. The list is closed by construction so that a parameter carrying a secret
  is dropped by default rather than by someone remembering to exclude it —
  [#205](https://github.com/axross/btnopen.com/issues/205)'s per-post share token
  is the case it was closed for.
- MUST NOT lower `replaysOnErrorSampleRate` below `1.0`. The vendor capability
  asks for error-linked capture at or near full rate; this project pins the floor
  at exactly full, because error-time replay is the most diagnostic signal
  available here and a sampled one is absent precisely when it is wanted. The
  `beforeErrorSampling` hook beside it is the deliberate exception and is not a
  sampling decision: it withholds the upload from a document that has carried a
  post's share token, because a replay records the URL through a path no
  `beforeSend` sees. Suppressing there rather than lowering the rate is what
  keeps every other visitor's error replay intact.
- MUST re-check that suppression before adding the Sentry **Feedback** widget.
  `beforeErrorSampling` is consulted on the error-sampling path only. The
  installed `@sentry/replay` flushes a buffered replay from two further places,
  and both are Feedback's — the `beforeSendFeedback` and `openFeedbackWidget`
  client hooks — neither of which consults the hook. No Feedback integration is
  installed today, so the suppression is complete as things stand; adding one
  would reopen the replay upload from a token-bearing page without touching a
  line of this configuration, which is exactly the kind of silent reopening this
  note exists to prevent.
- MUST redact a secret that travels in a URL through `beforeSend` **and**
  `beforeSendTransaction`, in all three initialization files, rather than
  through `dataCollection.urlQueryParams`. That option is not an alternative:
  `@sentry/core` 10.69 attaches the full request URL unconditionally — its own
  source comment says so — and consults the option only for the separate
  `query_string` field, while the allow and deny forms the option's type permits
  are applied to query parameters in no installed package. A transaction carries
  the URL just as an error does, so wiring only the first hook leaves the secret
  in every trace. `share-token-scrubbing.ts` is the worked example; keep such a
  module IO-free and total, because a throw inside one of these hooks loses the
  event and takes the response being rendered with it.
- MUST make such a redaction reach `contexts` and every `spans[].data`, not
  `request` alone, and MUST walk a context's **own** string values as well as
  any nested `data` record. Wiring `beforeSendTransaction` is necessary and not
  sufficient: a transaction carries the URL as a **span attribute**, which the
  request object does not hold. Next's root server span sets `http.target` to
  `req.url` with its query string, the OpenTelemetry-to-Sentry exporter copies
  every attribute verbatim into both places, and browser tracing sets `url.full`
  on the pageload span. The SDK's own `SENSITIVE_KEY_SNIPPETS` filter does not
  save this: it matches attribute *names* against `auth`, `token`, `secret`, and
  the rest, and `http.target`, `url.full`, and `http.url` contain none of them.
  Reaching only a nested `data` is what this rule was first written as, and it
  was wrong: `captureRequestError`, which `instrumentation.ts` exports as Next's
  `onRequestError` hook, sets a **flat** `contexts.nextjs.request_path` from
  `req.url` — query string included — with no `data` record anywhere in the
  context, so a `data`-only walk shipped the raw secret while `request.url`
  beside it read `[Filtered]`.
- SHOULD prefer covering an event's whole string surface over enumerating the
  fields believed to carry a URL. `share-token-scrubbing.ts` walks
  `exception.values[]`, `message`, `logentry`, `extra`, and `tags` although
  nothing writes a request URL into any of them today, because the cost of the
  extra walk is a few lines and the cost of a short enumeration is a secret in
  an issue nobody notices — one
  ``captureException(new Error(`failed for ${request.url}`))`` is all it takes.
- MUST match such a redaction on a header's, an attribute's, or a breadcrumb
  field's **value** rather than on its name. `Referer` is why: `Referrer-Policy:
  strict-origin-when-cross-origin` sends the full URL on a same-origin request,
  so every subresource a token-bearing page asks for reports that URL back, and
  a name-keyed check is one header rename or one new span attribute away from
  silently missing. A breadcrumb is where that bites hardest, because the field
  a console crumb carries the URL in is `message` rather than anything under
  `data`, and `data.arguments` is an array rather than a string — so the walk
  covers a breadcrumb's message and the strings inside an array value, and stops
  one level down rather than recursing into a logged value that may reference
  itself.
- MUST NOT log a secret that travels in a URL, and prefer adding no log line on
  its path at all over adding one that omits it. The share-token path carries no
  logging for exactly that reason: no line to get wrong is a stronger guarantee
  than a line that currently happens to be right.
- MUST NOT raise `replaysSessionSampleRate` above `0` without a stated privacy
  basis. Recording sessions that never failed is the collection this project
  removed deliberately — see
  [../decisions/2026-08-10-collect-only-what-is-read-and-ask-before-collecting-it.md](../decisions/2026-08-10-collect-only-what-is-read-and-ask-before-collecting-it.md).
- MUST update `/privacy` in the same change as any new collection. The page
  describes what the code does, not what the site intends, so a new captured
  field that does not reach it makes the page wrong rather than merely
  incomplete.
- MUST keep every `dataCollection` category set explicitly, in all three
  initialization files at once. Omitting one does not leave it at a safe default:
  once `dataCollection` is present the SDK falls back to its all-on defaults, so a
  category dropped from the object is a category switched back on.
- MUST treat a change to any other Sentry row above as vendor-layer work and
  consult the Sentry-instrumentation capability, which owns replay masking,
  sampling, and the data-collection posture; the file table above records only
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

**Rules:**

- MUST NOT introduce a commenter email address into this repository — not into
  the collection, a log line, or an analytics call. The subsystem reads none from
  Clerk today, and that absence is what keeps the site's database free of a
  commenter identifier it would have to protect and erase.
- MUST NOT call `Sentry.setUser()` or `Mixpanel.identify()` with a Clerk
  identity. Neither service links a commenter today, and linking one would attach
  a real person to every event and replay from that session, which no diagnostic
  need here justifies.
- MUST re-verify this table against the code when changing the comment write
  path, rather than trusting it; it records what the code does at a point in time,
  and a new stored or logged field silently invalidates a row.

## Environment Divergence

Code gated to the local environment escapes every production test and review
scenario, so its divergence surfaces only after deployment.

**Rules:**

- MUST pair a code path that runs only when `isLocalhost === true` (per
  `app/(app)/_/runtime.ts`) with an equivalent production path, or state why none
  is needed. A localhost-only bypass that ships to production through a deployed
  branch is a recurring class of bug here.
