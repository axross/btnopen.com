import { test } from "@playwright/test";
import {
	authenticatedStorageState,
	authenticateWithTestUser,
} from "../helpers/api/auth";
import { provisionMcpE2eApiKey } from "../helpers/api/mcp";

test("Authenticate with the test user", async ({ page }, testInfo) => {
	await authenticateWithTestUser({ page, testInfo });

	await page.context().storageState({ path: authenticatedStorageState });

	await test.step("Provision the MCP e2e API key", async () => {
		await provisionMcpE2eApiKey({ page, testInfo });
	});
});
