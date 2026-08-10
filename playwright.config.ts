import nextEnv from "@next/env";
import { defineConfig, devices } from "@playwright/test";

nextEnv.loadEnvConfig(process.cwd());

// biome-ignore-start lint/style/noProcessEnv: config needs to access env-vars
const isCI = !!process.env.CI;
const baseUrl = process.env.PLAYWRIGHT_BASE_URL;
const vercelAutomationBypassSecret =
	process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
// compared by equality so an empty value is safely non-production: `.env.example`
// is copied verbatim to `.env.local` in cloud sessions, so a blank line must not
// flip the suite onto the slower production server.
const isProductionServer = process.env.PLAYWRIGHT_SERVER_MODE === "production";
// biome-ignore-end lint/style/noProcessEnv: config needs to access env-vars

// the suite serves itself two ways locally: from a production build when
// PLAYWRIGHT_SERVER_MODE is "production" — the mode the Check and Deploy
// workflow sets, so `main` exercises cacheComponents and reactCompiler the way
// production does — and from `next dev` otherwise, which is what every local and
// pull-request run uses.
const localWebServer = isProductionServer
	? {
			command: "npm run build && npm run start",
			url: "http://localhost:3000",
			// this command builds before it serves, which overruns playwright's 60s
			// default on a cold cache.
			timeout: 300_000,
			// never adopt an already-running server here. a stray `npm run dev` on
			// the same port would be served instead, and the run would pass while
			// proving nothing about the production build this mode exists to test.
			reuseExistingServer: false,
		}
	: {
			command: "npm run dev",
			url: "http://localhost:3000",
			reuseExistingServer: true,
		};

export default defineConfig({
	testDir: "./e2e/tests",
	// Runs once in the main process before any worker: fetches the Clerk testing
	// token when the dev-instance keys are set, and is a no-op otherwise so the
	// suite still runs without Clerk configured.
	globalSetup: "./e2e/global-setup.ts",
	// keep the default terminal reporter (github annotations on CI, list locally)
	// and append the scenario-coverage reporter — it only tallies @scenario: tags
	// against e2e/scenarios.md, so it adds no measurable cost to the default run.
	reporter: [
		[isCI ? "github" : "list"],
		["./e2e/reporters/scenario-coverage.ts"],
	],
	outputDir: ".playwright-results",

	// restrict workers to 1 on GitHub Actions to reduce costs
	workers: isCI || !baseUrl ? 1 : undefined,

	// repeat 2 times to detect potential flakiness
	repeatEach: 2,
	failOnFlakyTests: true,

	// disallow .skip() or .only() tests on CI
	forbidOnly: isCI,

	// place snapshots closer to the test files
	snapshotPathTemplate:
		"e2e/tests/{testFileDir}/__snapshots__/{testFileName}{/platform}/{projectName}-{arg}{ext}",

	use: {
		baseURL: baseUrl ?? "http://localhost:3000",
		// pin the negotiated locale so the suite renders the Japanese-primary
		// site deterministically; locale-specific behavior is covered explicitly
		// in e2e/tests/content-negotiation.test.ts.
		locale: "ja-JP",
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
			teardown: "cleanup",
			repeatEach: 1,
		},
		{
			name: "cleanup",
			testMatch: "**/teardown.test.ts",
			repeatEach: 1,
		},
		// two device projects, one per responsive tier the design defines a
		// structural transformation across (see docs/specs/reader-surfaces.md):
		// `pixel` at 412px for mobile, `tablet` at 712px for tablet. both run on chromium,
		// the only engine CI installs. the desktop tier is deliberately uncovered —
		// it changes density, not structure, and a third project would add another
		// serialized pass for that alone.
		{
			name: "pixel",
			// the setup/teardown files belong to the setup/cleanup projects; keep
			// device projects from re-running them as ordinary tests.
			testIgnore: ["**/setup.test.ts", "**/teardown.test.ts"],
			use: devices["Pixel 7"],
			dependencies: ["setup"],
		},
		{
			name: "tablet",
			testIgnore: ["**/setup.test.ts", "**/teardown.test.ts"],
			// Galaxy Tab S4 is 712x1138 and chromium-backed. the iPad descriptors sit
			// in the same tier but default to webkit, which would mean installing a
			// second engine and reading every future snapshot diff as a mix of engine
			// and width differences.
			use: devices["Galaxy Tab S4"],
			dependencies: ["setup"],
		},
	],
	webServer:
		isCI && baseUrl
			? {
					command: `echo 'Using the Vercel URL: ${baseUrl}'`,
					url: baseUrl,
					reuseExistingServer: true,
				}
			: localWebServer,
});
