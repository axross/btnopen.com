---
status: accepted
---

# Collect only what is read, and ask before collecting it

Every visitor to btnopen.com was recorded. Mixpanel ran autocapture over clicks,
rage clicks, dead clicks, input, scroll, and submissions with
`capture_text_content: true`, recorded 100% of sessions, collected heatmap data,
and set `ignore_dnt: true` so a browser's Do Not Track signal was explicitly
overridden. Sentry recorded a further tenth of all sessions. None of it was
gated on anything but the presence of an API token, and the site had no page
describing any of it.

Against that, the only telemetry anyone here reads is page views and clicks on
three social links. The imbalance decided the shape of the answer: cut the
collection first, and only then decide what the remainder needs.

**What the site collects is now two things, on two bases.** Error reporting
through Sentry runs for every visitor, ungated, because it is the diagnostic
basis the site runs on and because it captures a failure rather than a reading
session. Analytics through Mixpanel runs only for a visitor who has granted
consent, and is reduced to the page views and link clicks that are actually
read — no autocapture, no session recording, no heatmaps, and Do Not Track
honoured. Sentry's ordinary-session replay is off entirely; error-linked replay
stays at full rate.

**The gate is the absence of the SDK, not a suppressed send.** `mixpanel-browser`
is imported dynamically inside `startAnalytics()`, which the consent provider
calls only once the stored decision reads `granted`. A visitor who declines, or
who has not answered, does not download the SDK at all. Initializing it
opted-out — the vendor's own answer, via `opt_out_tracking_by_default` — was
rejected because it still ships and runs the code.

**Events from before a grant are dropped, never queued.** There is no SDK loaded
to queue into, and a page view from before the visitor agreed is precisely the
data they had not agreed to. Granting reports the page they are on and nothing
earlier.

**Query parameters reach a payload only by allowlist.** `trackPageView` used to
forward the whole query string. It now forwards `draft` and `agentic` and drops
everything else, including parameters the list has never heard of. The
alternative — excluding known-sensitive names — fails the first time someone
adds a parameter without thinking about analytics, which
[#205](https://github.com/axross/btnopen.com/issues/205)'s per-post share token
would have been.

**The decision is a cookie rather than `localStorage`**, so the server can read
it while rendering and omit the banner entirely for a visitor who has already
answered. Storing a record of the visitor's own choice is what honouring it
requires, so it is not itself gated.

Two consequences were accepted. Keeping a consent-gated Mixpanel rather than
removing it outright means a banner on every first visit, bought against page-view
insight that a personal blog can arguably live without; removing it was
considered and is still the cheaper answer if the banner ever stops being worth
it. And a new site-wide footer now exists solely to keep the privacy link
reachable after the banner is gone, which is chrome the site did not previously
carry.
