// biome-ignore-all lint/style/noProcessEnv: only place accessing env vars in payload realm

import { resolveUrlOrigin } from "@/shared/url-origin";

/**
 * the origin this deployment serves itself from, for the absolute URLs the
 * cache-invalidation hooks and the admin live-preview link build.
 *
 * The Payload realm resolves this itself rather than importing the app's
 * `runtime.ts`: `payload/config.ts` is loaded by the Payload CLI outside Next's
 * bundler, so the realm must not depend on a module that may gain Next-only
 * imports. Both barrels call the same shared resolver, so the two never drift.
 */
export const urlOrigin = resolveUrlOrigin({
	vercelEnvironment: process.env.NEXT_PUBLIC_VERCEL_ENV,
	productionUrl: process.env.VERCEL_PROJECT_PRODUCTION_URL,
	branchUrl: process.env.VERCEL_BRANCH_URL,
	deploymentUrl: process.env.VERCEL_URL,
});

/**
 * Vercel Blob credential. Present on production and preview deployments; absent
 * locally, where uploads fall back to disk.
 */
export const vercelBlobToken =
	process.env.BLOB_PAYLOAD_READ_WRITE_TOKEN || null;
