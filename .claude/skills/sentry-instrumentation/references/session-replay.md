# Session Replay

Apply this reference when enabling session replay, adjusting what it masks, choosing its sample rates, or deciding whether an application should record sessions at all.

Verified against `@sentry/react` and `@sentry/nextjs` 10.69.0 (web) and `@sentry/react-native` 8.20.0 (native).

## Two Integrations, Two Option Sets

Replay is one product with two implementations. The web integration records the DOM; the mobile integration records the rendered view hierarchy. They are configured separately, their option names differ, and an option from one does not exist in the other — the mobile integration masks images and vector drawables, concepts the web integration has no equivalent for.

Both are added through the integrations array and both read the same two sample rates from the top-level configuration.

**Guidelines:**

- MUST configure the integration matching the platform, and look its options up rather than porting names from the other platform's snippet.
- MUST NOT enable replay on a surface where the whole screen is sensitive by nature; masking reduces exposure but does not eliminate the recording.

## Masking Is Load-Bearing

Both integrations mask by default: text is replaced character by character, inputs are masked, media is blocked, and on mobile images and vectors are masked too. That default is what makes replay proportionate — a recording of shapes and interactions rather than a recording of someone's data.

Turning any of it off inverts the risk. An unmasked replay captures whatever was on screen, verbatim, into a third-party system, for every recorded session — including screens the person unmasking it was not thinking about.

There is one thing masking never has to be relied on for: the authorization header is stripped from captured network detail regardless of configuration.

**Guidelines:**

- MUST leave the default masking on; treat disabling any masking category as a privacy-sensitive change requiring a stated reason and review.
- MUST scope any unmasking to the narrowest possible selector or component rather than a global switch.
- MUST NOT unmask a surface that can display another user's data, regulated data, or credentials.
- SHOULD verify masking behaviour on a real recording after changing it, since the effect is visual and not testable by assertion.

## Sample Rates

Two rates control recording, and they answer different questions.

**Session sampling** records a proportion of all sessions from the start, whether or not anything goes wrong. It answers "what does normal use look like".

**Error sampling** keeps a rolling buffer and commits it when an error occurs. It answers "what happened before this failure" — which is the diagnostic question, and the one worth protecting.

The two are independent, which means the cheap configuration is available: error sampling high, session sampling low or zero. That records the sessions that failed and almost nothing else.

**Guidelines:**

- MUST keep error-linked capture at or near full rate even when session sampling is lowered; the failing session is the one worth having.
- SHOULD set session sampling low, or to zero, unless there is a specific product question that general recordings answer.
- MUST account for replay in quota planning before enabling it broadly; replay payloads dwarf error events.
- SHOULD record why each rate is what it is, so a later reader can tell a deliberate limit from an accident.

## Network Detail

Both integrations can attach request and response detail to a replay, and both gate it behind explicit URL allow lists. Bodies and headers are content, and the gating exists because capturing them by default would be indefensible.

The mobile integration additionally only supports one request mechanism today, so capture can appear configured and simply not apply to requests made another way.

**Guidelines:**

- MUST list specific URLs when enabling network detail, never a wildcard.
- MUST NOT capture request or response bodies for any endpoint carrying user content or credentials, per the data-class rules in [data-collection.md](./data-collection.md).
- SHOULD verify capture actually applies to the request mechanism the application uses, rather than assuming configuration implies coverage.

## Platform Caveats

Each platform carries documented limitations worth knowing before enabling replay rather than after:

- **Android** offers two capture strategies. The default is asynchronous, which can cause masking to lag a frame behind the content it should be covering. The alternative is experimental and masks everything unconditionally.
- **iOS** traverses the view hierarchy, and the traversal can crash on problematic view classes; the integration exposes include and exclude lists for exactly that.
- **Experimental surface capture** on Android masks only at whole-component granularity.

**Guidelines:**

- MUST test replay on a real device before shipping it, on both platforms, rather than trusting configuration.
- SHOULD exclude a view class from traversal as soon as it is implicated in a crash, rather than disabling replay wholesale.
- MUST treat an experimental capture strategy as experimental — behind a flag, on a limited audience, with a way to turn it off without a release.
