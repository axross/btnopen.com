"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useAnalyticsConsent } from "@/components/analytics-consent-provider";
import { trackPageView } from "@/helpers/analytics";

export function PageViewTracking(): null {
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const { isTracking } = useAnalyticsConsent();

	// `isTracking` is a dependency rather than an early return, so granting
	// consent mid-session reports the page the visitor is already on. nothing
	// from before the grant is replayed — the effect fires for the current route
	// only.
	useEffect(() => {
		if (!isTracking) {
			return;
		}

		trackPageView({
			pathname,
			searchParams,
		});
	}, [isTracking, pathname, searchParams]);

	return null;
}
