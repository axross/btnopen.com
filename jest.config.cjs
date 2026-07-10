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
		"<rootDir>/payload/helpers/mcp/**/*.spec.ts",
		"<rootDir>/app/**/*.spec.ts",
	],
};

module.exports = createJestConfig(customJestConfig);
