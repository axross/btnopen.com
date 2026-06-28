import { test } from "@playwright/test";
import { authenticatedStorageState } from "../helpers/api/auth";
import { cleanupMcpApiKey } from "../helpers/api/mcp";

test.use({ storageState: authenticatedStorageState });

test("Clean up the MCP API key", async ({ page }, testInfo) => {
	await cleanupMcpApiKey({ page, testInfo });
});
