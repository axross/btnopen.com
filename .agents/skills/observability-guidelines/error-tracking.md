# Error Tracking

Apply these rules when writing, reviewing, or modifying Sentry setup, Sentry event capture, instrumentation files, or error context.

## Sentry Integration Boundaries

This project uses `@sentry/nextjs` through Next.js instrumentation and runtime-specific Sentry config files. Sentry changes affect production diagnostics and privacy, so treat them as observability and security work.

**Guidelines:**

- MUST import Sentry helpers from `@sentry/nextjs`, not `@sentry/node` or other Sentry packages.
- MUST consult [Development Guidelines › current-docs](../development-guidelines/current-docs.md) before changing `instrumentation.ts`, `instrumentation-client.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`, source maps, or Sentry runtime options.
- MUST consult [Application Security Requirements › privacy and exposure](../application-security-requirements/privacy-and-exposure.md) before adding event context, tags, user identifiers, breadcrumbs, or request data.
- SHOULD keep Sentry setup in the existing instrumentation/config files instead of scattering initialization across feature modules.

## Capturing Exceptions

Captured exceptions should represent unexpected failures or unexpected states that need investigation. Expected validation failures and normal not-found paths usually belong in control flow or logs, not Sentry.

**Guidelines:**

- MUST call `captureException()` whenever a caught error represents an unexpected failure that should be investigated.
- MUST call `captureException()` before an early return, redirect, `notFound()`, or fallback path when the failure would otherwise disappear.
- MUST rethrow after capture when the caller or error boundary still needs to handle the failure.
- SHOULD capture non-thrown unexpected states with a descriptive `Error` object when they indicate a renderer, parser, or data-contract gap.
- MUST NOT capture expected user input validation failures as exceptions unless they indicate abuse or a system defect.

## Event Context and PII

Sentry context should explain the failure without copying private content into a third-party event.

**Guidelines:**

- MUST NOT attach secrets, raw request bodies, raw markdown, access tokens, draft content, Payload session data, or private CMS fields to Sentry context.
- MUST treat `sendDefaultPii: true` as a privacy-sensitive setting and justify any new user, request, or identifier context.
- SHOULD prefer route names, public slugs, operation names, feature flags, and booleans over raw content values.
- SHOULD include enough stable context to make issues actionable, such as `slug`, `url`, `filename`, or module name when those values are intentionally public.
