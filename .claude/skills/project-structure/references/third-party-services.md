# Third-Party Services

The app uses external services for error tracking and analytics. Treat these integrations as runtime and privacy-sensitive surfaces, not ordinary UI dependencies.

| Service | Purpose |
| ------- | ------- |
| [Sentry](https://sentry.io/) | Error tracking |
| [Mixpanel](https://mixpanel.com/) | Analytics |

## Capture Settings Already in Force

Both services are configured to capture broadly, so the privacy question for a new surface is not "does anything capture this" but "does the existing capture already reach it". These settings are the context every new form, field, or rendered value inherits.

| Setting | Where | What it means |
| --- | --- | --- |
| `sendDefaultPii: true` | `sentry.server.config.ts`, `sentry.edge.config.ts`, `instrumentation-client.ts` | Sentry already captures IP addresses, request bodies, and user agents |
| Session Replay at `replaysSessionSampleRate: 0.1`, `replaysOnErrorSampleRate: 1.0` | Sentry client init | DOM mutations, including form input, are recorded |
| `tracesSampleRate: 1` | all three Sentry init points | Every transaction is traced |
| `autocapture` with `capture_text_content: true`, `record_sessions_percent: 100` | Mixpanel, `instrumentation-client.ts` | Mixpanel captures content rendered into the DOM |

**Guidelines:**

- MUST apply Sentry Replay masking (`data-sentry-mask`, `data-sentry-block`, or the `maskAllInputs: true` integration option) to any new authentication form, payment form, or input capturing a secret. A draft-state admin form is replayable otherwise.
- MUST NOT render a credential, full email address, or other PII into DOM that Mixpanel autocapture visits; use `data-mp-no-capture` or wrap the element to disable capture.
- MUST NOT attach a token, password, session ID, or full request body to `captureException(error, { extra: { … } })`, and MUST NOT pass a raw email, IP, or payment identifier to `Mixpanel.track(…)` — use a hashed or opaque identifier.
- SHOULD scope `tracesSampleRate` below `1` when introducing a new high-traffic route, to control Sentry quota.
- MUST consult [observability-conventions.md](./observability-conventions.md) before changing Sentry initialization, error reporting, or logging behavior, and the application security capability when a service change affects secrets, environment variables, public exposure, or captured user data.
- SHOULD keep third-party service inventory here instead of duplicating it in `AGENTS.md`.
