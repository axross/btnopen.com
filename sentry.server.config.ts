import { init as initializeSentry } from "@sentry/nextjs";
import { sentryDsn } from "@/runtime";

initializeSentry({
	dsn: sentryDsn,
	tracesSampleRate: 1,
	enableLogs: true,
	sendDefaultPii: true,
});
