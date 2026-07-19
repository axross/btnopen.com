import { withPayload } from "@payloadcms/next/withPayload";
import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin(
	"./app/(app)/_/helpers/i18n-request.ts",
);

// biome-ignore-start lint/style/noProcessEnv: nextjs config needs to access env vars
const isCi = !!process.env.CI;
const sentryOrg = process.env.SENTRY_ORG;
const sentryProject = process.env.SENTRY_PROJECT;
// biome-ignore-end lint/style/noProcessEnv: nextjs config needs to access env vars

const nextConfig: NextConfig = {
	reactCompiler: true,
	cacheComponents: true,
	images: {
		// defining localPatterns makes it an exhaustive allowlist: every local
		// next/image src must match an entry. The three upload-serving endpoints
		// omit `search` because preview deployments append `?prefix=pr-<n>` (the
		// per-PR blob namespace, absent in production), which an exact-match
		// `search` cannot express; without these entries, next/image rejects any
		// local src that carries a query string, blanking every image on previews.
		localPatterns: [
			{ pathname: "/api/media/file/**" },
			{ pathname: "/api/cover-images/file/**" },
			{ pathname: "/api/avatar-images/file/**" },
			{ pathname: "/images/**", search: "" },
		],
		remotePatterns: [
			new URL("http://localhost:3000/api/**"),
			new URL("https://cdn.hashnode.com/res/hashnode/**"),
			// Commenter avatars: Clerk serves/proxies them from img.clerk.com;
			// GitHub's own avatar host is allowed for snapshots that point there.
			new URL("https://img.clerk.com/**"),
			new URL("https://avatars.githubusercontent.com/**"),
		],
	},
	serverExternalPackages: ["re2", "pino", "pino-pretty"],
	experimental: {
		viewTransition: true,
		globalNotFound: true,
	},
	headers: () => [
		{
			source: "/:path*",
			headers: [
				{ key: "Accept-CH", value: "Sec-CH-Prefers-Color-Scheme" },
				{ key: "Critical-CH", value: "Sec-CH-Prefers-Color-Scheme" },
				{ key: "Vary", value: "Sec-CH-Prefers-Color-Scheme" },
			],
		},
	],
};

export default withSentryConfig(withPayload(withNextIntl(nextConfig)), {
	org: sentryOrg,
	project: sentryProject,
	silent: !isCi,
	widenClientFileUpload: true,
	tunnelRoute: "/monitoring",
	webpack: {
		automaticVercelMonitors: true,
		treeshake: {
			removeDebugLogging: true,
		},
	},
});
