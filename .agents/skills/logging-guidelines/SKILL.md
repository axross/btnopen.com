---
name: logging-guidelines
description: Guidelines for logging in this project.
user-invocable: false
---

# Logging Guidelines

Apply these rules when you are writing, reviewing, or modifying code.

## When to Log

- SHOULD log a series of operations that takes some time to complete.
- SHOULD log operations that might fail.
- SHOULD NOT log operations that are not important.

## Logging Levels

- SHOULD use `logger.info()` for informational messages.
- SHOULD use `logger.warn()` for warning messages.
- MUST NOT use `logger.error()` for error messages.
  - Instead, refer to [Error Handling Guidelines](./error-handling-guidelines.md) to handle errors.

## Logger Usage

- SHOULD extend the `rootLogger` from `@/helpers/logger` and use it for logging.
- SHOULD set the appropriate scope identifier at the `module` field when extending the `rootLogger` (e.g. `rootLogger.child({ module: "🪝" })`).

## Logging Conventions

- SHOULD log at the beginning and end of a series of operations.
- SHOULD log with the message starting with "Started" for the beginning of a series of operations.
  - For example, `logger.info("Started fetching blog posts")`.
- SHOULD log with the message starting with "Completed" for the end of a series of operations.
  - For example, `logger.info("Completed fetching blog posts")`.
