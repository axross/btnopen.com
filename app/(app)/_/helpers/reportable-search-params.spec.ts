import { describe, expect, it } from "@jest/globals";
import { pickReportableSearchParams } from "./reportable-search-params";

describe("pickReportableSearchParams()", () => {
	it("returns an empty object when the query string is empty", () => {
		expect(pickReportableSearchParams(new URLSearchParams(""))).toEqual({});
	});

	it("reports an allowlisted parameter", () => {
		expect(
			pickReportableSearchParams(new URLSearchParams("draft=true")),
		).toEqual({ draft: "true" });
	});

	it("reports every allowlisted parameter that is present", () => {
		expect(
			pickReportableSearchParams(
				new URLSearchParams("draft=true&agentic=true"),
			),
		).toEqual({ draft: "true", agentic: "true" });
	});

	it("omits a parameter that is not allowlisted", () => {
		expect(
			pickReportableSearchParams(new URLSearchParams("token=s3cret")),
		).toEqual({});
	});

	it("keeps an allowlisted parameter while dropping an unknown one alongside it", () => {
		expect(
			pickReportableSearchParams(
				new URLSearchParams("draft=true&token=s3cret"),
			),
		).toEqual({ draft: "true" });
	});

	it("reports the first value when an allowlisted parameter repeats", () => {
		expect(
			pickReportableSearchParams(new URLSearchParams("draft=true&draft=false")),
		).toEqual({ draft: "true" });
	});

	it("reports an allowlisted parameter present with an empty value", () => {
		expect(pickReportableSearchParams(new URLSearchParams("draft="))).toEqual({
			draft: "",
		});
	});

	it("omits a parameter whose name only contains an allowlisted one", () => {
		expect(
			pickReportableSearchParams(new URLSearchParams("draft-token=s3cret")),
		).toEqual({});
	});
});
