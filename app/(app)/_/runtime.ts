// biome-ignore-all lint/style/noProcessEnv: only place accessing env vars in public realm

import { resolveUrlOrigin } from "@/helpers/url-origin";

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

export const urlOrigin = resolveUrlOrigin({
	vercelEnvironment: process.env.NEXT_PUBLIC_VERCEL_ENV,
	productionUrl: process.env.VERCEL_PROJECT_PRODUCTION_URL,
	branchUrl: process.env.VERCEL_BRANCH_URL,
	deploymentUrl: process.env.VERCEL_URL,
});

export const isLocalhost = urlOrigin.includes("localhost");

export const vercelBlobToken =
	process.env.BLOB_PAYLOAD_READ_WRITE_TOKEN || null;

export const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
export const isSentryEnabled = !!sentryDsn;

export const mixpanelToken = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;
export const isMixpanelEnabled = !!mixpanelToken;

// Clerk brokers GitHub sign-in for comments. When the publishable key is absent
// (local dev without setup, CI, forked-PR previews), the comment auth UI is not
// mounted and the composer degrades to a disabled state — keeping build, tests,
// and unconfigured previews green without Clerk credentials.
export const clerkPublishableKey =
	process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || null;
export const isClerkEnabled = !!clerkPublishableKey;
