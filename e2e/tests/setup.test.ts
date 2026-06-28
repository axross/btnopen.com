import { test } from "@playwright/test";
import {
	authenticatedStorageState,
	authenticateWithTestUser,
} from "../helpers/api/auth";
import { provisionMcpApiKey } from "../helpers/api/mcp";

test("Authenticate with the test user", async ({ page }, testInfo) => {
	await authenticateWithTestUser({ page, testInfo });

	await page.context().storageState({ path: authenticatedStorageState });
});

test.describe("MCP API key", () => {
	test.use({ storageState: authenticatedStorageState });

	test("Provision the MCP API key", async ({ page }, testInfo) => {
		await provisionMcpApiKey({ page, testInfo });
	});
});
