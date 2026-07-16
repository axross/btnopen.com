import type { CollectionConfig, PayloadRequest } from "payload";
import { isReplyToReply, MAX_COMMENT_BODY_LENGTH } from "@/helpers/comments";
import { urlOrigin } from "@/runtime";
import { logger } from "../helpers/logger";

/**
 * Reader comments on blog posts. Reader-created rows are always top-level and
 * start `pending` (invisible until the author approves them in the admin).
 * A `parent` and the `authorReply` badge are set only by the author here in the
 * admin — the public write path never sets them — so replies are author-only
 * and at most one level deep.
 */
export const commentCollection: CollectionConfig = {
	slug: "comments",
	access: {
		// Public REST reads see approved comments only; the site's own render path
		// uses the local API (which bypasses this) and re-filters per post.
		read: ({ req }) => {
			if (req.user) {
				return true;
			}

			return { status: { equals: "approved" } };
		},
		// Public REST writes are locked to authenticated admins. The site's create
		// endpoint writes through the local API, so it is unaffected; this keeps
		// the public `/api/comments` endpoint from accepting unauthenticated rows.
		create: ({ req }) => Boolean(req.user),
		update: ({ req }) => Boolean(req.user),
		delete: ({ req }) => Boolean(req.user),
	},
	fields: [
		{
			name: "blogPost",
			type: "relationship",
			relationTo: "blog-posts",
			required: true,
			index: true,
		},
		{
			name: "parent",
			type: "relationship",
			relationTo: "comments",
			index: true,
			admin: {
				description:
					"Set to reply to a top-level comment. Author-only and limited to one level — a reply cannot have a parent that is itself a reply.",
			},
			validate: async (value: unknown, { req }: { req: PayloadRequest }) => {
				if (!value) {
					return true;
				}

				// A relationship value arrives as the raw id (string or number) or,
				// for polymorphic relations, as a `{ relationTo, value }` pair. Comment
				// ids are numbers here, so `number` must be handled too — otherwise the
				// check silently no-ops and a reply-to-a-reply slips through.
				let parentId: string | number | null = null;

				if (typeof value === "string" || typeof value === "number") {
					parentId = value;
				} else if (
					typeof value === "object" &&
					value !== null &&
					"value" in value
				) {
					const inner = (value as { value: unknown }).value;

					if (typeof inner === "string" || typeof inner === "number") {
						parentId = inner;
					}
				}

				if (parentId === null || parentId === "") {
					return true;
				}

				try {
					const parent = await req.payload.findByID({
						collection: "comments",
						id: parentId,
						depth: 0,
						req,
					});

					if (isReplyToReply(parent)) {
						return "Replies can only be one level deep.";
					}
				} catch {
					// a non-existent id is reported by the relationship field's own
					// existence check; nothing to add here.
				}

				return true;
			},
		},
		{
			name: "authorReply",
			type: "checkbox",
			defaultValue: false,
			admin: {
				description:
					"Author reply. Renders with the site author's identity and an Author badge instead of the reader snapshot fields.",
			},
		},
		{
			name: "body",
			type: "textarea",
			required: true,
			maxLength: MAX_COMMENT_BODY_LENGTH,
		},
		{
			name: "status",
			type: "select",
			required: true,
			defaultValue: "pending",
			index: true,
			options: [
				{ label: "Pending", value: "pending" },
				{ label: "Approved", value: "approved" },
				{ label: "Rejected", value: "rejected" },
			],
		},
		{
			name: "authorProviderId",
			type: "text",
			index: true,
			admin: {
				description:
					"Identity-provider (Clerk) user id of the reader who posted. Empty for author replies.",
			},
		},
		{ name: "authorName", type: "text" },
		{ name: "authorGithubUsername", type: "text" },
		{ name: "authorAvatarUrl", type: "text" },
	],
	// No soft-delete: moderation is expressed through `status` (a rejected
	// comment is hidden but kept), and deleting a post hard-deletes its comments
	// via the blog-post `beforeDelete` hook, so a lingering trashed row can never
	// block that deletion against the required (NOT NULL) blogPost foreign key.
	hooks: {
		afterChange: [
			async ({ doc, previousDoc, req }) => {
				// Only writes that change publicly visible output need a cache bust:
				// a comment becoming (or leaving) `approved`. A fresh pending comment
				// changes nothing public, so it skips the round-trip.
				if (doc.status !== "approved" && previousDoc?.status !== "approved") {
					return;
				}

				await bustCommentCache(doc, req);
			},
		],
		afterDelete: [
			async ({ doc, req }) => {
				await bustCommentCache(doc, req);
			},
		],
	},
	admin: {
		useAsTitle: "body",
		defaultColumns: ["authorName", "status", "body", "createdAt"],
	},
};

/**
 * Busts the public comments cache for the post a comment belongs to, mirroring
 * the blog-post cache-invalidation hook. A miss must never fail the content
 * write, so failures are reported to Sentry rather than thrown.
 */
async function bustCommentCache(
	doc: { blogPost?: unknown },
	req: PayloadRequest,
): Promise<void> {
	// Skip when a cascading post delete already owns the invalidation, so a post
	// with N comments does not fan out N identical cache-bust round-trips.
	if (req.context?.skipCommentCacheBust) {
		return;
	}

	try {
		const blogPostId =
			typeof doc.blogPost === "object" && doc.blogPost !== null
				? (doc.blogPost as { id?: string }).id
				: (doc.blogPost as string | undefined);

		if (!blogPostId) {
			return;
		}

		const post = await req.payload.findByID({
			collection: "blog-posts",
			id: blogPostId,
			depth: 0,
			req,
			select: { slug: true },
		});

		const slug = (post as { slug?: string } | null)?.slug;

		if (!slug) {
			return;
		}

		logger.info(
			{ slug },
			"Started requesting to clear blog post comment cache.",
		);

		await fetch(`${urlOrigin}/posts/${slug}/comments/caches`, {
			method: "DELETE",
		});

		logger.info(
			{ slug },
			"Finished requesting to clear blog post comment cache.",
		);
	} catch (error) {
		const { captureException } = await import("@sentry/nextjs");
		captureException(error);
	}
}
