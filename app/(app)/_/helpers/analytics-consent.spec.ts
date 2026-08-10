import { describe, expect, it } from "vitest";
import { parseAnalyticsConsent } from "./analytics-consent";

describe("parseAnalyticsConsent()", () => {
	it("returns the decision for a granted value", () => {
		expect(parseAnalyticsConsent("granted")).toBe("granted");
	});

	it("returns the decision for a denied value", () => {
		expect(parseAnalyticsConsent("denied")).toBe("denied");
	});

	it("returns no decision for an absent value", () => {
		expect(parseAnalyticsConsent(undefined)).toBeNull();
	});

	it("returns no decision for a null value", () => {
		expect(parseAnalyticsConsent(null)).toBeNull();
	});

	it("returns no decision for an empty value", () => {
		expect(parseAnalyticsConsent("")).toBeNull();
	});

	it("returns no decision for an unrecognized value", () => {
		expect(parseAnalyticsConsent("yes")).toBeNull();
	});

	it("returns no decision for a value differing only in case", () => {
		expect(parseAnalyticsConsent("Granted")).toBeNull();
	});
});
