---
name: error-handling-guidelines
description: Guidelines for error handling in this project.
user-invocable: false
---

# Error Handling Guidelines

Apply these rules when you are writing, reviewing, or modifying code that might throw an error.

- MUST use `try-catch` blocks at the root call sites.
- MUST let the error propagate to the root call site when it was caught in a nested call site.
- MUST rethrow the caught error when it was caught just for logging so that the error can be caught at the root call site.
- MUST call `captureException()` from `@sentry/nextjs` to send the error to Sentry.
