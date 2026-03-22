"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { trackPageView } from "@/helpers/analytics";

export function PageViewTracking(): null {
	const pathname = usePathname();
	const searchParams = useSearchParams();

	useEffect(() => {
		trackPageView({
			pathname,
			searchParams,
		});
	}, [pathname, searchParams]);

	return null;
}
