import {
	captureRouterTransitionStart,
	init as initializeSentry,
	replayIntegration,
} from "@sentry/nextjs";
import { sentryDsn } from "@/config";

let sentry: NonNullable<ReturnType<typeof initializeSentry>> | null = null;

export function trackError(error: Error): void {
	if (sentry) {
		sentry.captureException(error);
	}
}

export function initializeClientErrorTracking(): void {
	if (sentryDsn) {
		const client = initializeSentry({
			dsn: sentryDsn,
			integrations: [replayIntegration()],
			tracesSampleRate: 1,
			enableLogs: true,
			replaysSessionSampleRate: 0.1,
			replaysOnErrorSampleRate: 1.0,
			sendDefaultPii: true,
		});

		if (client) {
			sentry = client;
		}
	}
}

export function onRouterTransitionStart(
	href: string,
	navigationType: "push" | "replace" | "traverse",
): void {
	captureRouterTransitionStart(href, navigationType);
}
