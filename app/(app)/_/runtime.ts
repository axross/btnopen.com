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
export const isProduction = process.env.NODE_ENV === "production";

export const urlOrigin = process.env.NEXT_PUBLIC_VERCEL_URL
	? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
	: "http://localhost:3000";

export const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
export const isSentryEnabled = !!sentryDsn;

export const mixpanelToken = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;
export const isMixpanelEnabled = !!mixpanelToken;
