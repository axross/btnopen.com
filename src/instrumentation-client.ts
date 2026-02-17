import {
	captureRouterTransitionStart,
	init as initializeSentry,
	replayIntegration,
} from "@sentry/nextjs";
import mixpanel from "mixpanel-browser";

initializeSentry({
	dsn: "https://25638a2e4194d2240e9b974494d3a898@o30395.ingest.us.sentry.io/4510898509774848",
	integrations: [replayIntegration()],
	tracesSampleRate: 1,
	enableLogs: true,
	replaysSessionSampleRate: 0.1,
	replaysOnErrorSampleRate: 1.0,
	sendDefaultPii: true,
});

mixpanel.init("1e718106bc4478f1c30aea60979efb12", {
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

export const onRouterTransitionStart = captureRouterTransitionStart;
