import z from "zod";

/** Upper bound on a comment body, enforced on submission and in the schema. */
export const MAX_COMMENT_BODY_LENGTH = 2000;

/**
 * Shape a reader is allowed to submit. Only `body` is accepted — `parent` and
 * `authorReply` are deliberately absent so a reader can never create a reply or
 * an author-badged comment through the public endpoint (privilege guard).
 */
export const CommentSubmission = z
	.object({
		body: z
			.string()
			.trim()
			.min(1)
			.max(MAX_COMMENT_BODY_LENGTH)
			.describe("Plain-text comment body."),
	})
	.describe("Reader-submitted top-level comment.");

export type CommentSubmission = z.infer<typeof CommentSubmission>;

/** Moderation state of a comment. Only `approved` is publicly visible. */
export type CommentStatus = "pending" | "approved" | "rejected";

/** Minimal fields the thread builder needs to place a row. */
export interface ThreadableComment {
	id: string;
	parentId: string | null;
	status: CommentStatus;
}

/**
 * One rendered top-level entry: the reader comment (or `null` when the parent
 * was hidden but is kept as a placeholder to preserve its author replies) plus
 * its author replies, in input order.
 */
export interface CommentThread<T extends ThreadableComment> {
	id: string;
	comment: T | null;
	replies: T[];
}

/**
 * Groups a flat, pre-ordered comment list into one-level threads for rendering.
 *
 * - Replies (rows with a `parentId`) attach to their parent only when approved.
 * - A top-level row renders when it is approved, or — when it is hidden but
 *   still has approved replies — as a placeholder (`comment: null`) so the
 *   author's replies keep their context. A hidden top-level row with no visible
 *   reply is dropped entirely.
 *
 * Input order is preserved for both top-level entries and replies, so ordering
 * is decided by the caller's query rather than here.
 */
export function buildCommentThreads<T extends ThreadableComment>(
	rows: readonly T[],
): CommentThread<T>[] {
	const repliesByParent = new Map<string, T[]>();

	for (const row of rows) {
		if (row.parentId === null || row.status !== "approved") {
			continue;
		}

		const siblings = repliesByParent.get(row.parentId) ?? [];
		siblings.push(row);
		repliesByParent.set(row.parentId, siblings);
	}

	const threads: CommentThread<T>[] = [];

	for (const row of rows) {
		if (row.parentId !== null) {
			continue;
		}

		const replies = repliesByParent.get(row.id) ?? [];

		if (row.status === "approved") {
			threads.push({ id: row.id, comment: row, replies });
		} else if (replies.length > 0) {
			// hidden parent kept only to anchor its still-approved replies
			threads.push({ id: row.id, comment: null, replies });
		}
	}

	return threads;
}

/**
 * Whether a prospective parent is itself a reply, which would make a new reply
 * two levels deep. Used to enforce the one-level nesting rule when the author
 * attaches a reply in the Payload admin.
 */
export function isReplyToReply(
	parent: { parent?: unknown } | null | undefined,
): boolean {
	return parent != null && parent.parent != null;
}
