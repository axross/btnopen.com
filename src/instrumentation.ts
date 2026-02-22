import { captureRequestError, init as initializeSentry } from "@sentry/nextjs";
import { sentryDsn } from "./config";
import { runtimeType } from "./runtime";

export async function register() {
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

export const onRequestError = captureRequestError;
