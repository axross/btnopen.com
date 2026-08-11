import {
	captureRouterTransitionStart,
	init as initializeSentry,
	replayIntegration,
} from "@sentry/nextjs";
import { redactShareTokenInEvent } from "@/helpers/share-token-scrubbing";
import { sentryDsn, sha, vercelEnvironment } from "@/runtime";

if (sentryDsn) {
	initializeSentry({
		dsn: sentryDsn,
		// the same commit SHA next.config.ts hands the build plugin, so an event
		// and its uploaded source maps can never file under different releases.
		release: sha,
		environment: vercelEnvironment,
		integrations: [replayIntegration()],
		// every event leaves with the share token redacted out of its URL, its
		// query string, and its breadcrumbs. Both hooks are wired, because a
		// transaction carries the URL just as an error does.
		beforeSend: redactShareTokenInEvent,
		beforeSendTransaction: redactShareTokenInEvent,
		// a personal blog's traffic fits inside the free quota whole, so nothing is
		// gained by sampling and a sampled trace is missing precisely when a slow
		// page is being chased.
		tracesSampleRate: 1,
		// ordinary sessions are not recorded. a session is only worth a recording
		// once it has failed, and replaying the ones that did not buys diagnostics
		// nobody reads at the cost of capturing every visitor's reading.
		replaysSessionSampleRate: 0,
		// error-linked replay stays at full rate — see observability.md, which pins
		// this floor at exactly 1.0.
		replaysOnErrorSampleRate: 1.0,
		// diagnostic context is allowed, user content is not. every category is set
		// explicitly: once `dataCollection` is present, an omitted category falls back
		// to the SDK's all-on default rather than to the narrow posture the replaced
		// `sendDefaultPii` boolean suggests. keep this block identical across
		// sentry.server.config.ts, sentry.edge.config.ts, and instrumentation-client.ts.
		dataCollection: {
			// diagnostics — what makes an issue answerable.
			userInfo: true,
			// the SDK filters sensitive keys (authorization, cookie, token, …) regardless.
			httpHeaders: { request: true, response: true },
			// left on, and deliberately not the control that keeps a post's share
			// token out of an event. The SDK attaches the full request URL
			// unconditionally and consults this flag only for the separate
			// `query_string` field, and the allow/deny forms its type permits are
			// applied to query parameters in no installed package (verified against
			// @sentry/core 10.69). Turning it off would therefore drop the routing
			// state that makes an issue answerable and keep the token; the
			// `beforeSend` / `beforeSendTransaction` redaction in this file is what
			// actually removes it, from the URL, this field, and every breadcrumb.
			urlQueryParams: true,
			stackFrameVariables: true,
			frameContextLines: 5,
			// content — comment submissions, /api/mcp payloads, and post rows stay out.
			cookies: false,
			httpBodies: [],
			databaseQueryData: false,
			// no AI integration exists here; set so adding one cannot silently ship prompts.
			genAI: { inputs: false, outputs: false },
			// a GraphQL document has its literal values redacted at collection time,
			// variables do not.
			graphQL: { document: true, variables: false },
		},
	});
}

// Mixpanel is deliberately absent from this file. it is initialized from
// `app/(app)/_/helpers/analytics.ts`, behind the visitor's consent, and loaded
// by a dynamic import there — so a visitor who has not consented never
// downloads the SDK, let alone runs it. Sentry stays here and stays ungated:
// error reporting is the diagnostic basis this site runs on, and it records no
// ordinary session.

export const onRouterTransitionStart = captureRouterTransitionStart;
