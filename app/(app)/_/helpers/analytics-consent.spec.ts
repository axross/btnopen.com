import { describe, expect, it } from "vitest";
import {
	parseAnalyticsConsent,
	readAnalyticsConsentCookie,
} from "./analytics-consent";

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

describe("readAnalyticsConsentCookie()", () => {
	it("returns no decision for an empty cookie string", () => {
		expect(readAnalyticsConsentCookie("")).toBeNull();
	});

	it("reads the decision from a lone cookie", () => {
		expect(readAnalyticsConsentCookie("btn-analytics-consent=granted")).toBe(
			"granted",
		);
	});

	it("reads the decision from among other cookies", () => {
		expect(
			readAnalyticsConsentCookie(
				"NEXT_LOCALE=ja-JP; btn-analytics-consent=denied; other=1",
			),
		).toBe("denied");
	});

	it("returns no decision when the cookie is absent", () => {
		expect(readAnalyticsConsentCookie("NEXT_LOCALE=ja-JP")).toBeNull();
	});

	it("returns no decision when the cookie holds an unrecognized value", () => {
		expect(
			readAnalyticsConsentCookie("btn-analytics-consent=maybe"),
		).toBeNull();
	});

	it("returns no decision when the cookie holds no value", () => {
		expect(readAnalyticsConsentCookie("btn-analytics-consent=")).toBeNull();
	});

	it("ignores a cookie whose name merely ends with the consent cookie's name", () => {
		expect(
			readAnalyticsConsentCookie("not-btn-analytics-consent=granted"),
		).toBeNull();
	});

	it("ignores a pair carrying no separator", () => {
		expect(
			readAnalyticsConsentCookie("broken; btn-analytics-consent=granted"),
		).toBe("granted");
	});

	it("reads a value carrying an equals sign without truncating the name match", () => {
		expect(
			readAnalyticsConsentCookie("btn-analytics-consent=granted=extra"),
		).toBeNull();
	});
});
