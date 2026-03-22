import {
	captureRouterTransitionStart,
	init as initializeSentry,
	replayIntegration,
} from "@sentry/nextjs";
import Mixpanel from "mixpanel-browser";
import { configure as configureOds } from "onedollarstats";
import { isProduction, mixpanelToken, sentryDsn } from "@/runtime";

if (sentryDsn) {
	initializeSentry({
		dsn: sentryDsn,
		integrations: [replayIntegration()],
		tracesSampleRate: 1,
		enableLogs: true,
		replaysSessionSampleRate: 0.1,
		replaysOnErrorSampleRate: 1.0,
		sendDefaultPii: true,
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

configureOds({
	hostname: "btnopen.com",
	autocollect: false,
	devmode: !isProduction,
});

export const onRouterTransitionStart = captureRouterTransitionStart;
