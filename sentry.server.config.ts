import { init as initializeSentry } from "@sentry/nextjs";
import { sentryDsn } from "@/runtime";

initializeSentry({
	dsn: sentryDsn,
	tracesSampleRate: 1,
	enableLogs: true,
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
