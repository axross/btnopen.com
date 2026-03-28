import nextEnv from "@next/env";
import { defineConfig, devices } from "@playwright/test";

nextEnv.loadEnvConfig(process.cwd());

// biome-ignore-start lint/style/noProcessEnv: config needs to access env-vars
const isCI = !!process.env.CI;
const baseUrl = process.env.PLAYWRIGHT_BASE_URL;
const vercelAutomationBypassSecret =
	process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
// biome-ignore-end lint/style/noProcessEnv: config needs to access env-vars

export default defineConfig({
	testDir: "./e2e",
	reporter: isCI ? "github" : "list",
	outputDir: ".playwright-results",

	// restrict workers to 1 on GitHub Actions to reduce costs
	workers: isCI ? 1 : undefined,

	// repeat 2 times to detect potential flakiness
	repeatEach: 2,
	failOnFlakyTests: true,

	// disallow .skip() or .only() tests on CI
	forbidOnly: isCI,

	// place snapshots closer to the test files
	snapshotPathTemplate:
		"e2e/{testFileDir}/__snapshots__/{testFileName}{/projectName}/{arg}{ext}",

	use: {
		baseURL: baseUrl ?? "http://localhost:3000",
		trace: {
			mode: "retain-on-first-failure",
			screenshots: true,
			snapshots: true,
			sources: true,
			attachments: true,
		},
		video: "on-first-retry",

		// set vercel-specific http headers for bypassing access protection
		extraHTTPHeaders: vercelAutomationBypassSecret
			? {
					"x-vercel-protection-bypass": vercelAutomationBypassSecret,
					"x-vercel-set-bypass-cookie": "true",
				}
			: {},
	},
	projects: [
		{
			name: "setup",
			testMatch: "**/setup.test.ts",
			repeatEach: 1,
		},
		{
			name: "pixel",
			use: devices["Pixel 7"],
			dependencies: ["setup"],
		},
		// disabled these per-browser projects for now to reduce CI costs
		// {
		// 	name: "iphone",
		// 	use: { ...devices["iPhone 15"] },
		// 	dependencies: ["setup"],
		// },
		// {
		// 	name: "ipad",
		// 	use: { ...devices["iPad (gen 11)"] },
		// 	dependencies: ["setup"],
		// },
		// {
		// 	name: "desktop-chrome",
		// 	use: { ...devices["Desktop Chrome"] },
		// 	dependencies: ["setup"],
		// },
		// {
		// 	name: "desktop-edge",
		// 	use: { ...devices["Desktop Edge"] },
		// 	dependencies: ["setup"],
		// },
	],
	webServer:
		isCI && baseUrl
			? {
					command: `echo 'Using the Vercel URL: ${baseUrl}'`,
					url: baseUrl,
					reuseExistingServer: true,
				}
			: {
					command: "npm run dev",
					url: "http://localhost:3000",
					reuseExistingServer: true,
				},
});
