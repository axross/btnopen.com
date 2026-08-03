# Observability Conventions

Apply this reference when writing or reviewing code that logs, throws, catches, or reports an error. Two installed capabilities own most of this: the software instrumentation capability owns the practices — where `try`/`catch` belongs, how to choose a level, the "Started / Completed" message shape, what may not enter telemetry — naming roles rather than SDKs, and the Sentry instrumentation capability owns the Sentry vendor layer beneath it, including SDK choice, `dataCollection`, sampling, replay masking, and per-framework initialization. This reference fills in the roles and records the decisions this repository has made inside them.

| Role | This project | Vendor layer |
| --- | --- | --- |
| Structured logger | [Pino](https://getpino.io/), via `rootLogger` exported from `shared/logger.ts` | none installed — the conventions below are the whole of it |
| Error tracker | [Sentry](https://sentry.io/), via `@sentry/nextjs` | the Sentry instrumentation capability |
| Analytics | [Mixpanel](https://mixpanel.com/) | none installed — see [third-party-services.md](./third-party-services.md) |

## Logger Usage

Pino has no installed vendor capability, so these conventions are the complete contract for logging here.

**Example:**

```typescript
import { rootLogger } from "@/shared/logger";

const logger = rootLogger.child({ module: "📥" });

logger.info({ slug, draft }, "Started fetching post.");
logger.info({ slug, duration: performance.now() - startedAt }, "Completed fetching post.");
```

The `module` emoji identifies a **category of work**, not an individual file. That is what makes `module: 📥` a useful filter: it selects every Payload read at once, which is the question a log search actually asks. Several modules sharing one emoji is the scheme working, not a collision.

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

A repository that fetches a third party takes that party's category rather than `📥` — `get-tweet.ts` and `get-webembed-metadata.ts` are the worked examples. `📥` means "read from our own CMS".

**Guidelines:**

- MUST use the `rootLogger` exported from `shared/logger.ts` as the base logger, imported as `@/shared/logger`; do not construct a `pino()` instance directly.
- MUST create a child logger per module, setting a `module` field with the emoji of the category that module belongs to, from the table above.
- MUST keep the emoji unique per **category**, so a filter on one emoji selects that whole category and nothing else. Reuse an existing emoji when the module joins an existing category; add a row to the table when it genuinely starts a new one.
- MUST end every log message with a period.
- SHOULD pass context as Pino's first argument and the message as the second, including identifiers (`slug`, `url`, `filename`) and, on completion lines for latency-sensitive operations, a `duration`.

## Log Levels

Levels are the filter operators reach for under pressure, so a message at the wrong level is either noise burying a signal or a signal buried in noise. This project splits the two informational levels and routes errors somewhere else entirely.

**Guidelines:**

- SHOULD use `logger.info()` for normal progress and `logger.warn()` for recoverable unexpected conditions.
- MUST NOT use `logger.error()`. An error goes to Sentry via `captureException()` and then propagates.

## Where Sentry Lives Here

The Sentry instrumentation capability owns how Sentry is configured and what may enter an event. What it defers to the project is which files hold that configuration and which surfaces this application routes through them.

| Surface | File |
| --- | --- |
| Server and edge initialization | `sentry.server.config.ts`, `sentry.edge.config.ts`, imported from `instrumentation.ts` |
| Browser initialization | `instrumentation-client.ts` |
| Build-time wrapper | `withSentryConfig` in `next.config.ts` |
| Last-resort error boundary | `app/(app)/global-error.tsx` |

**Guidelines:**

- MUST keep `app/(app)/global-error.tsx` as the last-resort boundary for the whole application; route-level `error.tsx` files may follow the same pattern.
- MUST NOT call `captureException()` from a `not-found.tsx`; `notFound()` is normal control flow here, and reporting it would bury real errors in noise.
- MUST NOT attach draft content, Payload session data, raw markdown, or private CMS fields to a Sentry event. `slug`, `url`, and `filename` are intentionally public in this project and make issues actionable; the general secret and PII boundary belongs to the Sentry instrumentation capability's data-collection rules.
- SHOULD report an unexpected non-thrown state rather than ignoring it, using the idiom `markdown.ts`'s `unknownHandler` established: ``captureException(new Error(`Handled unknown mdast node (type: ${node.type}).`))``.
- SHOULD write an error message that identifies the failing function or condition on its own, since a Sentry issue is usually read with the stack trace minified or several clicks away — `retrieveImageFromVercelBlob() was called but the Vercel Blob token is null.` rather than `Token is missing.`

## Environment Divergence

Code gated to the local environment escapes every production test and review scenario, so its divergence surfaces only after deployment.

**Guidelines:**

- MUST pair a code path that runs only when `isLocalhost === true` (per `app/(app)/_/runtime.ts`) with an equivalent production path, or state why none is needed. A localhost-only bypass that ships to production through a deployed branch is a recurring class of bug here.
