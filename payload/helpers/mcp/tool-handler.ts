/**
 * What every MCP tool handler in this directory shares, whatever the tool
 * itself does: the two response shapes it answers with, how it reports
 * arguments it rejected, and how it decides whether its caller has an identity
 * at all.
 *
 * Each of these was written out inline in each tool before, which is how the
 * four handlers came to spell the same `Error: …` envelope and the same
 * zod-issue formatting four times. One definition means a change to what a
 * rejected call looks like is a change to one line rather than a search.
 */

import type { PayloadRequest } from "payload";
import type { ZodError } from "zod";
import type { McpTextResponse } from "./mcp-types";

/**
 * A tool's successful answer: its payload as pretty-printed JSON, which is what
 * makes a response legible in an agent's transcript.
 */
export function mcpTextResponse(payload: unknown): McpTextResponse {
	return {
		content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
	};
}

/**
 * A tool's failure. The MCP transport has no error channel a tool handler can
 * answer through, so a failure is an ordinary text response that says so — and
 * the `Error: ` prefix is the whole of the convention that marks it.
 */
export function mcpErrorResponse(message: string): McpTextResponse {
	return { content: [{ type: "text", text: `Error: ${message}` }] };
}

/**
 * A tool's failure when its arguments did not parse, one line per issue.
 *
 * The path is what tells the caller which argument to fix, and `arguments`
 * stands in for an issue that carries no path — a whole-object refinement,
 * or a call that passed something other than an object.
 */
export function mcpInvalidArgumentsResponse(error: ZodError): McpTextResponse {
	return mcpErrorResponse(
		error.issues
			.map(
				(issue) => `${issue.path.join(".") || "arguments"}: ${issue.message}`,
			)
			.join("\n"),
	);
}

/**
 * Whether this MCP request carries an identity at all.
 *
 * An API key's `user` is optional here — see `api-key-fields.ts` — so a request
 * can arrive with `req.user` absent and still look authenticated to the
 * transport. A tool serving anything that is not world-readable refuses that
 * request rather than answering it anonymously.
 */
export function hasSignedInUser(req: PayloadRequest): boolean {
	return Boolean(req.user);
}
