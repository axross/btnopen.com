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
export const vercelEnvironment =
	process.env.NEXT_PUBLIC_VERCEL_ENV ?? "unknown";

export const sha = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ?? "unknown";

export let urlOrigin: string;

if (vercelEnvironment === "production") {
	urlOrigin = `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
} else {
	urlOrigin = "http://localhost:3000";
}

export const isLocalhost = urlOrigin.includes("localhost");

export const vercelBlobToken =
	process.env.BLOB_PAYLOAD_READ_WRITE_TOKEN || null;

export const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
export const isSentryEnabled = !!sentryDsn;

export const mixpanelToken = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;
export const isMixpanelEnabled = !!mixpanelToken;
