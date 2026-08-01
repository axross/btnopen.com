import { describe, expect, it } from "@jest/globals";
import {
	buildCommentThreads,
	CommentSubmission,
	isReplyToReply,
	MAX_COMMENT_BODY_LENGTH,
	type ThreadableComment,
} from "./comments";

function comment(
	id: string,
	parentId: string | null,
	status: ThreadableComment["status"],
): ThreadableComment {
	return { id, parentId, status };
}

describe("CommentSubmission", () => {
	it("accepts a plain body and trims surrounding whitespace", () => {
		const result = CommentSubmission.safeParse({ body: "  hello  " });

		expect(result.success).toBe(true);
		expect(result.data?.body).toBe("hello");
	});

	it("rejects an empty or whitespace-only body", () => {
		expect(CommentSubmission.safeParse({ body: "" }).success).toBe(false);
		expect(CommentSubmission.safeParse({ body: "   " }).success).toBe(false);
	});

	it("rejects a body longer than the limit", () => {
		const tooLong = "a".repeat(MAX_COMMENT_BODY_LENGTH + 1);

		expect(CommentSubmission.safeParse({ body: tooLong }).success).toBe(false);
	});

	it("ignores parent and authorReply so readers cannot forge a reply", () => {
		const result = CommentSubmission.safeParse({
			body: "hi",
			parent: "abc",
			authorReply: true,
		});

		expect(result.success).toBe(true);
		expect(result.data).toEqual({ body: "hi" });
	});
});

describe("buildCommentThreads()", () => {
	it("returns approved top-level comments in input order", () => {
		const threads = buildCommentThreads([
			comment("a", null, "approved"),
			comment("b", null, "approved"),
		]);

		expect(threads.map((thread) => thread.id)).toEqual(["a", "b"]);
		expect(threads.every((thread) => thread.comment !== null)).toBe(true);
	});

	it("omits pending and rejected top-level comments with no replies", () => {
		const threads = buildCommentThreads([
			comment("a", null, "pending"),
			comment("b", null, "rejected"),
		]);

		expect(threads).toEqual([]);
	});

	it("nests only approved replies under their parent", () => {
		const threads = buildCommentThreads([
			comment("a", null, "approved"),
			comment("r1", "a", "approved"),
			comment("r2", "a", "pending"),
		]);

		expect(threads).toHaveLength(1);
		expect(threads[0].replies.map((reply) => reply.id)).toEqual(["r1"]);
	});

	it("keeps a hidden parent as a placeholder when it still has an approved reply", () => {
		const threads = buildCommentThreads([
			comment("a", null, "rejected"),
			comment("r1", "a", "approved"),
		]);

		expect(threads).toHaveLength(1);
		expect(threads[0].comment).toBeNull();
		expect(threads[0].replies.map((reply) => reply.id)).toEqual(["r1"]);
	});

	it("does not attach a reply to a hidden parent that has no visible reply", () => {
		const threads = buildCommentThreads([
			comment("a", null, "rejected"),
			comment("r1", "a", "pending"),
		]);

		expect(threads).toEqual([]);
	});
});

describe("isReplyToReply()", () => {
	it("is false for a top-level parent", () => {
		expect(isReplyToReply({ parent: null })).toBe(false);
		expect(isReplyToReply({})).toBe(false);
	});

	it("is true when the parent already has a parent", () => {
		expect(isReplyToReply({ parent: "some-id" })).toBe(true);
	});

	it("is false for a missing parent", () => {
		expect(isReplyToReply(null)).toBe(false);
		expect(isReplyToReply(undefined)).toBe(false);
	});
});
