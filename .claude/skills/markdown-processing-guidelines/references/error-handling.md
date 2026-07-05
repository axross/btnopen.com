# Error Handling

Error Handling captures the project-specific context for the checklist below: The `remarkRehype` `unknownHandler` MUST call `captureException` from `@sentry/nextjs` for any unrecognized MDAST node types.

**Guidelines:**

- MUST make the `remarkRehype` `unknownHandler` call `captureException` from `@sentry/nextjs` for any unrecognized MDAST node types.
- MUST NOT throw errors during markdown processing — unrecognized nodes should be reported and gracefully skipped.
- MUST make the `Media` component return `null` with a logger warning for invalid `src` values rather than throwing.
