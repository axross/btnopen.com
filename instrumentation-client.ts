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
