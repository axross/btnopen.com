import { clerkSetup } from "@clerk/testing/playwright";
import nextEnv from "@next/env";

/**
 * Playwright global setup. Runs once in the main process before any test worker
 * is spawned, so the Clerk testing token that `clerkSetup()` fetches (onto
 * `process.env.CLERK_TESTING_TOKEN`) is inherited by every worker — a `setup`
 * test project runs inside a worker and could not share it.
 */
// biome-ignore lint/style/noDefaultExport: Playwright resolves globalSetup from this module's default export
export default async function globalSetup(): Promise<void> {
	// load .env* exactly as playwright.config.ts does, so the Clerk keys are
	// available here regardless of module import order.
	nextEnv.loadEnvConfig(process.cwd());

	// only prepare Clerk testing tokens when Clerk is configured — the app's
	// `isClerkAvailable` signal, the publishable key. Unconfigured runs (local
	// without setup, PR CI, forked previews) skip Clerk entirely, so the suite
	// stays green without Clerk credentials.
	//
	// this deliberately does not read CLERK_SECRET_KEY (security-conventions.md
	// forbids reading it anywhere in the repo): clerkSetup() reads and validates
	// the secret from the environment itself and throws if it is missing or a
	// production key, so the secret stays the library's concern.
	// biome-ignore lint/style/noProcessEnv: env-driven gate mirroring runtime `isClerkAvailable`
	if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
		return;
	}

	// clerkSetup() reads NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY + CLERK_SECRET_KEY from
	// the environment and stores the fetched testing token on
	// process.env.CLERK_TESTING_TOKEN. It throws on a production secret key,
	// pinning the suite to a development instance.
	await clerkSetup();
}
