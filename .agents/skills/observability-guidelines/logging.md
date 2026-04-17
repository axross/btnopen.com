# Logging

Apply these rules when writing, reviewing, or modifying any code that emits log output.

## When to Log

- SHOULD log the start and end of any operation that is slow, depends on an external system, or could fail (e.g., database queries, HTTP fetches, image processing).
- SHOULD log unexpected-but-recoverable conditions (e.g., a document was skipped due to a parse error).
- SHOULD NOT log trivial or extremely frequent operations (e.g., individual React renders, synchronous computations).

## Log Levels

- SHOULD use `logger.info()` for informational messages that describe normal progress.
- SHOULD use `logger.warn()` for recoverable unexpected conditions — cases where execution continues but something is worth investigating.
- MUST NOT use `logger.error()` for errors. Instead, report the error to Sentry with `captureException()` and let it propagate. See [Error Handling](./error-handling.md).

## Logger Setup

The project uses [Pino](https://getpino.io/) for structured JSON logging.

- MUST use the `rootLogger` exported from `app/(app)/_/logger.ts` as the base logger. Do not create a new `pino()` instance directly.
- MUST create a **child logger** scoped to each module, setting a `module` field with an emoji identifier:

```typescript
import { rootLogger } from "@/logger";

const logger = rootLogger.child({ module: "📥" });
```

- SHOULD choose an emoji that represents the module's concern at a glance (e.g., `📥` for data fetching, `🌏` for external web requests, `🖼️` for image handling). Prefer a unique emoji per module so log lines can be filtered by module without reading the full path.

## Structured Log Format

Pino accepts an optional **context object** as the first argument and the **message string** as the second. Use this two-argument form whenever there is relevant context to attach.

```typescript
// No context needed
logger.info("Started fetching blog posts.");

// With context
logger.info({ slug, draft }, "Started fetching post.");
logger.info({ slug, duration: performance.now() - startedAt }, "Completed fetching post.");
```

- SHOULD include identifiers (e.g., `slug`, `url`, `filename`) in the context object so log lines are searchable and filterable.
- SHOULD include timing information (`duration`) in "completed" log lines for operations where latency matters.
- MUST NOT log values that could contain sensitive user data (passwords, tokens, PII). Log only identifiers and metadata.

## Message Conventions

Log messages SHOULD follow a consistent past-tense / gerund-phrase pattern that makes log streams easy to scan:

| Moment | Prefix | Example |
|---|---|---|
| Beginning of an operation | `"Started ..."` | `"Started fetching blog posts."` |
| Successful completion | `"Completed ..."` or `"Finished ..."` | `"Completed fetching web embed metadata."` |
| Recoverable skip / partial failure | Descriptive past tense | `"Skipped a blog post due to parse error."` |

```typescript
// CORRECT
logger.info({ url }, "Started fetching web embed metadata.");
// ... operation ...
logger.info({ url, duration }, "Completed fetching web embed metadata.");

// CORRECT — warn on recoverable skip
logger.warn(
  { slug: doc.slug, error: z.flattenError(parseResult.error) },
  "Skipped a blog post due to parse error.",
);

// WRONG — vague, not scannable
logger.info("done");
logger.info("error fetching post");
```

- MUST end every log message with a period (`.`) for grammatical consistency.
