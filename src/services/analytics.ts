import Mixpanel from "mixpanel-browser";
import { mixpanelToken } from "@/config";

let mixpanel: typeof Mixpanel | null = null;

export function initializeAnalytics() {
	if (mixpanelToken) {
		Mixpanel.init(mixpanelToken, {
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
			ignore_dnt: true,
			// biome-ignore-end lint/style/useNamingConvention: Mixpanel uses snake_case
		});

		mixpanel = Mixpanel;
	}
}

export function trackPageView({
	pathname,
	searchParams,
}: {
	pathname: string;
	searchParams: URLSearchParams;
}) {
	if (mixpanel) {
		mixpanel.track_pageview({
			path: pathname,
			query: searchParams,
		});
	}
}
