# Error Handling and Observability

Apply these rules to verify the change keeps the project's error-propagation model and structured-logging discipline intact. Defer the developer-facing rules to [observability-guidelines](../observability-guidelines/SKILL.md) — this file is the **reviewer's** flagging checklist.

## `try`/`catch` Placement

- MUST flag a Major when a new `try`/`catch` is placed inside a nested helper rather than at the root call site (route handler, RSC, `route.ts`, server action). The project rule per [observability-guidelines › error-handling](../observability-guidelines/error-handling.md) is "let errors propagate to the root call site".
- MUST flag a Critical when a `catch` block does any of:
  - Logs without rethrowing or calling `captureException()` (silent error swallow)
  - Returns a default value (e.g., `return null`, `return []`) without `captureException()` — the failure becomes invisible
  - `console.error(…)` instead of `captureException(…)` — `console.error` does not reach Sentry in production
- MUST flag a Major when a `catch` rethrows but loses the original `error` (e.g., `throw new Error("something went wrong")`). Use `throw new Error("…", { cause: error })` or just rethrow.

## `captureException` Discipline

- MUST flag a Critical when a new caught error is not reported to Sentry via `captureException()` from `@sentry/nextjs`. The only exception is when the error is a known control-flow signal (e.g., `notFound()`'s thrown sentinel).
- MUST flag a Major when `captureException()` is called **after** an early return / `notFound()` / `redirect()` rather than before. Sentry must receive the report before the function exits along the alternate path.
- MUST flag a Major when `captureException()` is imported from `@sentry/node`, `@sentry/browser`, or `@sentry/core` instead of `@sentry/nextjs`. The Next.js integration is what wires server / client / edge correctly.
- MUST flag a Major when an unexpected non-thrown state is silently ignored. The existing pattern in `markdown.ts` `unknownHandler` reports `new Error(\`Handled unknown mdast node (type: ${node.type}).\`)` — use this idiom for new "should-not-happen" branches.

## Logger Discipline

- MUST flag a Critical when the diff calls `logger.error(…)` — the project bans this in favor of `captureException()` per [observability-guidelines › logging](../observability-guidelines/logging.md).
- MUST flag a Critical when a new module creates a `pino()` instance directly instead of `rootLogger.child({ module: "<emoji>" })`.
- MUST flag a Major when the new module's child-logger emoji collides with an existing one. Currently in use: `📥` (data fetching), `🌏` (external HTTP), `🖼️` (image handling), `🥾` (instrumentation/bootstrap).
- MUST flag a Major when a new slow / external operation lacks the `Started …` / `Completed …` log pair with `duration` per the convention. The existing `getBlogPostMarkdown` records `duration: performance.now() - processStartedAt` — match this for new fetch / parse / IO operations.

## Log Hygiene

- MUST flag a Critical when a log line interpolates a secret (token, password, session ID, full request body). Cross-reference with [application-security-requirements › secret-handling](../application-security-requirements/secret-handling.md).
- MUST flag a Major when a log message lacks a trailing period — the project convention is "every log message ends with a period".
- MUST flag a Major when `logger.info(…)` is called for a high-frequency operation (e.g., per-render of a Server Component, per-iteration inside a tight loop). Move to `Started/Completed` at the boundary of the operation, not inside it.

## Error Boundaries

- MUST flag a Critical when the diff modifies `app/(app)/global-error.tsx` to remove the `useEffect(() => { captureException(error); }, [error])` hook — this is the last-resort Sentry sink.
- MUST flag a Major when a new `error.tsx` is added to a route segment without the same `captureException(error)` `useEffect` pattern.
- MUST flag a Major when a new `not-found.tsx` calls `captureException()` — `notFound()` is a normal control-flow path, not an error. Sentry noise from this would mask real errors.

## Sentry Replay and Trace Sampling

- MUST flag a Critical when the diff modifies `instrumentation-client.ts` to lower `replaysOnErrorSampleRate` below `1.0`. Error-time replay is the most diagnostic signal.
- SHOULD flag a Minor recommendation to lower `tracesSampleRate` (currently `1` everywhere) when a new high-traffic route is added — full sampling will hit Sentry quotas.

## Idempotency

- MUST flag a Critical when a new `route.ts` mutation handler is not idempotent (a retry produces a different result) and the caller (e.g., a Payload `afterOperation` hook) does not handle the partial-failure case. The existing `posts/caches/route.ts` `DELETE` is idempotent — match this design.
- SHOULD flag a Major when a new external `fetch` call inside a server function lacks a timeout (`signal: AbortSignal.timeout(<ms>)`). A hung dependency stalls the entire request.
