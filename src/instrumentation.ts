import {
	configure as configureLogtape,
	getAnsiColorFormatter,
	getConsoleSink,
	getTextFormatter,
} from "@logtape/logtape";
import { captureRequestError, init as initializeSentry } from "@sentry/nextjs";
import { sentryDsn } from "@/config";
import { logger } from "@/logger";
import { isDevelopment, runtimeType } from "@/runtime";

export async function register() {
	await configureLogtape({
		sinks: {
			console: getConsoleSink({
				formatter: isDevelopment
					? getAnsiColorFormatter({
							timestamp: "time",
						})
					: getTextFormatter({
							timestamp: "none",
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

		initializeSentry({
			dsn: sentryDsn,
			tracesSampleRate: 1,
			enableLogs: true,
			sendDefaultPii: true,
		});

		logger.debug("Finished initializing sentry.");
	}

	logger.debug("Finished initializing server error tracking.");
}

export const onRequestError = captureRequestError;
