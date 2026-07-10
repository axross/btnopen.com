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
		remotePatterns: [
			new URL("http://localhost:3000/api/**"),
			new URL("https://cdn.hashnode.com/res/hashnode/**"),
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
