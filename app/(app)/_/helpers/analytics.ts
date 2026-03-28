import { snakeCase } from "change-case";
import Mixpanel from "mixpanel-browser";
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
}
