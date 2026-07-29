# Observability Conventions

Apply this reference when writing or reviewing code that logs, throws, catches, or reports an error. The practices themselves — where `try`/`catch` belongs, how to choose a level, the "Started / Completed" message shape, what may not enter telemetry — belong to the software instrumentation capability, which names roles rather than SDKs. This reference fills in the roles for this repository.

| Role | This project |
| --- | --- |
| Structured logger | [Pino](https://getpino.io/), via `rootLogger` exported from `app/(app)/_/logger.ts` |
| Error tracker | [Sentry](https://sentry.io/), via `@sentry/nextjs` |
| Analytics | [Mixpanel](https://mixpanel.com/) |

## Logger Usage

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
- MUST NOT use `logger.error()`. An error goes to Sentry via `captureException()` and then propagates; see [Error Reporting](#error-reporting).

## Error Reporting

An unhandled failure ends its journey at the top-level boundary, so that boundary's report is the last guarantee nothing fails invisibly — and everything below it depends on capture going through one SDK entry point with a bounded payload.

**Guidelines:**

- MUST import Sentry helpers from `@sentry/nextjs`, never `@sentry/node` or another Sentry package.
- MUST keep `app/(app)/global-error.tsx` as the last-resort boundary for the whole application, calling `captureException(error)` inside a `useEffect` so unexpected React render errors are reported. Route-level `error.tsx` files may follow the same pattern.
- MUST keep Sentry initialization in `instrumentation.ts`, `instrumentation-client.ts`, `sentry.server.config.ts`, and `sentry.edge.config.ts` rather than scattering it across feature modules, and refresh the vendor documentation before changing any of them or the source-map setup.
- MUST NOT attach secrets, raw request bodies, raw markdown, access tokens, draft content, Payload session data, or private CMS fields to Sentry context. Prefer route names, public slugs, operation names, and booleans; `slug`, `url`, and `filename` are intentionally public and make issues actionable.
- SHOULD write an error message that identifies the failing function or condition on its own, since a Sentry issue is usually read with the stack trace minified or several clicks away — `retrieveImageFromVercelBlob() was called but the Vercel Blob token is null.` rather than `Token is missing.`

## Capture Settings Already in Force

The privacy consequences of a new surface depend on what the existing configuration already captures; [third-party-services.md](./third-party-services.md) records the current settings and what they imply for a new form or component.

## Environment Divergence

Code gated to the local environment escapes every production test and review scenario, so its divergence surfaces only after deployment.

**Guidelines:**

- MUST pair a code path that runs only when `isLocalhost === true` (per `app/(app)/_/runtime.ts`) with an equivalent production path, or state why none is needed. A localhost-only bypass that ships to production through a deployed branch is a recurring class of bug here.
