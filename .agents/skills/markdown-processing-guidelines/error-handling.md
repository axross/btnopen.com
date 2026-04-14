# Error Handling

- The `remarkRehype` `unknownHandler` MUST call `captureException` from `@sentry/nextjs` for any unrecognized MDAST node types.
- MUST NOT throw errors during markdown processing — unrecognized nodes should be reported and gracefully skipped.
- The `Media` component MUST return `null` with a logger warning for invalid `src` values rather than throwing.
