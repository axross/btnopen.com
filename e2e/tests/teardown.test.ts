import { test } from "@playwright/test";
import { authenticateWithTestUser } from "../helpers/api/auth";
import { cleanupMcpE2eApiKey } from "../helpers/api/mcp";

test("Clean up the MCP e2e API key", async ({ page }, testInfo) => {
	await authenticateWithTestUser({ page, testInfo });

	await test.step("Delete the provisioned MCP e2e API key", async () => {
		await cleanupMcpE2eApiKey({ page, testInfo });
	});
});
