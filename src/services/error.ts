import { captureException } from "@sentry/nextjs";
import { isDevelopment, isSentryEnabled, runtimeType } from "@/runtime";

export function trackError(error: Error): void {
	if (isDevelopment) {
		// biome-ignore lint/suspicious/noConsole: console output for development
		console.error(error);
	}

	if (isSentryEnabled) {
		const errorId = captureException(error);

		if (runtimeType !== "client") {
			console.info(`Tracked a server error ${errorId}.`);
		}
	}
}
