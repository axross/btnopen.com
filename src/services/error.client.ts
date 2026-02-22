import {
	captureException,
	captureRouterTransitionStart,
	init as initializeSentry,
	replayIntegration,
} from "@sentry/nextjs";
import { sentryDsn } from "@/config";

export function trackError(error: Error): void {
	if (sentryDsn) {
		captureException(error);
	}
}

export function initializeClientErrorTracking(): void {
	if (sentryDsn) {
		initializeSentry({
			dsn: sentryDsn,
			integrations: [replayIntegration()],
			tracesSampleRate: 1,
			enableLogs: true,
			replaysSessionSampleRate: 0.1,
			replaysOnErrorSampleRate: 1.0,
			sendDefaultPii: true,
		});
	}
}

export function onRouterTransitionStart(
	href: string,
	navigationType: "push" | "replace" | "traverse",
): void {
	captureRouterTransitionStart(href, navigationType);
}
