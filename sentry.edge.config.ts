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
