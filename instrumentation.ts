import { captureRequestError } from "@sentry/nextjs";
import { rootLogger } from "@/logger";
import { runtimeType, sentryDsn } from "@/runtime";

const logger = rootLogger.child({ module: "🥾" });

export async function register() {
	logger.debug("Started initializing server error tracking.");

	if (sentryDsn) {
		logger.debug({ runtime: runtimeType }, "Started initializing sentry.");

		if (runtimeType === "node") {
			await import("./sentry.server.config");
		}

		if (runtimeType === "edge") {
			await import("./sentry.edge.config");
		}

		logger.debug("Finished initializing sentry.");
	}

	logger.debug("Finished initializing server error tracking.");
}

export const onRequestError = captureRequestError;
