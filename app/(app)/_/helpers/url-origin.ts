/**
 * Environment inputs that determine the site's own origin. Values come from
 * Vercel's system environment variables; every field is optional because local
 * development defines none of them.
 */
export interface UrlOriginEnv {
	/** `NEXT_PUBLIC_VERCEL_ENV` — `"production"`, `"preview"`, etc. */
	vercelEnvironment: string | undefined;
	/** `VERCEL_PROJECT_PRODUCTION_URL` — the production domain (host only). */
	productionUrl: string | undefined;
	/** `VERCEL_BRANCH_URL` — the stable per-branch preview host. */
	branchUrl: string | undefined;
	/** `VERCEL_URL` — the unique per-deployment host. */
	deploymentUrl: string | undefined;
}

/**
 * Resolves the origin the app serves itself from, so server-side callers
 * (Payload hooks, metadata, sitemap) can build absolute URLs that point back at
 * this deployment.
 *
 * Production uses the stable production domain. Preview and branch deployments
 * prefer the branch host and fall back to the per-deployment host — either is
 * reachable from within the deployment's own serverless functions, unlike the
 * localhost fallback, which only exists during local development. Falling back
 * to localhost on a preview deployment makes self-directed fetches fail with
 * `ECONNREFUSED`.
 */
export function resolveUrlOrigin(env: UrlOriginEnv): string {
	if (env.vercelEnvironment === "production") {
		return `https://${env.productionUrl}`;
	}

	if (env.branchUrl) {
		return `https://${env.branchUrl}`;
	}

	if (env.deploymentUrl) {
		return `https://${env.deploymentUrl}`;
	}

	return "http://localhost:3000";
}
