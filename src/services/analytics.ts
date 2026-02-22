import { snakeCase } from "change-case";
import Mixpanel from "mixpanel-browser";
import {
	configure as configureOds,
	event as odsEvent,
	view as odsView,
} from "onedollarstats";
import { mixpanelToken } from "@/config";
import { isDevelopment } from "@/runtime";

interface Actions {
	"github link click": never;
	"linkedin link click": never;
	"x link click": never;
}

let mixpanel: typeof Mixpanel | null = null;

export function initializeAnalytics() {
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

		mixpanel = Mixpanel;
	}

	configureOds({
		hostname: "btnopen.com",
		autocollect: false,
		devmode: isDevelopment,
	});
}

export function trackAction<Name extends keyof Actions>(
	name: Name,
	params?: Actions[Name] extends never ? undefined : Actions[Name],
) {
	if (mixpanel) {
		mixpanel.track(
			snakeCase(name),
			params
				? Object.fromEntries(
						Object.entries(params).map(([key, value]) => [
							snakeCase(key),
							value,
						]),
					)
				: undefined,
		);
	}

	// biome-ignore lint/nursery/noFloatingPromises: it doesn't need to be awaited
	odsEvent(name, params);
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

	// biome-ignore lint/nursery/noFloatingPromises: it doesn't need to be awaited
	odsView(pathname, Object.fromEntries(searchParams.entries()));
}
