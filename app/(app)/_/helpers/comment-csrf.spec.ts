import { describe, expect, it } from "@jest/globals";
import {
	COMMENT_CSRF_COOKIE,
	COMMENT_CSRF_HEADER,
	createCommentCsrfToken,
	hasMatchingCommentCsrfToken,
} from "./comment-csrf";

function request(headers: Record<string, string>): Request {
	return new Request("https://btnopen.com/posts/x/comments", { headers });
}

describe("createCommentCsrfToken()", () => {
	it("mints a non-empty, unique token each call", () => {
		const first = createCommentCsrfToken();
		const second = createCommentCsrfToken();

		expect(first).not.toBe("");
		expect(first).not.toBe(second);
	});
});

describe("hasMatchingCommentCsrfToken()", () => {
	it("accepts a request whose header matches its cookie", () => {
		const token = "11111111-2222-3333-4444-555555555555";

		expect(
			hasMatchingCommentCsrfToken(
				request({
					[COMMENT_CSRF_HEADER]: token,
					cookie: `${COMMENT_CSRF_COOKIE}=${token}`,
				}),
			),
		).toBe(true);
	});

	it("reads the token cookie alongside other cookies", () => {
		const token = "abc";

		expect(
			hasMatchingCommentCsrfToken(
				request({
					[COMMENT_CSRF_HEADER]: token,
					cookie: `session=xyz; ${COMMENT_CSRF_COOKIE}=${token}; theme=dark`,
				}),
			),
		).toBe(true);
	});

	it("rejects a header that does not match the cookie", () => {
		expect(
			hasMatchingCommentCsrfToken(
				request({
					[COMMENT_CSRF_HEADER]: "header-token",
					cookie: `${COMMENT_CSRF_COOKIE}=cookie-token`,
				}),
			),
		).toBe(false);
	});

	it("rejects a request missing the header", () => {
		expect(
			hasMatchingCommentCsrfToken(
				request({ cookie: `${COMMENT_CSRF_COOKIE}=token` }),
			),
		).toBe(false);
	});

	it("rejects a request missing the cookie", () => {
		expect(
			hasMatchingCommentCsrfToken(request({ [COMMENT_CSRF_HEADER]: "token" })),
		).toBe(false);
	});

	it("rejects a request with neither", () => {
		expect(hasMatchingCommentCsrfToken(request({}))).toBe(false);
	});
});
