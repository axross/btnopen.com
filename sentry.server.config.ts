import {
	init as initializeSentry,
	requestDataIntegration,
} from "@sentry/nextjs";
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
	tracesSampleRate: 1,
	// every field is listed on purpose: naming `dataCollection` at all swaps
	// the SDK's baseline to its permissive defaults, so an omitted field is
	// collected unfiltered rather than left narrow.
	dataCollection: {
		// diagnostic — what makes an issue actionable
		userInfo: true,
		httpHeaders: { request: true, response: true },
		urlQueryParams: true,
		stackFrameVariables: true,
		frameContextLines: 5,
		graphQL: { document: true, variables: false },
		// content — user data that stays in the system that owns it
		cookies: false,
		httpBodies: [],
		genAI: { inputs: false, outputs: false },
		databaseQueryData: false,
	},
});
