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
	fullyParallel: true,
	forbidOnly: isCI,
	retries: isCI ? 2 : 0,
	workers: isCI ? 1 : undefined,
	reporter: isCI ? "github" : "line",
	use: {
		baseURL: baseUrl ?? "http://localhost:3000",
		extraHTTPHeaders: vercelAutomationBypassSecret
			? {
					"x-vercel-protection-bypass": vercelAutomationBypassSecret,
					"x-vercel-set-bypass-cookie": "true",
				}
			: {},
		trace: {
			mode: "retain-on-failure",
			screenshots: true,
			snapshots: true,
			sources: true,
			attachments: true,
		},
		screenshot: "on-first-failure",
		video: "retain-on-failure",
	},
	outputDir: ".playwright-results",
	snapshotPathTemplate:
		"e2e/{testFileDir}/__snapshots__/{testFileName}{/projectName}/{arg}{ext}",
	projects: [
		{
			name: "setup",
			testMatch: "**/setup.test.ts",
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
