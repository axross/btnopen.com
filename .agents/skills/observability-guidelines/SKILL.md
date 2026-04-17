---
name: observability-guidelines
description: Guidelines for error handling and logging in this project. Covers Sentry error reporting, error propagation, Pino logger usage, log levels, and structured logging conventions.
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
