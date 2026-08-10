"use client";

import { captureException } from "@sentry/nextjs";
import { createContext, type ReactNode, use, useEffect, useState } from "react";
import { startAnalytics, stopAnalytics } from "@/helpers/analytics";
import {
	type AnalyticsConsent,
	persistAnalyticsConsent,
} from "@/helpers/analytics-consent";

interface AnalyticsConsentState {
	/** `null` until the visitor decides; the banner renders for exactly that state. */
	consent: AnalyticsConsent | null;
	/**
	 * Whether collection is actually live. Distinct from `consent === "granted"`
	 * because the SDK loads asynchronously and is absent altogether where no
	 * token is configured, so a page view has to wait for this rather than for
	 * the decision.
	 */
	isTracking: boolean;
	decide: (consent: AnalyticsConsent) => void;
}

const AnalyticsConsentContext = createContext<AnalyticsConsentState | null>(
	null,
);

/**
 * Holds the visitor's decision for the session and drives the analytics module
 * from it. Mounted in the root layout with the decision the server already read
 * from the cookie, so the first client render agrees with the server's.
 */
export function AnalyticsConsentProvider({
	initialConsent,
	children,
}: {
	initialConsent: AnalyticsConsent | null;
	children: ReactNode;
}): ReactNode {
	const [consent, setConsent] = useState(initialConsent);
	const [isTracking, setIsTracking] = useState(false);

	useEffect(() => {
		if (consent !== "granted") {
			stopAnalytics();
			setIsTracking(false);

			return;
		}

		// a revoke during the SDK load must not be overwritten by the load
		// resolving afterwards, so the result is applied only while this effect is
		// still the current one.
		let isCurrent = true;

		startAnalytics()
			.then((started) => {
				if (isCurrent) {
					setIsTracking(started);
				}
			})
			.catch((error: unknown) => {
				// a failed load leaves collection off, which is the safe direction —
				// but it is silent, so it is reported rather than swallowed.
				captureException(
					new Error("startAnalytics() failed to load the analytics SDK.", {
						cause: error,
					}),
				);

				if (isCurrent) {
					setIsTracking(false);
				}
			});

		return () => {
			isCurrent = false;
		};
	}, [consent]);

	function decide(next: AnalyticsConsent): void {
		persistAnalyticsConsent(next);
		setConsent(next);
	}

	return (
		<AnalyticsConsentContext.Provider value={{ consent, isTracking, decide }}>
			{children}
		</AnalyticsConsentContext.Provider>
	);
}

/**
 * @throws when called outside {@link AnalyticsConsentProvider}, where a consent
 * state would otherwise be silently invented.
 */
export function useAnalyticsConsent(): AnalyticsConsentState {
	const state = use(AnalyticsConsentContext);

	if (!state) {
		throw new Error(
			"useAnalyticsConsent() was called outside <AnalyticsConsentProvider>.",
		);
	}

	return state;
}
