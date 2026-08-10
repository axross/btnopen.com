import {
	init as initializeSentry,
	requestDataIntegration,
} from "@sentry/nextjs";
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
		// this app's query parameters are routing state, never secrets.
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
