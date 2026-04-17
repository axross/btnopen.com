# Auth and Session Management

Apply these rules to verify Payload-managed authentication is not weakened and Sentry's PII exposure is bounded.

## Payload `users` Collection

- MUST flag a Critical when the diff weakens any of these in `payload/collections/user.ts`:
  - `auth.lockTime` set below `1000 * 60 * 5` (5 minutes)
  - `auth.maxLoginAttempts` raised above `5`
  - `auth: { … }` block removed entirely (defaults are weaker)
- MUST flag a Critical when the diff adds a new field to the `users` collection that exposes a credential (e.g., a plain-text API key field) — credentials belong in env vars, not in the database.
- MUST flag a Major when the `users` collection's `access.read` is changed to allow non-admin reads. User records contain email addresses and locked-out state.

## Session Cookies

- MUST flag a Critical when a new component or route handler reads or writes session cookies directly via `cookies()` from `next/headers`. Payload owns cookie management — bypassing it desyncs the auth state.
- MUST flag a Major when a new feature implements its own auth cookie or token rather than relying on Payload's `req.user` from the `getPayload({ config })` context.

## Live Preview Auth Path

- MUST flag a Critical when the diff makes `?preview=true` or `?draft=true` reachable without a valid Payload session. The existing `posts/[slug]/page.tsx` only renders `PayloadLivePreview` when `preview === "true"` — the draft data fetch in `getBlogPost({ draft: true })` still relies on Payload's draft-API authentication.
- MUST flag a Critical when a new `searchParams` flag is introduced that affects data visibility (e.g., a hypothetical `?internal=true`) without auth gating.

## Sentry PII Exposure

The project enables `sendDefaultPii: true` in all three Sentry init points (`sentry.server.config.ts`, `sentry.edge.config.ts`, `instrumentation-client.ts`) and runs Session Replay with `replaysSessionSampleRate: 0.1` and `replaysOnErrorSampleRate: 1.0`.

- The reviewer MUST be aware: Sentry already captures IP addresses, request bodies, and user-agent. Session Replay captures DOM mutations including form input.
- MUST flag a Critical when the diff adds a new authentication form, payment form, or any input that captures secrets, without applying Sentry Replay's masking (`data-sentry-mask`, `data-sentry-block`, or the `maskAllInputs: true` integration option). Even in this otherwise-public project, a draft-state admin form would be replayable.
- MUST flag a Major when a new `captureException(error, { extra: { … } })` call attaches a value that contains a token, password, session ID, or full request body.
- SHOULD flag a Minor recommendation to scope `tracesSampleRate` below `1` (currently `1` everywhere) when a new high-traffic route is introduced, to control Sentry quota.

## Mixpanel PII Exposure

The client init in `instrumentation-client.ts` enables `autocapture` with `capture_text_content: true` and `record_sessions_percent: 100`.

- MUST flag a Critical when a new component renders a credential, full email address, or other PII into the DOM tree visited by Mixpanel autocapture. Use `data-mp-no-capture` or wrap the element to disable capture.
- MUST flag a Major when a new `Mixpanel.track(…)` call attaches identifiers (raw email, IP, payment info) directly. Use a hashed or opaque user ID instead.

## Localhost / Production Divergence

- MUST flag a Major when the diff causes a code path to execute only when `isLocalhost === true` (per `app/(app)/_/runtime.ts`) but no equivalent exists for production — a localhost-only auth bypass that ships to production via deployed branch is a recurring class of bug.
