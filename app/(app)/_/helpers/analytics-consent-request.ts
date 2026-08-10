import { cookies } from "next/headers";
import {
	type AnalyticsConsent,
	analyticsConsentCookieName,
	parseAnalyticsConsent,
} from "./analytics-consent";

/**
 * Resolves the stored consent decision for the current request, so the root
 * layout can hand the provider its initial value. Reading it on the server is
 * what keeps the banner from rendering at all for a visitor who has already
 * decided.
 */
export async function getStoredAnalyticsConsent(): Promise<AnalyticsConsent | null> {
	const cookieStore = await cookies();

	return parseAnalyticsConsent(
		cookieStore.get(analyticsConsentCookieName)?.value,
	);
}
