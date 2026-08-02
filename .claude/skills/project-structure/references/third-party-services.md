# Third-Party Services

The app uses external services for error tracking and analytics. Treat these integrations as runtime and privacy-sensitive surfaces, not ordinary UI dependencies.

| Service | Purpose |
| ------- | ------- |
| [Sentry](https://sentry.io/) | Error tracking |
| [Mixpanel](https://mixpanel.com/) | Analytics |

## Capture Settings Already in Force

Both services are configured to capture broadly, so the privacy question for a new surface is not "does anything capture this" but "does the existing capture already reach it". These settings are the context every new form, field, or rendered value inherits — what each one means, and how to change one safely, belongs to the Sentry instrumentation capability for the Sentry rows and to the software instrumentation capability's product-event rules for the Mixpanel row.

| Setting | Where | What it means |
| --- | --- | --- |
| `dataCollection`, diagnostics on and content off | `sentry.server.config.ts`, `sentry.edge.config.ts`, `instrumentation-client.ts` | Sentry captures IP address and user identity, request and response headers, URL query parameters, and stack-frame variables with five lines of surrounding source. It does **not** capture cookies, request or response bodies, database query values, generative-AI content, or GraphQL variables. All ten categories are set explicitly in all three files |
| Session Replay at `replaysSessionSampleRate: 0.1`, `replaysOnErrorSampleRate: 1.0` | Sentry client init | DOM mutations, including form input, are recorded |
| `tracesSampleRate: 1` | all three Sentry init points | Every transaction is traced |
| `autocapture` with `capture_text_content: true`, `record_sessions_percent: 100` | Mixpanel, `instrumentation-client.ts` | Mixpanel captures content rendered into the DOM |

**Guidelines:**

- MUST NOT render a credential, full email address, or other PII into DOM that Mixpanel autocapture visits; use `data-mp-no-capture` or wrap the element to disable capture. Mixpanel has no installed vendor capability, so this rule and the one below are the whole of its contract here.
- MUST NOT pass a raw email, IP, or payment identifier to `Mixpanel.track(…)` — use a hashed or opaque identifier.
- MUST NOT lower `replaysOnErrorSampleRate` below `1.0`. The vendor capability asks for error-linked capture at or near full rate; this project pins the floor at exactly full, because error-time replay is the most diagnostic signal available here and a sampled one is absent precisely when it is wanted.
- MUST keep every `dataCollection` category set explicitly, in all three initialization files at once. Omitting one does not leave it at a safe default: once `dataCollection` is present the SDK falls back to its all-on defaults, so a category dropped from the object is a category switched back on.
- MUST treat a change to any other Sentry row above as vendor-layer work and consult the Sentry instrumentation capability, which owns replay masking, sampling, and the data-collection posture; [observability-conventions.md](./observability-conventions.md) records only which files hold this project's configuration.
- MUST consult the application security capability when a service change affects secrets, environment variables, or public exposure.
- SHOULD keep durable third-party-service rules here. `README.md`'s tech-stack table names Sentry and Mixpanel for orientation and is expected to overlap; `CLAUDE.md` carries neither, holding only how agents work in this repository.
