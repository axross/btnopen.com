import { captureException } from "@sentry/nextjs";
import { logger } from "@/logger";
import { isDevelopment, isSentryEnabled, runtimeType } from "@/runtime";

export function trackError(error: Error): void {
	if (isDevelopment) {
		logger.error(error);
	}

	if (isSentryEnabled) {
		const errorId = captureException(error);

		if (runtimeType !== "client") {
			logger.debug(`Tracked a server error ${errorId}.`);
		}
	}
}
