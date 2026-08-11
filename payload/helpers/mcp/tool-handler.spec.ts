import type { PayloadRequest, TypedUser } from "payload";
import { describe, expect, it } from "vitest";
import z from "zod";
import {
	hasSignedInUser,
	mcpErrorResponse,
	mcpInvalidArgumentsResponse,
	mcpTextResponse,
} from "./tool-handler";

// hoisted because a regex literal rebuilt per call is recompiled per call.
const pathlessIssuePattern = /^Error: arguments: /;

function request(user: null | TypedUser): PayloadRequest {
	return { user } as unknown as PayloadRequest;
}

/** Fails the parse for every case below, so each one has a real `ZodError`. */
function issuesFor(schema: z.ZodType, value: unknown): z.ZodError {
	const parsed = schema.safeParse(value);

	if (parsed.success) {
		throw new Error("The fixture parsed successfully and produced no issues.");
	}

	return parsed.error;
}

describe("mcpTextResponse()", () => {
	it("answers with the payload as pretty-printed JSON", () => {
		expect(mcpTextResponse({ slug: "declarative-ui" })).toEqual({
			content: [{ type: "text", text: '{\n  "slug": "declarative-ui"\n}' }],
		});
	});
});

describe("mcpErrorResponse()", () => {
	// the transport gives a tool handler no error channel, so the prefix is the
	// whole of what marks a response as a failure.
	it("answers with the message behind the Error prefix", () => {
		expect(mcpErrorResponse("No blog post exists.")).toEqual({
			content: [{ type: "text", text: "Error: No blog post exists." }],
		});
	});
});

describe("mcpInvalidArgumentsResponse()", () => {
	it("names the failing argument's path", () => {
		const response = mcpInvalidArgumentsResponse(
			issuesFor(z.object({ slug: z.string() }), { slug: 1 }),
		);

		expect(response.content[0]?.text).toBe(
			"Error: slug: Invalid input: expected string, received number",
		);
	});

	it("puts one issue on each line", () => {
		const response = mcpInvalidArgumentsResponse(
			issuesFor(z.object({ slug: z.string(), draft: z.boolean() }), {}),
		);

		expect(response.content[0]?.text.split("\n")).toHaveLength(2);
	});

	// an issue with no path is a whole-object failure — a call that passed
	// something other than an object at all, most often — and has to read as
	// something rather than as an empty label.
	it("falls back to `arguments` for an issue carrying no path", () => {
		const response = mcpInvalidArgumentsResponse(
			issuesFor(z.object({ slug: z.string() }), "not an object"),
		);

		expect(response.content[0]?.text).toMatch(pathlessIssuePattern);
	});
});

describe("hasSignedInUser()", () => {
	it("reports a request bound to a user", () => {
		expect(hasSignedInUser(request({ id: 1 } as unknown as TypedUser))).toBe(
			true,
		);
	});

	// an API key's user is optional, so a request can look authenticated to the
	// transport and still carry no identity at all.
	it("reports a request carrying no user", () => {
		expect(hasSignedInUser(request(null))).toBe(false);
	});
});
