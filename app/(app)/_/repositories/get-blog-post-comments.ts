"use server";

import { cacheLife, cacheTag } from "next/cache";
import { getPayload } from "payload";
import { rootLogger } from "@/logger";
import { config } from "@/payload/config";
import {
	buildCommentThreads,
	type ThreadableComment,
} from "../helpers/comments";
import {
	PayloadComment,
	type PayloadCommentStatus,
	type PayloadLocale,
	PayloadUser,
} from "./payload-types";

const logger = rootLogger.child({ module: "📥" });

/** A single comment as rendered publicly (internal moderation fields dropped). */
export interface BlogPostComment {
	id: string;
	body: string;
	authorName: string;
	authorGithubUsername: string | null;
	authorAvatarUrl: string | null;
	/** True for the site author's replies — renders the Author badge. */
	isAuthor: boolean;
	createdAt: string;
}

/** A top-level comment (or a placeholder for a hidden one) with its replies. */
export interface BlogPostCommentThread {
	id: string;
	/** Null when the parent is hidden but kept to anchor its author replies. */
	comment: BlogPostComment | null;
	replies: BlogPostComment[];
}

export interface BlogPostComments {
	/** Count of publicly visible comments (top-level plus replies). */
	count: number;
	threads: BlogPostCommentThread[];
}

interface CommentRow extends ThreadableComment, BlogPostComment {
	status: PayloadCommentStatus;
}

const EMPTY: BlogPostComments = { count: 0, threads: [] };

/**
 * Loads the publicly visible comment threads for a post: approved top-level
 * comments (and any hidden parent kept to anchor an approved reply) with their
 * approved author replies, nested one level. Author replies render the site
 * author's identity. Cached per post and busted by the comments collection
 * hook when a comment's approval state changes.
 */
export async function getBlogPostComments({
	slug,
	locale,
}: {
	slug: string;
	locale: PayloadLocale;
}): Promise<BlogPostComments> {
	"use cache";

	cacheLife("hours");
	cacheTag(`blog-post-comments:${slug}`);

	logger.info({ slug }, "Started fetching post comments.");

	const payload = await getPayload({ config });

	const postResult = await payload.find({
		collection: "blog-posts",
		where: {
			slug: { equals: slug },
			_status: { equals: "published" },
		},
		select: { slug: true, author: true },
		depth: 2,
		locale,
		limit: 1,
	});

	const post = postResult.docs[0];

	if (!post) {
		logger.info({ slug }, "No published post; returning no comments.");

		return EMPTY;
	}

	// Author replies render the site author's identity; parse it through the
	// shared schema (as the other repositories do) rather than casting.
	let siteAuthorName: string | null = null;
	let siteAuthorAvatarUrl: string | null = null;

	if (typeof post.author === "object" && post.author !== null) {
		const parsedAuthor = PayloadUser.safeParse(post.author);

		if (parsedAuthor.success) {
			siteAuthorName = parsedAuthor.data.name;
			siteAuthorAvatarUrl = parsedAuthor.data.avatarImage.url;
		} else {
			logger.warn(
				{ slug },
				"Blog post author did not match the expected shape; author replies fall back to stored fields.",
			);
		}
	}

	const commentsResult = await payload.find({
		collection: "comments",
		where: { blogPost: { equals: post.id } },
		select: {
			parent: true,
			authorReply: true,
			status: true,
			body: true,
			authorName: true,
			authorGithubUsername: true,
			authorAvatarUrl: true,
			createdAt: true,
		},
		sort: "createdAt",
		depth: 0,
		limit: 1000,
	});

	const rows: CommentRow[] = commentsResult.docs.map((doc) => {
		const parsed = PayloadComment.parse(doc);
		const isAuthor = parsed.authorReply;

		return {
			id: parsed.id,
			parentId: parsed.parent,
			status: parsed.status,
			body: parsed.body,
			authorName: isAuthor
				? (parsed.authorName ?? siteAuthorName ?? "Author")
				: (parsed.authorName ?? "Anonymous"),
			authorGithubUsername: parsed.authorGithubUsername,
			authorAvatarUrl: isAuthor
				? (parsed.authorAvatarUrl ?? siteAuthorAvatarUrl)
				: parsed.authorAvatarUrl,
			isAuthor,
			createdAt: parsed.createdAt,
		};
	});

	const threads = buildCommentThreads(rows).map((thread) => ({
		id: thread.id,
		comment: thread.comment ? toRendered(thread.comment) : null,
		replies: thread.replies.map(toRendered),
	}));

	const count = threads.reduce(
		(total, thread) => total + (thread.comment ? 1 : 0) + thread.replies.length,
		0,
	);

	logger.info({ slug, count }, "Successfully fetched post comments.");

	return { count, threads };
}

function toRendered(row: CommentRow): BlogPostComment {
	return {
		id: row.id,
		body: row.body,
		authorName: row.authorName,
		authorGithubUsername: row.authorGithubUsername,
		authorAvatarUrl: row.authorAvatarUrl,
		isAuthor: row.isAuthor,
		createdAt: row.createdAt,
	};
}
