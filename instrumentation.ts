import { captureRequestError } from "@sentry/nextjs";
import { rootLogger } from "@/logger";
import { runtimeType, sentryDsn } from "@/runtime";

const logger = rootLogger.child({ module: "🥾" });

export async function register() {
	logger.info("Started initializing server error tracking.");

	if (sentryDsn) {
		logger.info({ runtime: runtimeType }, "Started initializing sentry.");

		if (runtimeType === "node") {
			await import("./sentry.server.config");
		}

		if (runtimeType === "edge") {
			await import("./sentry.edge.config");
		}

		logger.info("Finished initializing sentry.");
	}

	logger.info("Finished initializing server error tracking.");
}

export const onRequestError = captureRequestError;
