import {
	captureRouterTransitionStart,
	init as initializeSentry,
	replayIntegration,
} from "@sentry/nextjs";
import Mixpanel from "mixpanel-browser";
import { mixpanelToken, sentryDsn, sha, vercelEnvironment } from "@/runtime";

if (sentryDsn) {
	initializeSentry({
		dsn: sentryDsn,
		// the same commit SHA next.config.ts hands the build plugin, so an event
		// and its uploaded source maps can never file under different releases.
		release: sha,
		environment: vercelEnvironment,
		integrations: [replayIntegration()],
		tracesSampleRate: 1,
		replaysSessionSampleRate: 0.1,
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
}

if (mixpanelToken) {
	Mixpanel.init(mixpanelToken, {
		// biome-ignore-start lint/style/useNamingConvention: Mixpanel prefers snake_case
		autocapture: {
			pageview: false,
			click: true,
			rage_click: true,
			dead_click: true,
			input: true,
			scroll: true,
			submit: true,
			capture_text_content: true,
		},
		record_sessions_percent: 100,
		record_heatmap_data: true,
		ignore_dnt: true,
		// biome-ignore-end lint/style/useNamingConvention: Mixpanel prefers snake_case
	});
}

export const onRouterTransitionStart = captureRouterTransitionStart;
