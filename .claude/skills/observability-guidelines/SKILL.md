---
name: observability-guidelines
description: The error-handling and logging conventions for this project — `try`/`catch` placement, Sentry `captureException` calls, route `error.tsx` / `global-error.tsx` boundaries, Pino `rootLogger` usage and module child loggers, log-level choice (`info` / `warn`; never `error`), and "Started / Completed" structured-log messages.
when_to_use: Use whenever writing, reviewing, or modifying code that throws, catches, reports, or logs, even when the user only mentions "Sentry", "Pino", "logger", "captureException", error boundaries, log levels, or debugging an unhandled exception.
user-invocable: false
---

# Observability Guidelines

Apply these rules when writing, reviewing, or modifying any code that handles errors or emits log output.

## Error Handling

See [error-handling.md](./references/error-handling.md) for:

- Where to place try-catch blocks and how errors propagate
- Rethrowing errors that are caught only for side effects
- When caught errors should be reported before alternate control flow
- Next.js error boundaries and route-level error handling

## Error Tracking

See [error-tracking.md](./references/error-tracking.md) for:

- Sentry initialization and runtime-specific configuration files
- `captureException()` import source, context, and privacy boundaries
- `sendDefaultPii` and safe event context
- Source map and instrumentation changes

## Logging

See [logging.md](./references/logging.md) for:

- When operations are worth logging and when they are not
- Which log level to use (`info` vs `warn`; never `error`)
- Creating module-scoped child loggers from `rootLogger`
- Structuring log calls with context objects and "Started / Completed" messages
