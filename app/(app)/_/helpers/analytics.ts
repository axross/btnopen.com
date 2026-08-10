import { snakeCase } from "change-case";
import type { OverridedMixpanel } from "mixpanel-browser";
import { mixpanelToken } from "@/runtime";
import { pickReportableSearchParams } from "./reportable-search-params";

interface Actions {
	"github link click": never;
	"linkedin link click": never;
	"x link click": never;
}

// the SDK module, held from the first grant onward. `init` is a one-time call
// on Mixpanel's singleton, so the reference — not the consent flag below —
// guards it: revoking and granting again re-opts-in rather than re-initializing.
let loadedMixpanel: OverridedMixpanel | null = null;

// the consent gate. nothing below sends while it is false, and until the first
// grant flips it the SDK has not even been downloaded.
let isTracking = false;

/**
 * Loads Mixpanel and opts the visitor in. Called only once consent is granted:
 * the import is dynamic so a visitor who never consents does not download the
 * SDK at all, which gates collection harder than initializing it opted-out.
 *
 * @returns whether tracking is live afterwards — `false` when no token is
 * configured, which is how local development, CI, and forked-pull-request
 * previews run.
 */
export async function startAnalytics(): Promise<boolean> {
	if (!mixpanelToken) {
		return false;
	}

	isTracking = true;

	if (!loadedMixpanel) {
		const { default: mixpanel } = await import("mixpanel-browser");

		// every capture setting is left at the SDK's own default, which is off for
		// autocapture, session recording, and heatmaps, and honours Do Not Track.
		// page views and the link-click actions below are the whole of what this
		// site collects, and both are sent explicitly.
		mixpanel.init(mixpanelToken);

		loadedMixpanel = mixpanel;
	}

	// a revoke can land while the dynamic import is in flight; the latest
	// decision wins rather than the one that started the load.
	if (!isTracking) {
		return false;
	}

	loadedMixpanel.opt_in_tracking();

	return true;
}

/**
 * Stops collection and clears what the SDK stored. Safe before any grant, when
 * it does nothing at all because no module was ever loaded.
 */
export function stopAnalytics(): void {
	isTracking = false;

	// defaults to `clear_persistence` and `delete_user`, which is what revoking
	// has to do — leaving the distinct id behind would keep the visitor
	// identifiable to a later grant.
	loadedMixpanel?.opt_out_tracking();
}

export function trackAction<Name extends keyof Actions>(
	name: Name,
	params?: Actions[Name] extends never ? undefined : Actions[Name],
) {
	if (!isTracking || !loadedMixpanel) {
		return;
	}

	loadedMixpanel.track(
		snakeCase(name),
		params
			? Object.fromEntries(
					Object.entries(params).map(([key, value]) => [snakeCase(key), value]),
				)
			: undefined,
	);
}

export function trackPageView({
	pathname,
	searchParams,
}: {
	pathname: string;
	searchParams: URLSearchParams;
}) {
	if (!isTracking || !loadedMixpanel) {
		return;
	}

	loadedMixpanel.track_pageview({
		path: pathname,
		query: pickReportableSearchParams(searchParams),
	});
}
