# Observability Conventions

Apply this reference when writing or reviewing code that logs, throws, catches, or reports an error. Two installed capabilities own most of this: the software instrumentation capability owns the practices — where `try`/`catch` belongs, how to choose a level, the "Started / Completed" message shape, what may not enter telemetry — naming roles rather than SDKs, and the Sentry instrumentation capability owns the Sentry vendor layer beneath it, including SDK choice, `dataCollection`, sampling, replay masking, and per-framework initialization. This reference fills in the roles and records the decisions this repository has made inside them.

| Role | This project | Vendor layer |
| --- | --- | --- |
| Structured logger | [Pino](https://getpino.io/), via `rootLogger` exported from `app/(app)/_/logger.ts` | none installed — the conventions below are the whole of it |
| Error tracker | [Sentry](https://sentry.io/), via `@sentry/nextjs` | the Sentry instrumentation capability |
| Analytics | [Mixpanel](https://mixpanel.com/) | none installed — see [third-party-services.md](./third-party-services.md) |

## Logger Usage

Pino has no installed vendor capability, so these conventions are the complete contract for logging here.

**Example:**

```typescript
import { rootLogger } from "@/logger";

const logger = rootLogger.child({ module: "📥" });

logger.info({ slug, draft }, "Started fetching post.");
logger.info({ slug, duration: performance.now() - startedAt }, "Completed fetching post.");
```

**Guidelines:**

- MUST use the `rootLogger` exported from `app/(app)/_/logger.ts` as the base logger; do not construct a `pino()` instance directly.
- MUST create a child logger per module, setting a `module` field with an emoji identifier — `📥` for data fetching, `🌏` for external web requests, `🖼️` for image handling. Keep the emoji unique per module so log lines filter by module without reading the full path.
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
