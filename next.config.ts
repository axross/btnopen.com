import { withPayload } from "@payloadcms/next/withPayload";
import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin(
	"./app/(app)/_/helpers/i18n-request.ts",
);

// Vercel caps a custom deployment ID at 32 characters.
const maxDeploymentIdLength = 32;

// biome-ignore-start lint/style/noProcessEnv: nextjs config needs to access env vars
const isCi = !!process.env.CI;
const sentryOrg = process.env.SENTRY_ORG;
const sentryProject = process.env.SENTRY_PROJECT;
// A custom deployment ID (the commit SHA, injected by the deploy workflows) so
// Skew Protection keeps working when the app is built on CI with `vercel build`
// and shipped with `vercel deploy --prebuilt`: the prebuilt flow cannot inherit
// Vercel's auto-assigned deployment ID, so the build bakes this one into
// routes-manifest.json and the client's skew-protected `?dpl=` requests. The
// 40-character commit SHA is truncated to Vercel's limit. Unset outside the
// deploy workflows (local dev, tests), where `undefined` leaves Next.js on its
// default behavior.
const deploymentId = process.env.DEPLOYMENT_ID?.slice(0, maxDeploymentIdLength);
// biome-ignore-end lint/style/noProcessEnv: nextjs config needs to access env vars

const nextConfig: NextConfig = {
	deploymentId,
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

// options nested under withSentryConfig's `webpack` key apply only to a webpack
// build, and `next build` on Next.js 16 runs Turbopack, so the block that used
// to sit here never took effect. Neither of its options is replaced, because
// neither has a working Turbopack equivalent:
// - `automaticVercelMonitors` selects a Pages-Router-only strategy and reads
//   cron jobs from vercel.json, which this repository does not have. Vercel cron
//   monitors are therefore not wired up; wire them up deliberately if a cron job
//   is ever added.
// - `treeshake.removeDebugLogging` becomes webpack DefinePlugin defines.
//   `bundleSizeOptimizations` looks like the bundler-agnostic equivalent but is
//   not: the SDK only hands it to the post-compile hook, which never applies the
//   replacements. Sentry's debug logging therefore stays in the bundle, as it
//   already did while the option was inert.
// the options below all apply to Turbopack builds.
export default withSentryConfig(withPayload(withNextIntl(nextConfig)), {
	org: sentryOrg,
	project: sentryProject,
	silent: !isCi,
	widenClientFileUpload: true,
	tunnelRoute: "/monitoring",
});
