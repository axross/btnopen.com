import { defaultServerConditions } from "vite";
import { defineConfig } from "vitest/config";

// this project builds with Next.js on Turbopack, so it has no vite.config.ts for
// a `test` block to live in — Vite is present only as the unit runner's engine,
// and this file is the whole of its configuration.
export default defineConfig({
	resolve: {
		// resolves the `@/*` aliases from tsconfig.json rather than restating them,
		// so the compiler and the runner cannot disagree about where an import
		// points
		tsconfigPaths: true,
	},
	ssr: {
		resolve: {
			// the modules under test are server-realm modules that import
			// `server-only`, whose own exports map answers the `react-server`
			// condition with an empty module and every other condition with one that
			// throws on import. `next/jest` neutralized it by mapping the specifier
			// to a stub; declaring the realm resolves it through the package's own
			// mechanism instead. the defaults are spread back in because this option
			// replaces them rather than extending them.
			conditions: ["react-server", ...defaultServerConditions],
		},
	},
	test: {
		clearMocks: true,
		environment: "node",
		// anchored to the three directories that hold colocated specs: it keeps
		// build output out of discovery, which Vitest 4 no longer excludes by
		// default, and keeps the Playwright suite's `*.test.ts` files under `e2e/`
		// out of this runner entirely
		include: [
			"payload/**/*.spec.ts",
			"app/**/*.spec.ts",
			"shared/**/*.spec.ts",
		],
		restoreMocks: true,
	},
});
