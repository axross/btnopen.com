import { clerk } from "@clerk/testing/playwright";
import type { Page } from "@playwright/test";

// The +clerk_test reader account the Clerk-authenticated comment tests sign in
// as; it must exist in the Clerk development instance (the `+clerk_test`
// subaddress makes Clerk suppress real email delivery). There is no default —
// the reader tests are defined only when TEST_CLERK_READER_EMAIL is set (see
// comments.test.ts), so an unset value skips them rather than signing in as a
// stand-in account.
// biome-ignore lint/style/noProcessEnv: using the Clerk test reader identity
const testReaderEmail = process.env.TEST_CLERK_READER_EMAIL;

/**
 * Establishes a Clerk reader session on `page` for the `+clerk_test` test
 * reader. `@clerk/testing` finds the user by email, mints a sign-in token
 * through the Clerk Backend API, and signs in with the ticket strategy — so it
 * needs no password or OAuth round-trip and works on the GitHub-OAuth-only
 * instance. It relies on the testing token prepared by `clerkSetup()` in the
 * Playwright global setup, so only call it in Clerk-configured runs.
 *
 * `clerk.signIn` requires a prior navigation to a page that loads Clerk, so this
 * helper visits the home page first; callers then navigate to the post they are
 * exercising, which picks up the established session.
 */
export async function signInAsReader({ page }: { page: Page }): Promise<void> {
	if (!testReaderEmail) {
		throw new Error(
			"TEST_CLERK_READER_EMAIL must be set to sign in the Clerk test reader.",
		);
	}

	await page.goto("/");
	await clerk.signIn({ page, emailAddress: testReaderEmail });
}
