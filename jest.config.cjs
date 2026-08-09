const nextJest = require("next/jest");
const { compilerOptions } = require("./tsconfig.json");

const createJestConfig = nextJest({
	dir: "./",
});

const getPathPatternPrefixLength = (pathPattern) => {
	const wildcardIndex = pathPattern.indexOf("*");

	return wildcardIndex === -1 ? pathPattern.length : wildcardIndex;
};

const compilerOptionsPaths = Object.fromEntries(
	Object.entries(compilerOptions.paths).sort(
		([left], [right]) =>
			getPathPatternPrefixLength(right) - getPathPatternPrefixLength(left),
	),
);

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const mapTsconfigPathToJest = (pathPattern) =>
	`^${escapeRegExp(pathPattern).replace("\\*", "(.*)")}$`;

const leadingCurrentDirectoryPattern = /^\.\//;

const mapTsconfigTargetToJest = (target) =>
	`<rootDir>/${target
		.replace(leadingCurrentDirectoryPattern, "")
		.replace("*", "$1")}`;

/** @type {import("jest").Config} */
const customJestConfig = {
	clearMocks: true,
	moduleNameMapper: Object.fromEntries(
		Object.entries(compilerOptionsPaths).map(([pathPattern, targets]) => [
			mapTsconfigPathToJest(pathPattern),
			mapTsconfigTargetToJest(targets[0]),
		]),
	),
	testEnvironment: "node",
	testMatch: [
		"<rootDir>/payload/**/*.spec.ts",
		"<rootDir>/app/**/*.spec.ts",
		"<rootDir>/shared/**/*.spec.ts",
	],
};

// `next/jest` sets `transformIgnorePatterns` so nothing under `node_modules` is
// ever transformed, and it only *appends* a custom config's entries to its own
// rather than letting them replace it — so the pattern cannot be narrowed
// through the config it accepts. the whole markdown toolchain (`unified`,
// `remark-*`, `rehype-*`, `mdast-util-*`, `micromark*`, `shiki`, `@shikijs/*`)
// is ESM-only, so importing `app/(app)/_/helpers/markdown.ts` under Jest fails
// with "Cannot use import statement outside a module" while they stay ignored.
// post-process the resolved config instead: drop the `node_modules` entries and
// keep the CSS-module one. the alternative — listing the ~40 packages in
// `transpilePackages` in `next.config.ts` — would change the production build to
// solve a test-runner problem, and would have to track every transitive
// dependency of the toolchain.
const isNodeModulesPattern = (pattern) => pattern.includes("node_modules");

// `createJestConfig(...)` resolves asynchronously, so the export is an async
// function Jest awaits rather than a plain object.
module.exports = async () => {
	const resolvedConfig = await createJestConfig(customJestConfig)();

	return {
		...resolvedConfig,
		transformIgnorePatterns: resolvedConfig.transformIgnorePatterns.filter(
			(pattern) => !isNodeModulesPattern(pattern),
		),
	};
};
