import {
	captureRouterTransitionStart,
	init as initializeSentry,
	replayIntegration,
} from "@sentry/nextjs";
import mixpanel from "mixpanel-browser";

if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
	initializeSentry({
		dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
		integrations: [replayIntegration()],
		tracesSampleRate: 1,
		enableLogs: true,
		replaysSessionSampleRate: 0.1,
		replaysOnErrorSampleRate: 1.0,
		sendDefaultPii: true,
	});
}

if (process.env.NEXT_PUBLIC_MIXPANEL_TOKEN) {
	mixpanel.init(process.env.NEXT_PUBLIC_MIXPANEL_TOKEN, {
		// biome-ignore-start lint/style/useNamingConvention: Mixpanel uses snake_case
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
		ignore_dnt: process.env.NODE_ENV === "development",
		// biome-ignore-end lint/style/useNamingConvention: Mixpanel uses snake_case
	});
}

export const onRouterTransitionStart = captureRouterTransitionStart;
