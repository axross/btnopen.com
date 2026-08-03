# Third-Party Services

The app uses external services for error tracking, analytics, and commenter authentication. Treat these integrations as runtime and privacy-sensitive surfaces, not ordinary UI dependencies.

| Service | Purpose |
| ------- | ------- |
| [Sentry](https://sentry.io/) | Error tracking |
| [Mixpanel](https://mixpanel.com/) | Analytics |
| [Clerk](https://clerk.com/) | Commenter authentication, brokering GitHub OAuth |

## Capture Settings Already in Force

Sentry and Mixpanel are both configured to capture broadly, so the privacy question for a new surface is not "does anything capture this" but "does the existing capture already reach it". Clerk captures nothing of its own here and has its own section below. These settings are the context every new form, field, or rendered value inherits — what each one means, and how to change one safely, belongs to the Sentry instrumentation capability for the Sentry rows and to the software instrumentation capability's product-event rules for the Mixpanel row.

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
- SHOULD keep durable third-party-service rules here. `README.md`'s tech-stack table names all three services for orientation and is expected to overlap; `CLAUDE.md` carries neither table, holding only how agents work in this repository.

## Clerk's Identity Posture

Clerk is the only one of the three that handles identity, so its posture is about what crosses the boundary in each direction rather than what a sampling rate captures. It is also the only one that is off unless configured: `isClerkAvailable` derives from `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, and without the key no provider mounts and no Clerk code initializes — which is how local development, CI, and forked-pull-request previews run without credentials. Each line below is verified against this repository's code rather than inferred from the vendor's defaults.

| Question | Answer here |
| --- | --- |
| What Clerk holds | The reader's GitHub OAuth identity, in Clerk's own store. This repository never queries it beyond the submit-time read in the comment write path |
| What this repository stores | Four snapshot fields on the comment row — the Clerk user id, display name, GitHub username, and avatar URL. See [comments-subsystem.md](./comments-subsystem.md) |
| Email addresses | None. The write path reads no email from Clerk, and the collection has no field for one |
| What is logged | The Clerk user id, on the Pino line the comment write path emits after a successful create |
| What reaches Sentry | No linked user — nothing calls `Sentry.setUser()`. Comment submission bodies are excluded by `httpBodies: []`, which the config comment names comment submissions as a reason for |
| What reaches Mixpanel | No linked user — nothing calls `Mixpanel.identify()`. Commenter names, handles, and avatars do render into the DOM that autocapture visits, but they are public content by construction |

**Guidelines:**

- MUST NOT introduce a commenter email address into this repository — not into the collection, a log line, or an analytics call. The subsystem reads none from Clerk today, and that absence is what keeps the site's database free of a commenter identifier it would have to protect and erase.
- MUST NOT call `Sentry.setUser()` or `Mixpanel.identify()` with a Clerk identity. Neither service links a commenter today, and linking one would attach a real person to every event and replay from that session, which no diagnostic need here justifies.
- MUST re-verify this table against the code when changing the comment write path, rather than trusting it; it records what the code does at a point in time, and a new stored or logged field silently invalidates a row.
- MUST consult Clerk's own current documentation for the vendor's data-retention and PII controls. No installed capability covers Clerk, so nothing here can be deferred to one, per [tech-stack.md](./tech-stack.md).
