import { captureRequestError, init as initializeSentry } from "@sentry/nextjs";
import type { Instrumentation } from "next";
import { sentryDsn } from "@/config";

let sentry: NonNullable<ReturnType<typeof initializeSentry>> | null = null;

export function trackError(error: Error): void {
	if (sentry) {
		sentry.captureException(error);
	}
}

export function initializeServerErrorTracking(): void {
	if (sentryDsn) {
		const client = initializeSentry({
			dsn: sentryDsn,
			tracesSampleRate: 1,
			enableLogs: true,
			sendDefaultPii: true,
		});

		if (client) {
			sentry = client;
		}
	}
}

export const onRequestError: Instrumentation.onRequestError = (
	error,
	request,
	errorContext,
) => {
	captureRequestError(error, request, errorContext);
};
