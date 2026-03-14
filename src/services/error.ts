import { captureException } from "@sentry/nextjs";
import { rootLogger } from "@/logger";
import { isDevelopment, isSentryEnabled, runtimeType } from "@/runtime";

const logger = rootLogger.child({}, { msgPrefix: "🐞 " });

export function trackError(
	error: Error,
	{ extra }: { extra?: Record<string, unknown> } = {},
): void {
	if (isDevelopment) {
		// biome-ignore lint/suspicious/noConsole: nextjs prints the error better in development
		console.error(error);
	}

	if (isSentryEnabled) {
		const errorId = captureException(error, {
			extra,
		});

		if (runtimeType !== "client") {
			logger.debug(
				`Tracked a server error (id: ${errorId}, message: "${error.message}").`,
			);
		}
	}
}
