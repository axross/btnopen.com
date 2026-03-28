// biome-ignore-all lint/style/noProcessEnv: only place accessing env vars in public realm
import { rootLogger } from "./logger";

const logger = rootLogger.child({ module: "🥾" });

let resolvedRuntimeType: "client" | "node" | "edge" | "unknown" = "unknown";

if (typeof globalThis.window !== "undefined") {
	resolvedRuntimeType = "client";
} else if (process.env.NEXT_RUNTIME === "nodejs") {
	resolvedRuntimeType = "node";
} else if (process.env.NEXT_RUNTIME === "edge") {
	resolvedRuntimeType = "edge";
}

export const runtimeType = resolvedRuntimeType;
export const vercelEnvironment =
	process.env.NEXT_PUBLIC_VERCEL_ENV ?? "unknown";

export const sha = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ?? "unknown";

export const allowedHosts = new Set<string>();

if (process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL) {
	allowedHosts.add(
		new URL(`https://${process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL}`)
			.hostname,
	);
}

if (process.env.NEXT_PUBLIC_VERCEL_URL) {
	allowedHosts.add(
		new URL(`https://${process.env.NEXT_PUBLIC_VERCEL_URL}`).hostname,
	);
}

if (allowedHosts.size === 0) {
	logger.warn(
		'Added "localhost:3000" as an allowed host because no other allowed hosts are available.',
	);

	allowedHosts.add("localhost:3000");
}

export const vercelBlobToken =
	process.env.BLOB_PAYLOAD_READ_WRITE_TOKEN || null;

export const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
export const isSentryEnabled = !!sentryDsn;

export const mixpanelToken = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;
export const isMixpanelEnabled = !!mixpanelToken;
