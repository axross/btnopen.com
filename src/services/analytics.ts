import { snakeCase } from "change-case";
import Mixpanel from "mixpanel-browser";
import { event as odsEvent, view as odsView } from "onedollarstats";
import { isMixpanelEnabled } from "@/runtime";

interface Actions {
	"github link click": never;
	"linkedin link click": never;
	"x link click": never;
}

export function trackAction<Name extends keyof Actions>(
	name: Name,
	params?: Actions[Name] extends never ? undefined : Actions[Name],
) {
	if (isMixpanelEnabled) {
		Mixpanel.track(
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
	if (isMixpanelEnabled) {
		Mixpanel.track_pageview({
			path: pathname,
			query: searchParams,
		});
	}

	// biome-ignore lint/nursery/noFloatingPromises: it doesn't need to be awaited
	odsView(pathname, Object.fromEntries(searchParams.entries()));
}
