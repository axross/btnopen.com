import {
	init as initializeSentry,
	requestDataIntegration,
} from "@sentry/nextjs";
import { redactShareTokenInEvent } from "@/helpers/share-token-scrubbing";
import { sentryDsn, sha, vercelEnvironment } from "@/runtime";

initializeSentry({
	dsn: sentryDsn,
	// `dataCollection.httpBodies` below does NOT cover the request body on its
	// own. As of @sentry/nextjs 10.69 only two call sites read that field (server
	// actions and tRPC); the Node HTTP server reads the incoming body into the
	// isolation scope purely on `maxIncomingRequestBodySize`, and this
	// integration then hard-codes `data: true` when copying the scope onto an
	// event or a span. Overriding it by name — it is a default integration in
	// both the Node and edge SDKs — is what actually keeps a comment's POST body
	// out of both. Reaching for `httpIntegration` to stop the read itself is not
	// available here: Next.js also traces this module into the edge bundle, whose
	// `@sentry/nextjs` entry has no such export, and the build fails on it.
	integrations: [requestDataIntegration({ include: { data: false } })],
	// the same commit SHA next.config.ts hands the build plugin, so an event
	// and its uploaded source maps can never file under different releases.
	release: sha,
	environment: vercelEnvironment,
	// a personal blog's traffic fits inside the free quota whole, so nothing is
	// gained by sampling and a sampled trace is missing precisely when a slow
	// page is being chased.
	tracesSampleRate: 1,
	// every event leaves with a post's share token redacted out of its URL, its
	// query string, and its breadcrumbs. Both hooks are wired, because a
	// transaction carries the URL just as an error does.
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
		// actually removes it, from the URL, this field, and every breadcrumb.
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
