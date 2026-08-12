import {
	init as initializeSentry,
	requestDataIntegration,
} from "@sentry/nextjs";
import { redactShareTokenInEvent } from "@/helpers/share-token-scrubbing";
import { sentryDsn, sha, vercelEnvironment } from "@/runtime";

initializeSentry({
	dsn: sentryDsn,
	// kept identical to sentry.server.config.ts. The edge SDK never reads a
	// request body onto the scope today, so this is belt-and-braces rather than
	// an active fix — but the two runtimes sharing one posture is what stops the
	// next person from narrowing one and forgetting the other.
	integrations: [requestDataIntegration({ include: { data: false } })],
	// the same commit SHA next.config.ts hands the build plugin, so an event
	// and its uploaded source maps can never file under different releases.
	release: sha,
	environment: vercelEnvironment,
	// a personal blog's traffic fits inside the free quota whole, so nothing is
	// gained by sampling and a sampled trace is missing precisely when a slow
	// page is being chased.
	tracesSampleRate: 1,
	// every event leaves with a post's share token redacted out of it, through
	// `beforeSend` for an error and `beforeSendTransaction` for a transaction,
	// which carries the URL just as an error does. what the redaction reaches is
	// `share-token-scrubbing.ts`'s to state rather than this file's: it walks the
	// whole event rather than a list of fields, so there is no covered set named
	// here that could fall behind it.
	beforeSend: redactShareTokenInEvent,
	beforeSendTransaction: redactShareTokenInEvent,
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
		// actually removes it, from this field and from everywhere else in the event.
		urlQueryParams: true,
		stackFrameVariables: true,
		frameContextLines: 5,
		// content — comment submissions, /api/mcp payloads, and post rows stay out.
		// httpBodies alone does not achieve that; the integration override above is
		// what makes this line true on the Node runtime.
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
