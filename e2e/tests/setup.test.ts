import { test } from "@playwright/test";
import {
	authenticatedStorageState,
	authenticateWithTestUser,
} from "../helpers/api/auth";

test("Authenticate with the test user", async ({ page }, testInfo) => {
	await authenticateWithTestUser({ page, testInfo });

	await page.context().storageState({ path: authenticatedStorageState });
});
