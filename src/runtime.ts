let resolvedRuntimeType: "client" | "node" | "edge" | "unknown" = "unknown";

if (typeof globalThis.window !== "undefined") {
	resolvedRuntimeType = "client";
} else if (process.env.NEXT_RUNTIME === "nodejs") {
	resolvedRuntimeType = "node";
} else if (process.env.NEXT_RUNTIME === "edge") {
	resolvedRuntimeType = "edge";
}

export const runtimeType = resolvedRuntimeType;

export const isDevelopment = process.env.NODE_ENV === "development";

export const isSentryEnabled = !!process.env.NEXT_PUBLIC_SENTRY_DSN;
export const isMixpanelEnabled = !!process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;
