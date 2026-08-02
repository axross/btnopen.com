import { describe, expect, it } from "@jest/globals";
import { resolveUrlOrigin } from "./url-origin";

describe("resolveUrlOrigin()", () => {
	it("uses the production domain on production deployments", () => {
		expect(
			resolveUrlOrigin({
				vercelEnvironment: "production",
				productionUrl: "btnopen.com",
				branchUrl: "btnopen-git-main.vercel.app",
				deploymentUrl: "btnopen-abc123.vercel.app",
			}),
		).toBe("https://btnopen.com");
	});

	it("uses the branch host on preview deployments", () => {
		expect(
			resolveUrlOrigin({
				vercelEnvironment: "preview",
				productionUrl: "btnopen.com",
				branchUrl: "btnopen-git-feature.vercel.app",
				deploymentUrl: "btnopen-abc123.vercel.app",
			}),
		).toBe("https://btnopen-git-feature.vercel.app");
	});

	it("falls back to the per-deployment host when no branch host is set", () => {
		expect(
			resolveUrlOrigin({
				vercelEnvironment: "preview",
				productionUrl: "btnopen.com",
				branchUrl: undefined,
				deploymentUrl: "btnopen-abc123.vercel.app",
			}),
		).toBe("https://btnopen-abc123.vercel.app");
	});

	it("falls back to localhost during local development", () => {
		expect(
			resolveUrlOrigin({
				vercelEnvironment: undefined,
				productionUrl: undefined,
				branchUrl: undefined,
				deploymentUrl: undefined,
			}),
		).toBe("http://localhost:3000");
	});

	it("prefers the production domain over any preview host", () => {
		expect(
			resolveUrlOrigin({
				vercelEnvironment: "production",
				productionUrl: "btnopen.com",
				branchUrl: undefined,
				deploymentUrl: undefined,
			}),
		).toBe("https://btnopen.com");
	});
});
