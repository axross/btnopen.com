"use client";

import mixpanel from "mixpanel-browser";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export function PageViewTracking(): null {
	const pathname = usePathname();
	const searchParams = useSearchParams();

	useEffect(() => {
		mixpanel.track_pageview({
			path: pathname,
			query: searchParams,
		});
	}, [pathname, searchParams]);

	return null;
}
