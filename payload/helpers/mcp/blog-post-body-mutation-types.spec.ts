import { describe, expect, it } from "@jest/globals";
import z from "zod";
import { BlogPostBodyMutationParametersBase } from "./blog-post-body-mutation-types";

const Parameters = z.object(BlogPostBodyMutationParametersBase);
const fractionalLocationIndex = 1.5;

describe("BlogPostBodyMutationParametersBase", () => {
	it("applies locale and draft defaults when optional parameters are omitted", () => {
		const params = Parameters.parse({
			slug: "hello-world",
			location: [0],
		});

		expect(params.locale).toBe("ja-JP");
		expect(params.draft).toBe(false);
	});

	it("accepts explicit locale, draft, and nested location when provided", () => {
		const params = Parameters.parse({
			slug: "hello-world",
			location: [0, 1, -1],
			locale: "en-US",
			draft: true,
		});

		expect(params.location).toEqual([0, 1, -1]);
		expect(params.locale).toBe("en-US");
		expect(params.draft).toBe(true);
	});

	describe("when location is invalid", () => {
		it("rejects an empty location array", () => {
			expect(() => {
				Parameters.parse({
					slug: "hello-world",
					location: [],
				});
			}).toThrow(z.ZodError);
		});

		it("rejects fractional location indexes", () => {
			expect(() => {
				Parameters.parse({
					slug: "hello-world",
					location: [fractionalLocationIndex],
				});
			}).toThrow(z.ZodError);
		});
	});
});
