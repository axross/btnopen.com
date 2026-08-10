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
		// the modules under test are server-realm modules that import
		// `server-only`, whose exports map answers the `react-server` condition
		// with an empty module and every other condition with one that throws on
		// import. declaring that condition globally — which this file did until
		// #179 — satisfies `server-only` but breaks `react-dom/server`, because it
		// answers the same condition with a module that throws on import in an RSC
		// realm. a subject needing both, as the markdown pipeline's spec does,
		// therefore resolves under no single global condition set, and Vite has no
		// per-package or per-file condition override.
		//
		// aliasing the specifier to the package's own empty stub is what
		// `next/jest` did before #230 replaced it, and it is the only arrangement
		// measured green across the whole suite. the trade is real and worth
		// naming: this is a fake standing in for a package, where the condition was
		// that package's own mechanism. what it costs is that `server-only` no
		// longer enforces anything under the unit runner — a client-realm module
		// importing it would fail in the build rather than here.
		alias: { "server-only": "./node_modules/server-only/empty.js" },
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
