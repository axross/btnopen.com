import nextEnv from "@next/env";
import { defineConfig, devices } from "@playwright/test";
import { urlOrigin } from "@/e2e/helpers/constants";

nextEnv.loadEnvConfig(process.cwd());

// biome-ignore-start lint/style/noProcessEnv: config needs to access env-vars
const isCI = !!process.env.CI;
// biome-ignore-end lint/style/noProcessEnv: config needs to access env-vars

export default defineConfig({
	testDir: "./e2e",
	fullyParallel: true,
	forbidOnly: isCI,
	retries: isCI ? 2 : 0,
	workers: isCI ? 1 : undefined,
	reporter: isCI ? "github" : "line",
	use: {
		baseURL: urlOrigin,
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
	projects: [
		{
			name: "Setup",
			testMatch: /.*\.setup\.test\.ts$/,
		},
		{
			name: "Pixel",
			use: { ...devices["Pixel 7"] },
			dependencies: ["Setup"],
		},
		// disabled these per-browser projects for now to reduce CI costs
		// {
		// 	name: "iPhone",
		// 	use: { ...devices["iPhone 15"] },
		// 	dependencies: ["Setup"],
		// },
		// {
		// 	name: "iPad",
		// 	use: { ...devices["iPad (gen 11)"] },
		// 	dependencies: ["Setup"],
		// },
		// {
		// 	name: "Desktop Chrome",
		// 	use: { ...devices["Desktop Chrome"] },
		// 	dependencies: ["Setup"],
		// },
		// {
		// 	name: "Desktop Edge",
		// 	use: { ...devices["Desktop Edge"] },
		// 	dependencies: ["Setup"],
		// },
	],
	webServer:
		isCI && !urlOrigin.includes("localhost")
			? {
					command: `echo 'Using the Vercel URL: ${urlOrigin}'`,
					url: urlOrigin,
				}
			: {
					command: "npm run start",
					url: "http://localhost:3000",
					reuseExistingServer: true,
				},
});
