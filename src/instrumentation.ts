import {
	configure as configureLogtape,
	getConsoleSink,
	getTextFormatter,
} from "@logtape/logtape";
import { getPrettyFormatter } from "@logtape/pretty";
import { captureRequestError } from "@sentry/nextjs";
import { formatDate } from "date-fns";
import { sentryDsn } from "@/config";
import { logger } from "@/logger";
import { isDevelopment, runtimeType } from "@/runtime";

export async function register() {
	await configureLogtape({
		sinks: {
			console: getConsoleSink({
				formatter: isDevelopment
					? getPrettyFormatter({
							timestamp: (timestamp) => formatDate(timestamp, "HH:mm:ss.SSS"),
							level: () => "",
						})
					: getTextFormatter({
							format: (values) => values.message,
						}),
			}),
		},
		loggers: [
			{
				category: [],
				sinks: ["console"],
			},
		],
	});

	logger.debug("Started initializing server error tracking.");

	if (sentryDsn && (runtimeType === "node" || runtimeType === "edge")) {
		logger.debug(`Started initializing sentry (runtime type: ${runtimeType}).`);

		try {
			const { init: initializeSentry } = await import("@sentry/nextjs");

			initializeSentry({
				dsn: sentryDsn,
				tracesSampleRate: 1,
				enableLogs: true,
				sendDefaultPii: true,
			});
		} catch (error) {
			logger.error("Failed to initialize sentry.");
			logger.error(
				error instanceof Error ? (error.stack ?? error.message) : `${error}`,
			);
		}

		logger.debug("Finished initializing sentry.");
	}

	logger.debug("Finished initializing server error tracking.");
}

export const onRequestError = captureRequestError;
