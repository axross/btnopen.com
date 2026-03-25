import nextEnv from "@next/env";
import { defineConfig, devices } from "@playwright/test";

nextEnv.loadEnvConfig(process.cwd());

// biome-ignore-start lint/style/noProcessEnv: config needs to access env-vars
const isCI = !!process.env.CI;
const vercelUrl = process.env.NEXT_PUBLIC_VERCEL_URL
	? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
	: null;
// biome-ignore-end lint/style/noProcessEnv: config needs to access env-vars

export default defineConfig({
	testDir: "./e2e",
	fullyParallel: true,
	forbidOnly: isCI,
	retries: isCI ? 2 : 0,
	workers: isCI ? 1 : undefined,
	reporter: isCI ? "github" : "line",
	use: {
		baseURL: vercelUrl ?? "http://localhost:3000",
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
		isCI && vercelUrl
			? {
					command: `echo 'Using the Vercel URL: ${vercelUrl}'`,
					url: vercelUrl,
				}
			: {
					command: "npm run start",
					url: "http://localhost:3000",
					reuseExistingServer: true,
				},
});
