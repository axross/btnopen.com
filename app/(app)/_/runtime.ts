// biome-ignore-all lint/style/noProcessEnv: only place accessing env vars in public realm

let resolvedRuntimeType: "client" | "node" | "edge" | "unknown" = "unknown";

if (typeof globalThis.window !== "undefined") {
	resolvedRuntimeType = "client";
} else if (process.env.NEXT_RUNTIME === "nodejs") {
	resolvedRuntimeType = "node";
} else if (process.env.NEXT_RUNTIME === "edge") {
	resolvedRuntimeType = "edge";
}

export const runtimeType = resolvedRuntimeType;
export const isDevelopment = process.env.NODE_ENV !== "production";
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

if (isDevelopment) {
	allowedHosts.add("localhost:3000");
}

if (allowedHosts.size === 0) {
	throw new Error(
		'No allowed hosts available. When NODE_ENV is "production", either NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL or NEXT_PUBLIC_VERCEL_URL environment variables need to be set.',
	);
}

export const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
export const isSentryEnabled = !!sentryDsn;

export const mixpanelToken = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;
export const isMixpanelEnabled = !!mixpanelToken;
