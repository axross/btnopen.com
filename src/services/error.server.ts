import {
	captureException,
	captureRequestError,
	init as initializeSentry,
} from "@sentry/nextjs";
import type { Instrumentation } from "next";
import { sentryDsn } from "@/config";
import { runtimeType } from "@/runtime";

export function trackError(error: Error): void {
	if (sentryDsn) {
		const errorId = captureException(error);

		console.info(`Tracked a server error ${errorId}.`);
	}
}

export function initializeServerErrorTracking(): void {
	console.info("Started initializing server error tracking.");

	if (sentryDsn && (runtimeType === "node" || runtimeType === "edge")) {
		console.info(`Started initializing sentry (runtime type: ${runtimeType}).`);

		initializeSentry({
			dsn: sentryDsn,
			tracesSampleRate: 1,
			enableLogs: true,
			sendDefaultPii: true,
		});

		console.info("Finished initializing sentry.");
	}

	console.info("Finished initializing server error tracking.");
}

export const onRequestError: Instrumentation.onRequestError = (
	error,
	request,
	errorContext,
) => {
	captureRequestError(error, request, errorContext);
};
