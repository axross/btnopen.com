import { captureRequestError } from "@sentry/nextjs";
import { sentryDsn } from "@/config";
import { rootLogger } from "@/logger";
import { runtimeType } from "@/runtime";

const logger = rootLogger.child({}, { msgPrefix: "🚀 " });

export async function register() {
	logger.debug("Started initializing server error tracking.");

	if (sentryDsn) {
		logger.debug(`Started initializing sentry (runtime type: ${runtimeType}).`);

		if (runtimeType === "node") {
			await import("../sentry.server.config");
		}

		if (runtimeType === "edge") {
			await import("../sentry.edge.config");
		}

		logger.debug("Finished initializing sentry.");
	}

	logger.debug("Finished initializing server error tracking.");
}

export const onRequestError = captureRequestError;
