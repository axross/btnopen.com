---
name: observability-guidelines
description: Use this skill whenever writing, reviewing, or modifying code that throws, catches, reports, or logs — including `try`/`catch` placement, Sentry `captureException` calls, route `error.tsx` / `global-error.tsx` boundaries, Pino `rootLogger` usage and module child loggers, log-level choice (`info` / `warn`; never `error`), and "Started / Completed" structured-log messages. Use even when the user only mentions "Sentry", "Pino", "logger", "captureException", error boundaries, log levels, or debugging an unhandled exception in this project.
user-invocable: false
---

# Observability Guidelines

Apply these rules when writing, reviewing, or modifying any code that handles errors or emits log output.

## Error Handling

See [Error Handling](./error-handling.md) for:

- Where to place try-catch blocks and how errors propagate
- Rethrowing errors that are caught only for side effects
- Reporting errors to Sentry with `captureException()`
- Next.js error boundaries and route-level error handling

## Logging

See [Logging](./logging.md) for:

- When operations are worth logging and when they are not
- Which log level to use (`info` vs `warn`; never `error`)
- Creating module-scoped child loggers from `rootLogger`
- Structuring log calls with context objects and "Started / Completed" messages
