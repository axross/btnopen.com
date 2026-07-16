import { auth, currentUser } from "@clerk/nextjs/server";
import type { NextRequest } from "next/server";
import { getPayload } from "payload";
import { hasMatchingCommentCsrfToken } from "@/helpers/comment-csrf";
import { CommentSubmission } from "@/helpers/comments";
import { isSameSiteRequest } from "@/helpers/request-origin";
import { rootLogger } from "@/logger";
import { config } from "@/payload/config";
import { isClerkEnabled } from "@/runtime";

const logger = rootLogger.child({ module: "💬" });

/**
 * Creates a top-level reader comment, pending moderation.
 *
 * This is the only public write path for comments. It authenticates the reader
 * through Clerk, validates the body, snapshots the reader's GitHub identity, and
 * writes via the Payload local API with `status: pending`. It never sets
 * `parent` or `authorReply`, so a reader cannot create a reply or an
 * author-badged comment — those are author-only, in the Payload admin.
 */
export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ slug: string }> },
): Promise<Response> {
	const { slug } = await params;

	// Reject cross-site writes: this authenticated mutation could otherwise be
	// driven from another origin against a signed-in reader's browser (CSRF).
	if (!isSameSiteRequest(request)) {
		return Response.json({ error: "Cross-site request." }, { status: 403 });
	}

	// Defense in depth on top of the same-site check: require a double-submit
	// token issued by `GET .../comments/token`. A cross-site page can read
	// neither the token nor (under SameSite=Strict) the cookie, so it cannot
	// present a matching pair.
	if (!hasMatchingCommentCsrfToken(request)) {
		return Response.json(
			{ error: "Invalid or missing CSRF token." },
			{ status: 403 },
		);
	}

	if (!isClerkEnabled) {
		return Response.json(
			{ error: "Comments are not available." },
			{ status: 503 },
		);
	}

	const { userId } = await auth();

	if (!userId) {
		return Response.json({ error: "Sign in to comment." }, { status: 401 });
	}

	let requestBody: unknown;

	try {
		requestBody = await request.json();
	} catch {
		return Response.json({ error: "Invalid request body." }, { status: 400 });
	}

	const submission = CommentSubmission.safeParse(requestBody);

	if (!submission.success) {
		return Response.json({ error: "Invalid comment." }, { status: 400 });
	}

	const payload = await getPayload({ config });

	const postResult = await payload.find({
		collection: "blog-posts",
		where: {
			slug: { equals: slug },
			_status: { equals: "published" },
		},
		select: { slug: true, isCommentsEnabled: true },
		depth: 0,
		limit: 1,
	});

	const post = postResult.docs[0];

	if (!post || post.isCommentsEnabled === false) {
		return Response.json(
			{ error: "Comments are closed for this post." },
			{ status: 404 },
		);
	}

	const user = await currentUser();
	const githubAccount = user?.externalAccounts?.find(
		(account) =>
			account.provider === "oauth_github" || account.provider === "github",
	);
	const githubUsername = githubAccount?.username ?? user?.username ?? null;

	await payload.create({
		collection: "comments",
		data: {
			blogPost: post.id,
			body: submission.data.body,
			status: "pending",
			authorReply: false,
			authorProviderId: userId,
			authorName:
				user?.fullName ?? githubUsername ?? user?.firstName ?? "GitHub user",
			authorGithubUsername: githubUsername,
			authorAvatarUrl: user?.imageUrl ?? null,
		},
	});

	logger.info({ slug, userId }, "Created a pending reader comment.");

	return Response.json({ status: "pending" }, { status: 201 });
}
